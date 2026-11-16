# Chess Lens — screenshot to best move

A web app you can install like a normal app. Show it a chessboard (your screen, a screenshot, a saved
image or a phone photo). It finds the board, reads every piece, and asks **Stockfish 17.1** for the
best move. Everything runs on your device. No account is needed, no server is involved, and nothing
gets uploaded.

Live (once merged to `main`): `https://<user>.github.io/Escape/chess/`

## Using it

| Do this | What happens |
|---|---|
| **Scan screen** | The browser asks which screen, window or tab to share. Pick the one showing the board. After that, **Scan again** (or the **S** key) reads the board instantly with no second prompt. |
| **Paste** / **Ctrl+V** | Reads a screenshot that's on your clipboard. |
| **Open image** / drag & drop | Reads a saved screenshot. |
| **Photo** (phone) | Opens the camera. A straight-on photo works best. Drag the corners if needed. |
| Share → Chess Lens (Android, installed) | Send a screenshot straight from your gallery. |

What you get back:

- **Best move** in big letters (e.g. `Nf3`) with a plain-English line under it, like "Knight g1 → f3, check". A green arrow shows the move on the board.
- **Evaluation** (`+1.35`, `−M4`, …) and an eval bar, always from White's point of view.
- **Top lines** (1, 3 or 5) with full continuations.
- **Speak move** (optional) reads the move aloud.
- **Copy FEN** and **Open in Lichess analysis** for going deeper.

If something looks off:

- **Board outline wrong?** Drag the four green corners on the screenshot preview. The board is re-read the moment you let go.
- **A piece is wrong?** Press **Fix squares** (**E**), tap the square and pick the right piece. Squares the app wasn't sure about have an amber dashed outline.
- **Upside down?** Press **Flip** (**F**). The app remembers which side you play (Settings → *I play*).
- **Wrong side to move?** Use the *White to move / Black to move* toggle (**T**). The app guesses the side to move from the last-move highlight on the board. With no highlight, it assumes the side at the bottom (yours). If the other king is in check, it switches sides automatically.

Settings (think time 1/3/8 s, lines, side, voice) are saved in the browser.

> **Fair play:** use it for puzzles, studying, bot games and reviewing finished games. Engine help in
> live games against other people breaks every chess site's rules and gets accounts closed.

## How it works

```
screenshot ──► find board ──► straighten to 256×256 ──► 64 cells × CNN ──► legal-position repair ──► FEN ──► Stockfish (WASM worker)
```

1. **Finding the board** (`vision.js → detectBoard`)
   - **Coarse search:** the screenshot is shrunk to 480 px and every square grid position/size is
     scored by how checkerboard-like it is. Each candidate costs 64 lookups because the cell colours
     are precomputed on a quarter-cell lattice from an integral image.
   - **Snap:** the 7 inner grid lines on each axis are snapped to the full-resolution image. They
     go where the image has *both* light→dark and dark→light edges, which is exactly the pattern
     between two files of a chessboard.
   - **One-square check:** a final check rules out grids that are off by a whole square.
   - On 40 synthetic full-screen screenshots (desktop and phone layouts, cluttered UI) it finds
     40/40 boards to within 1% of the board size, in about 0.2 s.
2. **Reading the pieces** (`vision.js → classifyBoard`). Each 32×32 cell goes through a small CNN
   (3 conv layers + 2 dense, ≈200 k parameters, float16 `model.bin`). The network runs in plain
   JavaScript, and cells that are flat and uniform skip it entirely.
3. **Repair** (`app.js → repair`) uses the network's probabilities to fix impossible readings:
   - exactly one king per side
   - no pawns on the first or last rank
   - the side that just moved can't be in check
4. **Engine**. Stockfish 17.1 "lite" single-threaded WASM (`engine/`) runs in a Web Worker over UCI,
   with MultiPV. The single-threaded build doesn't need cross-origin isolation headers, so it works
   on GitHub Pages.
5. **App shell**. `manifest.webmanifest` and `sw.js` make it installable, let it work offline after
   the first load, and register an Android share target.

### The piece model

The model is trained only on synthetic boards (`train/gen.py`). Each board mixes the following, so
it generalises to piece styles it has never seen:

- 32 open-licensed lichess piece sets
- flat and wood/marble board themes
- last-move highlights, check glows, move dots, capture rings, coordinates and arrows
- re-tinted pieces, drop shadows, JPEG artefacts and crop jitter

```bash
# piece SVGs from lichess-org/lila public/piece/<set>/ rasterised to png/<set>/<piece>.png,
# board textures from public/images/board/ in boards/
python3 train/gen.py png boards tr_0.npz 1100 200 <comma,separated,sets>   # ×N shards
ARCH=24,48,96,128 python3 train/train.py model.bin 6 - tr_*.npz
```

Accuracy measured on piece sets **held out of training**:

- before re-tinting augmentation: 96.9% of squares
- with it: see the PR description

Unfamiliar sets mostly cause queen/king and pawn/knight confusions, which the repair step and
**Fix squares** handle.

## Tests

```bash
node test/detect.test.mjs <fixtures_dir> [model.bin]   # board finding (+ piece accuracy)
python3 test/make_fixtures.py png boards <fixtures_dir> 40 7 merida,staunty,companion,cooke,california
node test/app.e2e.cjs                                  # Playwright: fake chess site → app → Stockfish
```

The end-to-end test screenshots a fake chess site (lichess-style and chess.com-style colours, a
flipped board, coordinates, side panels) and feeds it to the app three ways:

- file input
- a simulated screen-share stream, so **Scan screen** and **Scan again** are covered
- rapid side-to-move toggling

It then checks the exact position read and that Stockfish finds the mate.

## Credits & licences

- Stockfish 17.1 WASM build by Nathan Rugg / Chess.com (`engine/`, GPLv3, see `engine/COPYING.txt`). Source: <https://github.com/nmrugg/stockfish.js>.
- chess.js 1.4.0 by Jeff Hlywa (`vendor/chess.js`, BSD-2-Clause, see `vendor/chess.js.LICENSE`).
- Display pieces: "cburnett" by Colin M.L. Burnett (GPLv2+), as used by lichess.org.
- Training data was rendered from lichess.org piece sets and board textures (see lila's `COPYING.md`). Only the trained weights are shipped.
