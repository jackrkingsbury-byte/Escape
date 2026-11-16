"""Synthetic training data for the square classifier.

Renders random chess boards (many piece sets, flat + textured themes, last-move
highlights, move dots, coordinates, arrows, JPEG artifacts) the same way the app
sees them: the board is resampled to 256x256 and cut into 64 32x32 cells.

usage: python3 gen.py <pieces_png_dir> <boards_dir> <out.npz> <n_boards> <seed> [sets,comma,list]
"""
import io, math, os, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

PIECES = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK']  # label = index + 1
CELL = 32
OUT = CELL * 8

PRESETS = [  # (light, dark) — common site themes
    ('#eeeed2', '#769656'), ('#ebecd0', '#739552'), ('#f0d9b5', '#b58863'), ('#edd6b0', '#b88762'),
    ('#dee3e6', '#8ca2ad'), ('#eae9d2', '#4b7399'), ('#f0f1f0', '#8476ba'), ('#dcdcdc', '#ababab'),
    ('#ffffdd', '#86a666'), ('#ebece8', '#316549'), ('#e8edf9', '#b7c0d8'), ('#d9e4e8', '#7a9db2'),
    ('#f1f6b2', '#59935d'), ('#e6d3b8', '#9b6c4c'), ('#ecdab9', '#ae8a68'), ('#cfd8dc', '#607d8b'),
    ('#f3e5ab', '#c28e5c'), ('#e0c9a6', '#8b5a2b'), ('#d6d6d6', '#6f6f6f'), ('#fce4b2', '#d08b18'),
    ('#e3c16f', '#b88b4a'), ('#c3d4e6', '#5f7ea0'), ('#ffffff', '#c0c0c0'), ('#e9e9e9', '#4f4f4f'),
]
HL = [(155, 199, 0, 105), (255, 255, 51, 128), (246, 246, 105, 200), (186, 202, 43, 200),
      (20, 85, 30, 90), (255, 170, 0, 110), (100, 150, 255, 110), (235, 97, 80, 140), (155, 199, 0, 70)]
ARROWS = [(21, 120, 27, 160), (255, 170, 0, 200), (136, 32, 32, 160), (0, 48, 136, 160), (21, 120, 27, 110)]
BG = [(48, 46, 43), (22, 21, 18), (38, 36, 33), (255, 255, 255), (240, 240, 240), (49, 46, 43), (60, 60, 60)]


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


class Gen:
    def __init__(self, piece_dir, board_dir, sets, seed):
        self.r = random.Random(seed)
        self.np = np.random.default_rng(seed)
        self.sets = {}
        for s in sets:
            self.sets[s] = {p: Image.open(os.path.join(piece_dir, s, p + '.png')).convert('RGBA') for p in PIECES}
        self.textures = [Image.open(os.path.join(board_dir, f)).convert('RGB') for f in sorted(os.listdir(board_dir))]
        self.cache = {}
        self.fonts = [f for f in [
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        ] if os.path.exists(f)]

    def piece(self, s, p, size):
        r = self.r
        sx = r.choice([1.0, 1.0, 0.92, 0.96, 1.04, 1.08])
        rot = r.choice([0, 0, 0, -3, 3])
        k = (s, p, size, sx, rot)
        if k not in self.cache:
            if len(self.cache) > 6000:
                self.cache.clear()
            im = self.sets[s][p]
            if rot:
                im = im.rotate(rot, Image.BICUBIC)
            w = max(4, int(round(size * sx)))
            im = im.resize((w, size), Image.LANCZOS)
            if w != size:  # re-centre on a size×size canvas
                canvas = Image.new('RGBA', (max(w, size), size), (0, 0, 0, 0))
                canvas.alpha_composite(im, ((canvas.size[0] - w) // 2, 0))
                im = canvas.crop(((canvas.size[0] - size) // 2, 0, (canvas.size[0] - size) // 2 + size, size))
            self.cache[k] = im
        im = self.cache[k]
        tf = self._tint[0 if p[0] == 'w' else 1]
        if tf is not None:
            a = np.asarray(im).astype(np.float32)
            a[..., :3] = np.clip(a[..., :3] * tf[0] + tf[1], 0, 255)
            im = Image.fromarray(a.astype(np.uint8), 'RGBA')
        return im

    def theme(self, B):
        r = self.r
        t = r.random()
        if t < 0.25 and self.textures:
            tex = r.choice(self.textures)
            img = tex.resize((B, B), Image.BILINEAR)
            if r.random() < 0.5:  # textures are checkered boards; rotate by 90 would swap parity, so flip instead
                img = img.transpose(Image.FLIP_LEFT_RIGHT).transpose(Image.FLIP_TOP_BOTTOM)
            return img, None
        if t < 0.7:
            light, dark = (hexrgb(x) for x in r.choice(PRESETS))
        else:
            hue = r.random()
            sat = r.uniform(0, 0.6)
            import colorsys
            lv = r.uniform(0.72, 0.98)
            dv = r.uniform(0.3, lv - 0.15)
            light = tuple(int(255 * x) for x in colorsys.hsv_to_rgb(hue, sat * 0.4, lv))
            dark = tuple(int(255 * x) for x in colorsys.hsv_to_rgb(hue + r.uniform(-.05, .05), sat, dv))
        img = Image.new('RGB', (B, B), light)
        d = ImageDraw.Draw(img)
        c = B / 8
        for y in range(8):
            for x in range(8):
                if (x + y) % 2 == 1:
                    d.rectangle([round(x * c), round(y * c), round((x + 1) * c) - 1, round((y + 1) * c) - 1], fill=dark)
        return img, (light, dark)

    def board(self):
        r = self.r
        c = r.randint(22, 112)
        B = c * 8
        img, colors = self.theme(B)
        img = img.convert('RGBA')
        over = Image.new('RGBA', (B, B), (0, 0, 0, 0))
        od = ImageDraw.Draw(over)

        density = r.uniform(0.15, 0.75)
        grid = [[0] * 8 for _ in range(8)]
        for y in range(8):
            for x in range(8):
                if r.random() < density:
                    grid[y][x] = r.randint(1, 12)

        # last-move / selection highlights (drawn under pieces)
        if r.random() < 0.6:
            col = r.choice(HL)
            for _ in range(r.choice([1, 2, 2, 2, 3])):
                x, y = r.randrange(8), r.randrange(8)
                od.rectangle([x * c, y * c, (x + 1) * c - 1, (y + 1) * c - 1], fill=col)
        # hover / premove frame
        if r.random() < 0.08:
            x, y = r.randrange(8), r.randrange(8)
            w = max(2, int(c * 0.05))
            od.rectangle([x * c, y * c, (x + 1) * c - 1, (y + 1) * c - 1], outline=r.choice([(255, 255, 255, 170), (0, 0, 0, 90)]), width=w)
        # check glow
        if r.random() < 0.15:
            ks = [(x, y) for y in range(8) for x in range(8) if grid[y][x] in (6, 12)]
            if ks:
                x, y = r.choice(ks)
                for i in range(10, 0, -1):
                    rad = c * 0.5 * i / 10 * r.uniform(1.0, 1.4)
                    a = int(220 * (1 - i / 10) + 20)
                    od.ellipse([x * c + c / 2 - rad, y * c + c / 2 - rad, x * c + c / 2 + rad, y * c + c / 2 + rad], fill=(255, 0, 0, a // 3))
        img = Image.alpha_composite(img, over)

        # coordinates
        if r.random() < 0.6 and self.fonts:
            d = ImageDraw.Draw(img)
            font = ImageFont.truetype(r.choice(self.fonts), max(6, int(c * r.uniform(0.16, 0.26))))
            files = 'abcdefgh' if r.random() < 0.5 else 'hgfedcba'
            ranks = '87654321' if files[0] == 'a' else '12345678'
            right = r.random() < 0.3
            for i in range(8):
                fx, fy = i, 7
                col = (colors[0] if (fx + fy) % 2 else colors[1]) if colors else (r.choice([(240, 240, 240), (60, 60, 60)]))
                d.text((fx * c + c * 0.92, fy * c + c * 0.98), files[i], fill=col, font=font, anchor='rd')
                rx = 7 if right else 0
                col = (colors[0] if (rx + i) % 2 else colors[1]) if colors else col
                d.text((rx * c + c * 0.06, i * c + c * 0.04), ranks[i], fill=col, font=font, anchor='lt')

        # move dots on empty squares, capture rings on occupied squares
        over = Image.new('RGBA', (B, B), (0, 0, 0, 0))
        od = ImageDraw.Draw(over)
        if r.random() < 0.3:
            dc = r.choice([(20, 85, 30, 128), (0, 0, 0, 36), (0, 0, 0, 60), (60, 60, 60, 110)])
            for _ in range(r.randint(1, 10)):
                x, y = r.randrange(8), r.randrange(8)
                cx, cy = x * c + c / 2, y * c + c / 2
                if grid[y][x] == 0:
                    rad = c * r.uniform(0.1, 0.18)
                    od.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=dc)
                else:
                    w = max(2, int(c * r.uniform(0.06, 0.12)))
                    od.ellipse([x * c + 1, y * c + 1, (x + 1) * c - 2, (y + 1) * c - 2], outline=dc, width=w)
        img = Image.alpha_composite(img, over)

        # pieces
        for y in range(8):
            for x in range(8):
                v = grid[y][x]
                if not v:
                    continue
                s = r.choice(list(self.sets))
                if r.random() < 0.85:  # most boards use one set
                    s = self._set
                scale = r.uniform(0.8, 1.0) if self._big is None else self._big
                size = max(8, int(round(c * scale)))
                pi = self.piece(s, PIECES[v - 1], size)
                ox = int(round(x * c + (c - size) / 2 + r.uniform(-0.02, 0.02) * c))
                oy = int(round(y * c + (c - size) / 2 + r.uniform(-0.02, 0.02) * c))
                if self._shadow:
                    sh = Image.new('RGBA', pi.size, (0, 0, 0, 0))
                    sh.putalpha(pi.getchannel('A').point(lambda v: v * 0.35).filter(ImageFilter.GaussianBlur(max(1, size * 0.03))))
                    img.alpha_composite(sh, (max(0, ox), max(0, oy + max(1, int(size * 0.03)))))
                img.alpha_composite(pi, (max(0, ox), max(0, oy)))

        # arrows over everything
        if r.random() < 0.12:
            over = Image.new('RGBA', (B, B), (0, 0, 0, 0))
            od = ImageDraw.Draw(over)
            for _ in range(r.randint(1, 2)):
                col = r.choice(ARROWS)
                x0, y0, x1, y1 = (r.randrange(8) for _ in range(4))
                p0 = (x0 * c + c / 2, y0 * c + c / 2)
                p1 = (x1 * c + c / 2, y1 * c + c / 2)
                od.line([p0, p1], fill=col, width=max(2, int(c * 0.16)))
                ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
                h = c * 0.4
                od.polygon([p1, (p1[0] - h * math.cos(ang - 0.5), p1[1] - h * math.sin(ang - 0.5)),
                            (p1[0] - h * math.cos(ang + 0.5), p1[1] - h * math.sin(ang + 0.5))], fill=col)
            img = Image.alpha_composite(img, over)

        img = img.convert('RGB')
        return img, grid

    def sample(self):
        r = self.r
        self._set = r.choice(list(self.sets))
        self._big = None if r.random() < 0.5 else r.uniform(0.82, 1.0)
        self._tint = [None, None]
        if r.random() < 0.5:  # restyle piece colours: ivory/grey whites, brown/grey/navy blacks
            g = r.uniform(0.8, 1.02)
            self._tint[0] = (np.array([g * r.uniform(0.94, 1.06) for _ in range(3)], np.float32), np.float32(0))
        if r.random() < 0.5:
            g = r.uniform(0.9, 1.7)
            self._tint[1] = (np.array([g * r.uniform(0.88, 1.12) for _ in range(3)], np.float32),
                             np.array([r.uniform(0, 45)] * 3, np.float32) * np.array([r.uniform(0.7, 1.2) for _ in range(3)], np.float32))
        self._shadow = r.random() < 0.15
        img, grid = self.board()
        B = img.size[0]
        # place on a page background, crop with small misalignment (as auto-detect would)
        m = int(B * 0.06)
        page = Image.new('RGB', (B + 2 * m, B + 2 * m), r.choice(BG))
        page.paste(img, (m, m))
        if r.random() < 0.25:
            buf = io.BytesIO()
            page.save(buf, 'JPEG', quality=r.randint(35, 92))
            page = Image.open(io.BytesIO(buf.getvalue())).convert('RGB')
        if r.random() < 0.1:
            page = page.filter(ImageFilter.GaussianBlur(r.uniform(0.3, 1.0)))
        j = lambda: max(-0.014, min(0.014, r.gauss(0, 0.005))) * B
        box = (m + j(), m + j(), m + B + j(), m + B + j())
        res = r.choice([Image.BILINEAR, Image.BICUBIC, Image.LANCZOS, Image.BOX, Image.BOX])
        if r.random() < 0.08:  # tiny board, then upscaled
            small = int(r.uniform(120, 220))
            page = page.resize((int(page.size[0] * small / B), int(page.size[1] * small / B)), Image.BOX)
            box = tuple(v * small / B for v in box)
        out = page.resize((OUT, OUT), res, box=box)
        a = np.asarray(out, dtype=np.float32)
        if r.random() < 0.3:  # photometric jitter
            a = (a - 128) * r.uniform(0.85, 1.15) + 128 + r.uniform(-18, 18)
            a = a * np.array([r.uniform(0.94, 1.06) for _ in range(3)], dtype=np.float32)
        if r.random() < 0.2:
            a = a + self.np.normal(0, r.uniform(1, 6), a.shape)
        a = np.clip(a, 0, 255).astype(np.uint8)
        cells = a.reshape(8, CELL, 8, CELL, 3).transpose(0, 2, 1, 3, 4).reshape(64, CELL, CELL, 3)
        labels = np.array([grid[y][x] for y in range(8) for x in range(8)], dtype=np.uint8)
        return cells, labels


def main():
    piece_dir, board_dir, out, n, seed = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
    sets = sys.argv[6].split(',') if len(sys.argv) > 6 else sorted(os.listdir(piece_dir))
    g = Gen(piece_dir, board_dir, sets, seed)
    X = np.zeros((n * 64, CELL, CELL, 3), np.uint8)
    Y = np.zeros((n * 64,), np.uint8)
    for i in range(n):
        X[i * 64:(i + 1) * 64], Y[i * 64:(i + 1) * 64] = g.sample()
    np.savez(out, x=X, y=Y)


if __name__ == '__main__':
    main()
