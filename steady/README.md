# STEADY — anger · anxiety · discipline

A single-file, private web toolkit for three things that wreck good days:
anger that turns into aggression, anxiety that won't switch off, and
discipline that fades. Everything lives in one `index.html`: no build step,
no account, no server. Your data stays in your browser (localStorage).

It's a self-help toolkit, not therapy. The page has a **Get help** section
with emergency numbers and crisis lines, and says when to see a professional.

## What's on the page

**Right now.** Three guided step-by-step flows for when it's happening:
- *I'm about to lose my temper*: stop, get distance, slow the body (paced
  breathing), name the feeling, check the story, choose your move.
- *I'm anxious or panicking*: name it, double-sigh breathing, 5-4-3-2-1
  grounding, unhook from the thought, one next step (or park it).
- *I can't make myself start*: shrink it to two minutes, clear one obstacle,
  a five-minute timer, log the start.

A **breathing pacer** in the hero (long exhale 4·6, double sigh, box 4·4·4·4).

**Cool the fire (anger).** The anger cycle diagram, an anger thermometer with
the right move at each level, early-warning-sign picker, a time-out plan,
"check the story", and a *say it straight* builder that turns what you feel
into an assertive sentence.

**Quiet the alarm (anxiety).** Why avoidance backfires (escape vs. stay
diagram), 5-4-3-2-1 grounding, a worry sorter with a daily worry-time list,
a CBT thought record with thinking traps, and a fear ladder for graded
exposure.

**Keep your word to yourself (discipline).** The 66-day habit-formation
figure, a habit builder (after I… I will…) with a 66-day grid and a
"never miss twice" status, urge surfing with a timed wave, and a friction
audit.

**Daily check-in.** Rate anger, anxiety and follow-through each day, plus
sleep and exercise. A 14-day line chart (hover or arrow keys for a day's
numbers, or show it as a table) and simple patterns once you've logged five
days, such as anger after short sleep vs. a full night.

Every claim on the page is sourced; the full list is under **Sources** at the
bottom of the page.

## Run it

Open `index.html` in any browser. On GitHub Pages it is served at
`/Escape/steady/`.

## Data

- Stored only in this browser under the localStorage key `steady_v1`
  (theme under `steady_theme`). Nothing is sent anywhere.
- **Copy backup** puts a JSON backup on the clipboard; **Restore a backup**
  takes it back. **Delete all my data** wipes it (tap twice to confirm).
- The fear ladder and habit builder open with clearly marked example
  entries; the chart shows example data until you've saved two check-ins.
