"""Train the 13-class square classifier (empty + 12 pieces) with JAX on CPU.

usage: python3 train.py <out_weights.bin> <epochs> <val.npz|-> <train1.npz> [train2.npz ...]
Writes a uint16 header (n, then per layer: type 0=conv/1=dense + 4 dims) and float16 weights
(conv HWIO, dense IO), in the order of LAYERS.
"""
import sys, time, json
import numpy as np
import jax, jax.numpy as jnp
import optax

import os
C1, C2, C3, F = (int(v) for v in os.environ.get('ARCH', '24,48,96,128').split(','))
LAYERS = [('c1', (3, 3, 3, C1)), ('c2', (3, 3, C1, C2)), ('c3', (3, 3, C2, C3)), ('f1', (16 * C3, F)), ('f2', (F, 13))]


def init(key):
    p = {}
    for name, shape in LAYERS:
        key, k = jax.random.split(key)
        fan_in = int(np.prod(shape[:-1]))
        p[name + 'w'] = jax.random.normal(k, shape) * np.sqrt(2.0 / fan_in)
        p[name + 'b'] = jnp.zeros(shape[-1])
    return p


def conv(x, w, b):
    y = jax.lax.conv_general_dilated(x, w, (1, 1), 'SAME', dimension_numbers=('NHWC', 'HWIO', 'NHWC'))
    return jax.nn.relu(y + b)


def pool(x):
    return jax.lax.reduce_window(x, -jnp.inf, jax.lax.max, (1, 2, 2, 1), (1, 2, 2, 1), 'VALID')


def forward(p, x, key=None):
    x = x.astype(jnp.float32) / 255.0 - 0.5
    x = pool(conv(x, p['c1w'], p['c1b']))
    x = pool(conv(x, p['c2w'], p['c2b']))
    x = pool(conv(x, p['c3w'], p['c3b']))
    x = x.reshape(x.shape[0], -1)
    x = jax.nn.relu(x @ p['f1w'] + p['f1b'])
    if key is not None:
        keep = jax.random.bernoulli(key, 0.7, x.shape)
        x = jnp.where(keep, x / 0.7, 0)
    return x @ p['f2w'] + p['f2b']


def main():
    out, epochs, valf, files = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4:]
    X = np.concatenate([np.load(f)['x'] for f in files])
    Y = np.concatenate([np.load(f)['y'] for f in files]).astype(np.int32)
    val = np.load(valf) if valf != '-' else None
    print('train', X.shape, np.bincount(Y), flush=True)
    key = jax.random.PRNGKey(0)
    p = init(key)
    bs = 256
    steps = epochs * (len(X) // bs)
    sched = optax.cosine_decay_schedule(2e-3, steps, 0.02)
    opt = optax.chain(optax.clip_by_global_norm(1.0), optax.adamw(sched, weight_decay=1e-4))
    st = opt.init(p)

    def loss_fn(p, x, y, k):
        logits = forward(p, x, k)
        return optax.softmax_cross_entropy_with_integer_labels(logits, y).mean()

    @jax.jit
    def step(p, st, x, y, k):
        l, g = jax.value_and_grad(loss_fn)(p, x, y, k)
        u, st = opt.update(g, st, p)
        return optax.apply_updates(p, u), st, l

    pred = jax.jit(lambda p, x: jnp.argmax(forward(p, x), -1))

    def evaluate(Xv, Yv):
        P = np.concatenate([np.asarray(pred(p, Xv[i:i + 2048])) for i in range(0, len(Xv), 2048)])
        acc = (P == Yv).mean()
        boards = (P.reshape(-1, 64) == Yv.reshape(-1, 64)).all(1).mean()
        return acc, boards, P

    rng = np.random.default_rng(0)
    for ep in range(epochs):
        t = time.time()
        idx = rng.permutation(len(X))
        tot = 0
        for i in range(len(X) // bs):
            b = idx[i * bs:(i + 1) * bs]
            xb = X[b]
            flip = rng.random(bs) < 0.5
            xb[flip] = xb[flip, :, ::-1]
            perm = rng.random(bs) < 0.5  # random colour-channel order: board/piece hues are not the signal
            if perm.any():
                order = rng.permutation(3)
                xb[perm] = xb[perm][..., order]
            key, k = jax.random.split(key)
            p, st, l = step(p, st, xb, Y[b], k)
            tot += float(l)
        msg = f'epoch {ep} loss {tot / (len(X) // bs):.4f} {time.time() - t:.0f}s'
        if val is not None:
            acc, bacc, P = evaluate(val['x'], val['y'].astype(np.int32))
            msg += f' | holdout square acc {acc:.4f} full-board acc {bacc:.3f}'
        print(msg, flush=True)
    if val is not None:
        _, _, P = evaluate(val['x'], val['y'].astype(np.int32))
        Yv = val['y'].astype(np.int32)
        cm = np.zeros((13, 13), int)
        np.add.at(cm, (Yv, P), 1)
        print('confusion (rows=true):\n' + '\n'.join(' '.join(f'{v:5d}' for v in r) for r in cm))
    header = [len(LAYERS)]
    for n, shape in LAYERS:
        header += [0 if n[0] == 'c' else 1] + list(shape) + [0] * (4 - len(shape))
    blob = np.asarray(header, np.uint16).tobytes() + b''.join(np.asarray(p[n + s], np.float16).tobytes() for n, _ in LAYERS for s in 'wb')
    open(out, 'wb').write(blob)
    print('wrote', out, len(blob), 'bytes')


if __name__ == '__main__':
    main()
