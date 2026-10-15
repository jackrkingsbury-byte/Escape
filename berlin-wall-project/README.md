# The Berlin Wall, 1961–1989 — source evidence pack

A print-and-cut pack of ten real historical sources on the Berlin Wall, for a school
history chart. Every source is a genuine document held in a named archive, every
quotation was checked against the archive page, and every source has a working web
address.

## What to open

| File | What it is |
|---|---|
| **`berlin-wall-photos.html`** | **The photographs.** Open in a browser: 11 archive photos, each with the explanation underneath. Print it as-is. |
| `berlin-wall-sources.pdf` | The fuller pack — 10 pages, A4, definitions and source cards to cut out. |
| `photo-sheet.html` | The 8 photos sized to cut out and glue into the source-card slots. |
| `berlin-wall-sources.docx` | The same content in Word, if you want to edit the wording. |
| `berlin-wall-sources.html` | The source file the PDF is built from. |
| `make_docx.py` | Regenerates the .docx. |

## How to use it

1. Print `berlin-wall-sources.pdf` on A4, in colour if you can — the coloured badges
   are what let you sort the sources by type on the chart.
2. Cut along the dashed lines. Every dashed box is meant to be cut out.
3. Open `photo-sheet.html` in a browser (you need to be online the first time), print it
   with **background graphics turned on**, and glue each photo into its matching slot
   (P1–P8) on the source cards.
4. Lay the cards out using the master chart on page 9: group by **source type**, run
   left-to-right by **year**.

## What is in the pack

- **Page 2** — 14 definitions to cut out (primary/secondary, provenance, bias,
  reliability, corroboration, utility, propaganda, plus the Berlin Wall terms).
- **Pages 3–7** — the ten source cards. Each has the source type, year, origin, a quoted
  extract of the actual evidence, what it shows, how reliable it is, a full citation, and
  a slot for its photograph.
- **Page 8** — two diagrams drawn for this project: a labelled cross-section of the
  border strip with real measurements, and a map of the four occupation sectors.
- **Page 9** — a timeline showing where each source falls, and the master chart.
- **Page 10** — the full source list with web addresses.

## The ten sources

| # | Type | Year | Side |
|---|---|---|---|
| S1 | Press conference — Ulbricht, "Nobody intends to put up a wall" | 15 Jun 1961 | East Germany |
| S2 | Secret record — Khrushchev–Ulbricht conversation | 1 Aug 1961 | USSR / GDR |
| S3 | Newspaper — *Neues Deutschland* front page | 14 Aug 1961 | East Germany |
| S4 | Propaganda pamphlet — "In Praise of the Berlin Wall" | 1961 | East Germany |
| S5 | Military report — the shooting of Peter Fechter | 17 Aug 1962 | East Germany |
| S6 | Speech — Kennedy, "Ich bin ein Berliner" | 26 Jun 1963 | USA / West |
| S7 | Statistics — East-to-West migration figures | 1949–1990 | Research |
| S8 | Speech — Reagan, "tear down this wall" | 12 Jun 1987 | USA / West |
| S9 | Government decree — "Schabowski's note" | 9 Nov 1989 | East Germany |
| S10 | Research database — victims at the Wall | 2017–19 | Research |

The set is deliberately balanced: both sides are represented, nine different source
types appear, and it spans the whole period. The sharpest point it makes is that S1 and
S2 are *both East German* and flatly contradict each other — what the government said
in public versus what it said in private.

## About the photographs

The photographs are not embedded in the PDF, because this build environment could not
reach the image archives to download them. `photo-sheet.html` solves that: it loads the
eight photographs straight from Wikimedia Commons when you open it on your own machine,
with the photographer, date and licence printed under each one.

All eight are free to reuse for schoolwork — the CIA photographs are public domain
(works of the US federal government) and the Bundesarchiv photographs are CC BY-SA and
must credit the Bundesarchiv. No images were generated or invented.

## Rebuilding

```sh
# PDF
chromium --headless --no-pdf-header-footer \
  --print-to-pdf=berlin-wall-sources.pdf berlin-wall-sources.html

# Word
pip install python-docx && python3 make_docx.py
```
