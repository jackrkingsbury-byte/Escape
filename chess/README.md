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
| **Android app:** floating ♞ button | Works over **any app** (Chess.com app, Lichess app, …). Tap ♞ and the best move pops up in a card at the top of the screen. See [Phones](#phones). |
| **iPhone:** double-tap the back | A Shortcut screenshots your chess app and opens Chess Lens, then one tap reads it. See [Phones](#phones). |

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

## Play vs Stockfish (`play.html`)

Play a full game against Stockfish at any of 10 strengths. The ratings are rough.

| Level | Name | Rating |
|---|---|---|
| 1 | Beginner | ≈400 |
| 2 | Novice | ≈700 |
| 3 | Casual | ≈1000 |
| 4 | Club player | 1350 |
| 5 | Strong club | 1600 |
| 6 | Expert | 1850 |
| 7 | Candidate master | 2100 |
| 8 | Master | 2400 |
| 9 | Grandmaster | 2700 |
| 10 | Stockfish | full strength |

Levels 4–9 use Stockfish's own rating limit. Levels 1–3 sit below its 1320 floor, so they use
Skill Level plus a shallow search.

- **Moving:** drag pieces or tap-tap. Legal moves show as dots, and promotion opens a piece picker.
  Check, checkmate, stalemate, repetition, the 50-move rule and insufficient material are all
  handled.
- **💡 Hint (H):** the first press shows which piece to move. The second press shows the move as
  an arrow. Hints used are counted.
- **Coach:** a second Stockfish at full strength rates every one of your moves. It uses lichess's
  winning-chance thresholds: Best, Excellent, Good, Inaccuracy, Mistake or Blunder. It also says
  what was better, e.g. "Kf2 costs you (+10.4 → −M8). Better was Qxd5." The move list marks each
  rating, the game-over card sums them up, and the eval bar can be turned on or off.
- **Game controls:** **Take back (U)**, **Flip (F)**, **Resign**, and **New game (N)** as White,
  Black or random. You can change the strength mid-game.
- **Saving and review:** the game is saved and resumes after a reload. **Copy PGN** and **Review on
  Lichess** work at any time.
- **Play from a scan:** after a scan, **Play from here vs Stockfish** starts a game from the scanned
  position, with you as the side to move.
- **Code:** `board.js` is the interactive board and `play.js` is the game logic. `engine.js` takes
  per-search UCI options.

## Phones

Websites can't record the screen on phones, so on a phone, Chess Lens reaches into other apps in
these ways.

**Android: the Chess Lens app** (`android/`). It has a floating ♞ button that sits over every app.

1. Download [`android/ChessLens.apk`](android/ChessLens.apk) on the phone and open it. Android asks
   you to allow your browser to install apps. The app isn't on the Play Store.
2. Open **Chess Lens** and tap **Start the floating Scan button**.
   1. Allow **Display over other apps**, then come back.
   2. Tap **Start now** on Android's screen-sharing prompt. Pick **Entire screen**, or pick your chess app.
3. Open your chess app and tap ♞. A card at the top shows:
   - the best move and eval
   - a plain-English description
   - the top lines
   - buttons for **Other side to move**, **Flip board** and **Fix in app**
4. Drag ♞ anywhere you like. To stop, use **Stop** in the notification or the button in the app.

How the app works:

- It's a small Java shell around the exact same web app. `AssetServer` serves the bundled files on
  `127.0.0.1`, so the recognition code, Stockfish worker and WASM run unchanged.
- `ScanService` keeps one MediaProjection screen-capture session. It shows the ♞ button and the
  result card as overlay windows.
- On each tap it hides its own views and grabs the newest frame as a JPEG. It then gives the frame
  to a hidden 1 px WebView running the page in `?overlay=1` mode, through
  `window.chessLensScan(url)`. Results come back through `ChessLensAndroid.onResult(json)`: live
  updates while Stockfish thinks, then the final move.
- Pieces you correct in the app are remembered for floating scans too, because both pages share
  the same storage.

Build it with plain SDK tools, no Gradle. You need a JDK and an Android SDK with
`platforms;android-34` and `build-tools;34.0.0`:

```bash
ANDROID_HOME=/path/to/sdk CHESSLENS_KEYSTORE=~/chesslens.jks android/build.sh   # → android/ChessLens.apk
```

The signing key isn't in the repo. An APK built with a different key won't install over an
existing one: uninstall the old app first.

**iPhone: Back Tap shortcut.** Apple doesn't let any app outside the App Store read another app's
screen. So:

1. In **Shortcuts**, make a shortcut with three actions:
   - **Take Screenshot**
   - **Copy to Clipboard**
   - **Open URLs** → `…/chess/?paste=1`
2. Go to Settings → Accessibility → Touch → **Back Tap** → **Double Tap**, and pick that shortcut.
3. In your chess app, double-tap the back of the phone. Chess Lens opens with a big **Read
   screenshot** button: tap it, then **Paste**.

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

Accuracy, measured with 5 piece sets **held out of training** (merida, staunty, companion, cooke and
california). The shipped model is then retrained on all 32 sets.

| | Per square |
|---|---|
| Unseen sets, first recipe (narrower net, no re-tinting) | 96.9% |
| Unseen sets, current recipe | 97.0–97.5% |
| Boards drawn entirely in one unseen set | 95.7% |
| Same boards after teaching from one corrected board (*Fix squares*, kNN on CNN features) | 97.9% |

- **Common misses on unfamiliar sets:** queen ↔ king, and pawn ↔ bishop/knight. The repair step
  catches most king mix-ups, and **Fix squares** plus learning handles the rest.
- **Sets in training,** like lichess's default `cburnett`, are read exactly in the end-to-end tests.
- **Speed in Node:** about 0.2 s to find the board and 0.35 s to read a crowded board.

## Tests

```bash
node test/detect.test.mjs <fixtures_dir> [model.bin]   # board finding (+ piece accuracy)
python3 test/make_fixtures.py png boards <fixtures_dir> 40 7 merida,staunty,companion,cooke,california
node test/app.e2e.cjs                                  # Playwright: fake chess site → app → Stockfish
node test/play.e2e.cjs                                 # Play vs Stockfish: moves, hints, coach, take back, mate, promotion, resume
node test/android-bridge.e2e.cjs                       # the Android app's server + floating-scan protocol, on a desktop JVM
```

The end-to-end test screenshots a fake chess site (lichess-style and chess.com-style colours, a
flipped board, coordinates, side panels) and feeds it to the app three ways:

- file input
- a simulated screen-share stream, so **Scan screen** and **Scan again** are covered
- rapid side-to-move toggling

It then checks the exact position read and that Stockfish finds the mate.

`android-bridge.e2e.cjs` runs the app's Java `AssetServer` on a desktop JVM and drives the hidden
scanner page the way `ScanService` does. It checks:

- the screenshot is read and the best move comes back
- live updates arrive while Stockfish thinks
- a new screenshot is picked up
- **Other side to move** and **Flip board** work
- "no board found" is reported
- **Fix in app** reopens the screenshot
- WASM is served as `application/wasm`

The Android-only parts weren't run on a device: the MediaProjection capture and the overlay windows.

## Credits & licences

- Stockfish 17.1 WASM build by Nathan Rugg / Chess.com (`engine/`, GPLv3, see `engine/COPYING.txt`). Source: <https://github.com/nmrugg/stockfish.js>.
- chess.js 1.4.0 by Jeff Hlywa (`vendor/chess.js`, BSD-2-Clause, see `vendor/chess.js.LICENSE`).
- Display pieces: "cburnett" by Colin M.L. Burnett (GPLv2+), as used by lichess.org.
- Training data was rendered from lichess.org piece sets and board textures (see lila's `COPYING.md`). Only the trained weights are shipped.
