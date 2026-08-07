# Escape Clause

Paste a contract. See the clauses that cost you money, quoted from your own document.
Get the last date you can cancel, and the letter that does it.

No build step, no backend, no dependencies, no network calls. Open `escape/index.html`.

## Why this one

`research/WHAT-PEOPLE-ACTUALLY-BUY.md` reaches two conclusions this project is built around:

1. **Distribution is the bottleneck, not the product.** Median Gumroad creator: $72/month.
   44% earn zero. The winners had an audience first.
2. **Tools whose output is shareable pull users in without paid ads.**

And `research/RED-TEAM-KILL-MEMO.md` names the failure mode that kills trust instantly:
*"confidently wrong about money → trust dies in one quote."*

So the design constraints came first, and the product was chosen to fit them:

| Constraint | How this meets it |
|---|---|
| Cannot be confidently wrong | No model. A finding exists only if a sentence in the input produced it, and that sentence is shown |
| Zero buyer friction | Paste → verdict. Nothing to install, connect, or sign up for |
| Sells a feeling, not a feature | "You're trapped, here's the exit and the deadline" — fear, then relief |
| Output is shareable | A verdict card and a link, neither of which carries any contract text |
| Founder can reach the audience | Everyone has signed something. No trade network or B2B credibility needed |

## What it does

**Finds 21 clause types** that move money or freedom onto the person signing — auto-renewal,
notice periods, early-termination fees, escalation, unilateral change, indemnity, liability caps,
IP assignment, non-competes, suretyship, acceleration, and the rest. Each finding shows the
sentence it came from.

**Pulls out the numbers** — notice period, exit fee, annual increase, minimum term, late interest —
and normalises them ("thirty (30) days" → 30, "R1 200,00" → 1200, "9,5 per cent" → 9.5).

**Says who each clause binds.** A contract with 6 clauses binding you and 3 binding them is the
real story, and it is a story a score alone cannot tell.

**Scores it 0–100**, itemised. Every point added or subtracted is shown with its reason. A contract
with mutual termination, a capped increase, a cooling-off period or a pro-rata refund earns points
back — the engine has to be able to say "this one is fair", or it is only a fear generator.

**Computes the deadline.** Given the notice period and the renewal date: the last safe day to send,
with a delivery margin, and an honest answer when the window has already closed.

**Writes the letter** — cancellation, objection to an increase, dispute of an exit fee, or a demand
for the full terms — quoting their own clause back at them, with instructions for sending it so
that delivery can be proved.

## What it deliberately does not do

- **It is not legal advice** and does not know your country's consumer law.
- **It can miss things.** It matches known patterns; unusual drafting will slip past. Absence of a
  finding is not proof of absence — which is why the "what it does not say" section is worded as
  questions to ask, not conclusions.
- **It never invents a clause.** This is the one guarantee it does make, and it is enforced by
  construction rather than by prompt: `scan()` can only emit a finding from a sentence it matched,
  and it attaches that sentence. If a quote is not in your document, the finding is wrong and the
  page tells the reader to ignore it.

## Privacy

There is no server. The scan, the letter and the card are all built in the browser; the contract
never leaves the page. The end-to-end test asserts this — it fails the build if the page makes
**any** network request.

The share link encodes only `{score, band, type, counts, clause-type ids}`. A test decodes the
payload and fails if any contract text appears in it.

## Files

```
engine.js        detection, extraction, party attribution, scoring. No DOM.
letter.js        deadline arithmetic and letter generation. No DOM.
samples.js       four fictional contracts for the demo buttons
index.html       the page (loads the three above)
app.css          stylesheet
test/engine.test.mjs   95 unit tests, pure node, no browser
test/page.test.mjs     46 end-to-end tests (Playwright)
```

`engine.js` and `letter.js` load as plain scripts (`window.EscapeEngine`, `window.EscapeLetter`)
or via `require()` in node, so the tests exercise the same code the page runs.

## Tests

```
node escape/test/engine.test.mjs     # 95 assertions, ~1s
node escape/test/page.test.mjs       # 46 assertions, needs Playwright
```

The suites are written to hold the promises above, not just the happy path — that a clean contract
produces no findings, that every quote appears verbatim in the source, that the itemised points
reproduce the score exactly, that a malformed share link is ignored rather than crashing, and that
nothing is ever sent anywhere.

## The honest part about money

The scanner is finished and it works. That is the part that was buildable in an afternoon, and it
is not the part that decides whether this earns anything. Per the repo's own research, the variable
that separates the winners from the 44% who earn zero is distribution, and this project does not
yet have any.

What it does have is a mechanic aimed squarely at that problem: every scan produces an artefact
someone might post, and the thing being posted ("my gym contract scored 3/100") is more interesting
than the tool. That is a hypothesis, not a result.

**The obvious paid upgrade, when there is traffic to sell to**, is the escape letter as a finished
job rather than a template: posted for you with proof of delivery, a reminder set for the deadline,
and a follow-up if they do not reply within 7 days. That is a painkiller people already pay for,
priced per letter, with no subscription and no account to create. It should not be built until the
free scanner has users — building the checkout first is the mistake this repo has already made
twice, documented in `research/`.

The first real test is cheap and takes a day: post one verdict card where people complain about
gym contracts and debit orders, and count whether anyone asks for the letter.
