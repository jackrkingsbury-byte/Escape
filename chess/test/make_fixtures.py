"""Fake full-screen screenshots (board + page clutter) with ground truth, for vision tests.

usage: python3 make_fixtures.py <pieces_png_dir> <boards_dir> <out_dir> <n> <seed> <sets,comma,list>
Writes <i>.rgba (raw RGBA bytes), <i>.png and <i>.json {width,height,quad,labels}.
"""
import json, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'train'))
import gen  # noqa: E402

FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'


def page(r, W, H):
    bg = r.choice([(49, 46, 43), (22, 21, 18), (38, 36, 33), (246, 246, 246), (255, 255, 255), (32, 34, 37)])
    im = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(im)
    font = ImageFont.truetype(FONT, r.randint(12, 22)) if os.path.exists(FONT) else None
    fg = (220, 220, 220) if sum(bg) < 380 else (40, 40, 40)
    for _ in range(r.randint(4, 14)):  # panels / buttons
        x0, y0 = r.randrange(W), r.randrange(H)
        d.rectangle([x0, y0, x0 + r.randint(40, 500), y0 + r.randint(20, 200)],
                    fill=tuple(max(0, min(255, v + r.randint(-30, 30))) for v in bg))
    for _ in range(r.randint(10, 40)):  # text (move list, chat)
        d.text((r.randrange(W), r.randrange(H)), r.choice(['1. e4 e5', 'Nf3 Nc6', 'Bb5 a6', 'Player (1500)', '10:00', 'Chat', 'Resign', 'O-O']), fill=fg, font=font)
    return im


def main():
    piece_dir, board_dir, out, n, seed, sets = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6].split(',')
    os.makedirs(out, exist_ok=True)
    r = random.Random(seed)
    g = gen.Gen(piece_dir, board_dir, sets, seed)
    for i in range(n):
        mobile = r.random() < 0.3
        W, H = (1080, 2340) if mobile else r.choice([(1920, 1080), (1600, 900), (1366, 768), (2560, 1440)])
        im = page(r, W, H)
        g._set = r.choice(sets)
        g._big = r.uniform(0.85, 1.0)
        g._tint, g._shadow = [None, None], False
        board, grid = g.board()
        B = W if mobile else int(r.uniform(0.4, 0.92) * H)
        board = board.resize((B, B), Image.LANCZOS)
        x0 = 0 if mobile else r.randint(0, W - B)
        y0 = r.randint(int(H * 0.15), int(H * 0.5)) if mobile else r.randint(0, H - B)
        im.paste(board, (x0, y0))
        im.save(os.path.join(out, f'{i}.png'))
        open(os.path.join(out, f'{i}.rgba'), 'wb').write(np.asarray(im.convert('RGBA')).tobytes())
        json.dump({'width': W, 'height': H, 'quad': [[x0, y0], [x0 + B, y0], [x0 + B, y0 + B], [x0, y0 + B]],
                   'labels': [grid[y][x] for y in range(8) for x in range(8)], 'set': g._set},
                  open(os.path.join(out, f'{i}.json'), 'w'))


if __name__ == '__main__':
    main()
