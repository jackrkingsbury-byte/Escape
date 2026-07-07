# Pivot Analysis — NeverMiss (skeptical VC teardown)

## Verdict: partial pivot — keep the mission, change the mechanism
The mission ("never lose a lead" / speed-to-lead for SA local service SMBs) is
sound and among the best problems on the board. The **mechanism** — "AI replies
on *your* WhatsApp" — is the weakest part and has a technical dealbreaker.

## The fatal flaw in the original mechanic
Automating WhatsApp legally requires the **WhatsApp Business API (Cloud API)**,
and a number on the API **can no longer be used in the normal WhatsApp app.**
Tradespeople live in that app. So either you take over their main number (kills
the app they use all day — nobody agrees) or you give them a **new** number
(their existing customers, Google listing, van, and ads still point at the old
number, so you capture almost nothing). The linked-device trick is *manual only*;
automating the WhatsApp **app** via unofficial tools breaks Meta's ToS and gets
numbers banned.

## Why it could fail
1. The mechanic above.
2. No moat — AI-replies-to-WhatsApp is a weekend build; Meta + Yoco are entering SA.
3. Offline-trade distribution as a solo 16-year-old; brutal SME churn.
4. Wrong leak — missed **phone calls** are bigger and more measurable than missed WhatsApps for trades.
5. AI mistakes on money kill trust.

## What makes a customer hesitate
"Do I change my number?", "It's free on PopPay / Yoco's coming", "I don't trust
a bot as me", "a kid built this", "I answer WhatsApp fine" (they don't).

## Ranked models for "missed leads" (avg of Sell / Build / Scale / MRR / Moat, /100)
| Model | Sell | Build | Scale | MRR | Moat | Avg |
|---|---|---|---|---|---|---|
| **Missed-call text-back** (forward → auto text) | 78 | 80 | 80 | 70 | 45 | **71** |
| Speed-to-lead on paid-ad leads (dedicated AI number) | 78 | 60 | 78 | 74 | 58 | **70** |
| Vertical speed-to-lead OS (one niche) | 70 | 55 | 75 | 78 | 66 | **69** |
| AI voice receptionist | 75 | 40 | 75 | 80 | 55 | **65** |
| Managed lead-response service (concierge) | 80 | 78 | 45 | 72 | 45 | **64** |
| SMS auto-responder | 60 | 78 | 78 | 60 | 40 | **63** |
| CRM / lead-mgmt add-on | 40 | 55 | 70 | 72 | 55 | **58** |
| Lead-gen (sell them leads) | 85 | 45 | 55 | 55 | 45 | **57** |
| **NeverMiss (AI auto-reply on their WhatsApp)** | 55 | 45 | 70 | 70 | 40 | **56** |
| AI website chat widget | 40 | 75 | 75 | 55 | 30 | **55** |
| Booking/scheduling link | 45 | 78 | 75 | 45 | 30 | **55** |
| Shared team inbox | 55 | 50 | 60 | 60 | 40 | **53** |
| Human answering service (BPO) | 75 | 35 | 35 | 75 | 45 | **53** |

Original mechanic ranks **9th**. Top options all avoid the WhatsApp-takeover trap.

## Recommendation
**Speed-to-lead for SA service businesses via a dedicated AI number (on their
ads/Google) + missed-call text-back — not by taking over their personal
WhatsApp.** Keep the NeverMiss brand and site. Change the promise to *"catch
every missed call and enquiry — answered and booked in seconds, on a number you
put on your ads."* Start as a managed service for cashflow/proof, then
productize.

## The build change
Lead with **missed-call text-back**: their phone forwards-on-no-answer to a
Twilio number → we instantly SMS the caller → the existing AI agent qualifies
and books over SMS. No app takeover, no number change, biggest measurable leak.
WhatsApp/voice follow-up layer on *our* number later. (Implemented in
`nevermiss/app/api/voice/incoming` + `/api/sms/inbound`, reusing `lib/agent`.)
