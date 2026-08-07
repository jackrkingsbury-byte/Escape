/* Pure-node tests for the detection engine and the letter builder.
   No browser, no network. Run: node escape/test/engine.test.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../engine.js');
const L = require('../letter.js');

let failures = 0, count = 0;
const ok = (c, m, extra = '') => {
  count++;
  console.log(`${c ? 'PASS' : 'FAIL'}  ${m}${extra ? '  ← ' + extra : ''}`);
  if (!c) failures++;
};
const group = t => console.log(`\n── ${t} ──`);
const has = (scan, id) => scan.findings.some(f => f.id === id);
const find = (scan, id) => scan.findings.find(f => f.id === id);

/* ═══════════ extraction primitives ═══════════ */
group('duration extraction');
ok(E.extractDuration('thirty (30) days written notice').days === 30, 'thirty (30) days → 30');
ok(E.extractDuration('one (1) calendar month').days === 30, 'one (1) calendar month → 30 days');
ok(E.extractDuration('two months notice').days === 60, 'two months → 60 days');
ok(E.extractDuration("90 days' notice").days === 90, "90 days' → 90");
ok(E.extractDuration('a period of 24 months').days === 720, '24 months → 720 days');
ok(E.extractDuration('no duration here') === null, 'no duration → null');

group('money extraction');
ok(E.extractMoney('a fee of R1 200,00 is payable').value === 1200, 'R1 200,00 → 1200 (SA format)');
ok(E.extractMoney('a fee of R1,200.00 is payable').value === 1200, 'R1,200.00 → 1200 (US format)');
ok(E.extractMoney('ZAR 4500 penalty').value === 4500, 'ZAR 4500 → 4500');
ok(E.extractMoney('$500 charge').currency === '$', '$500 keeps its currency');
ok(E.extractMoney('no money here') === null, 'no money → null');

group('percent extraction');
ok(E.extractPercent('increase of 12% annually').value === 12, '12% → 12');
ok(E.extractPercent('escalate by 7,5 per cent').value === 7.5, '7,5 per cent → 7.5');
ok(E.extractPercent('linked to CPI').text === 'CPI-linked', 'CPI recognised without a number');

/* ═══════════ sentence splitting ═══════════ */
group('sentence splitting');
const split = E.splitSentences('3.2 The Member shall give notice. 3.3 The fee is R1 200,00.\n4. Renewal is automatic.');
ok(split.length === 3, 'numbered clauses split into 3 sentences', `got ${split.length}`);
ok(split[0].clause === '3.2', 'clause number captured', String(split[0].clause));
ok(!split.some(s => /^\d+$/.test(s.text.trim())), 'no fragment is a bare number');
const decimals = E.splitSentences('The rate is 7.5 percent per annum and applies monthly.');
ok(decimals.length === 1, 'a decimal does not split the sentence', `got ${decimals.length}`);

/* ═══════════ party detection ═══════════ */
group('who does the clause bind');
ok(E.partyOf('The Member shall pay a cancellation fee.') === 'you', 'Member → you');
const svcRoles = E.buildRoles('The Contractor shall deliver. The Client shall pay.');
ok(E.partyOf('The Client may terminate at any time.', svcRoles) === 'them', 'in a services contract, Client → them');
ok(E.partyOf('The Client may terminate at any time.', E.buildRoles('gym membership')) === 'you', 'with no contractor in the document, Client → you');
ok(E.partyOf('The Company may amend these terms.') === 'them', 'Company → them');
ok(E.partyOf('Either party may terminate on notice.') === 'both', 'either party → both');
ok(E.partyOf('You agree to indemnify us against all claims.') === 'you', 'you agree → you');

/* ═══════════ the core promise: no invented findings ═══════════ */
group('a clean document produces no traps');
const clean = `
1. This agreement runs for one month at a time.
2. Either party may terminate at the end of any month by written notice.
3. The price is R300 per month and is fixed for the duration of this agreement.
4. Any unused portion is refunded pro-rata on cancellation.
5. Neither party limits its liability under this agreement.
6. This agreement is between the supplier and the customer for gardening services rendered weekly.
`;
const cleanScan = E.scan(clean);
ok(cleanScan.ok, 'clean document scans');
ok(!has(cleanScan, 'indemnity'), 'no indemnity invented');
ok(!has(cleanScan, 'early_termination_fee'), 'no exit fee invented');
ok(!has(cleanScan, 'auto_renew'), 'no auto-renewal invented');
ok(cleanScan.credits.some(c => c.id === 'mutual_termination'), 'mutual termination credited');
ok(cleanScan.credits.some(c => c.id === 'pro_rata_refund'), 'pro-rata refund credited');
ok(cleanScan.score >= 80, `clean document scores Fair (got ${cleanScan.score})`);

group('every finding is backed by a real sentence from the input');
const gym = `
MEMBERSHIP AGREEMENT
1.1 The Member agrees to a minimum term of twenty four (24) months from the commencement date.
2.1 The membership fee is R549,00 per month, collected by debit order on the first day of each month.
2.2 The fee shall increase annually by 9,5% on each anniversary of the commencement date.
3.1 This agreement shall automatically renew for successive periods of twelve (12) months.
3.2 The Member must give the Club thirty (30) days written notice to cancel.
3.3 Should the Member cancel before the end of the minimum term, an early termination fee of R3 500,00 becomes immediately due and payable.
4.1 The Club may amend these terms at its sole discretion from time to time.
4.2 The Member indemnifies the Club against all claims arising from use of the facilities.
4.3 The total liability of the Club shall not exceed the fees paid in the preceding month.
5.1 The Club may cede and assign its rights under this agreement to any third party without the Member's consent.
6.1 All fees paid are non-refundable.
`;
const g = E.scan(gym);
ok(g.ok, 'gym contract scans');
const everyQuoteInSource = g.findings.every(f => gym.replace(/\s+/g, ' ').includes(f.quote.replace(/\s+/g, ' ').slice(0, 40)));
ok(everyQuoteInSource, 'every finding quotes text that appears in the source');
ok(g.findings.every(f => f.quote && f.quote.length > 10), 'every finding carries evidence');

group('gym contract — the traps that cost money');
['min_term', 'price_escalation', 'auto_renew', 'notice_period', 'early_termination_fee',
  'unilateral_change', 'indemnity', 'liability_cap', 'assignment_transfer',
  'non_refundable', 'debit_order'].forEach(id => ok(has(g, id), `found: ${id}`));

group('gym contract — the numbers that matter');
ok(g.terms.noticeDays === 30, `notice period extracted as 30 days (got ${g.terms.noticeDays})`);
ok(find(g, 'early_termination_fee').detail.exitFee.value === 3500, 'exit fee extracted as R3 500');
ok(find(g, 'price_escalation').detail.increasePercent.value === 9.5, 'increase extracted as 9,5%');
ok(g.terms.minTermDays === 720, `minimum term extracted as 24 months (got ${g.terms.minTermDays})`);
ok(g.type.id === 'gym', `contract type detected as gym (got ${g.type.id})`);

group('gym contract — asymmetry and score');
ok(g.asymmetry.you > 0 && g.asymmetry.them > 0, 'clauses attributed to both sides');
ok(g.score < 40, `a contract this loaded scores in the Trap band (got ${g.score})`);
ok(g.band === 'Trap', `band is Trap (got ${g.band})`);
ok(g.breakdown.length === g.findings.length + g.credits.length + (g.terms.noticeDays <= 30 ? 1 : 0), 'score is fully itemised');
ok(g.breakdown.reduce((n, b) => n + b.delta, 100) === g.score || g.score === 0, 'breakdown arithmetic reproduces the score');

group('freelance contract');
const freelance = `
SERVICES AGREEMENT
1. The Contractor shall deliver the deliverables described in the statement of work.
2. All intellectual property in the deliverables shall vest in the Client on creation.
3. Payment shall be made within 90 days of receipt of invoice.
4. The Contractor shall not solicit any client of the Company for a period of two years after termination.
5. The Client may terminate this agreement at any time for convenience on written notice.
6. The Contractor binds himself as surety and co-principal debtor for the obligations of the Contractor.
`;
const f = E.scan(freelance);
['ip_assignment', 'payment_terms_long', 'non_compete', 'termination_convenience', 'suretyship']
  .forEach(id => ok(has(f, id), `found: ${id}`));
ok(f.type.id === 'freelance', `type detected as freelance (got ${f.type.id})`);
ok(find(f, 'termination_convenience').party === 'them', 'termination-for-convenience is attributed to them');

group('gaps — what the document does not say');
const gapDoc = `
1. This subscription automatically renews for successive periods of twelve months.
2. The subscription fee will increase each year at the then-current rate.
3. The Subscriber authorises a recurring debit order for the monthly amount.
4. The Provider may vary these terms at its sole discretion from time to time.
`;
const gaps = E.scan(gapDoc);
ok(gaps.missing.some(m => m.id === 'renew_no_notice'), 'flags renewal with no stated notice window');
ok(gaps.missing.some(m => m.id === 'increase_no_cap'), 'flags uncapped increases');
ok(gaps.missing.some(m => m.id === 'no_exit'), 'flags that no way out is described');

group('input guards');
ok(E.scan('').ok === false && E.scan('').reason === 'empty', 'empty input is rejected, not scored');
ok(E.scan('Too short to mean anything.').reason === 'too_short', 'very short input is rejected');
ok(E.scan(null).ok === false, 'null input does not throw');

/* ═══════════ deadlines ═══════════ */
group('deadline arithmetic');
const d1 = L.deadline({ noticeDays: 30, renewalDate: '2026-12-01', today: '2026-08-07', deliveryBuffer: 3 });
ok(d1.lastSafeSend === '2026-10-29', `last safe send = renewal − 33 days (got ${d1.lastSafeSend})`);
ok(d1.status === 'ok' && d1.daysLeft === 83, `83 days left, status ok (got ${d1.daysLeft}/${d1.status})`);

const d2 = L.deadline({ noticeDays: 30, renewalDate: '2026-08-20', today: '2026-08-07', deliveryBuffer: 3 });
ok(d2.status === 'missed', 'a window already closed reports missed');
ok(d2.daysLeft < 0 && /closed/.test(d2.message), 'missed window explains itself and still tells you to send');

const d3 = L.deadline({ noticeDays: 30, renewalDate: '2026-09-12', today: '2026-08-07', deliveryBuffer: 3 });
ok(d3.status === 'urgent' && d3.daysLeft === 3, `3 days left is urgent (got ${d3.daysLeft})`);

const d4 = L.deadline({ noticeDays: 30, today: '2026-08-07' });
ok(d4.mode === 'from_today' && d4.effectiveDate === '2026-09-06', `no renewal date → ends 30 days out (got ${d4.effectiveDate})`);

const d5 = L.deadline({ today: '2026-08-07' });
ok(d5.mode === 'unknown', 'no notice period and no renewal date is reported honestly, not guessed');

const d6 = L.deadline({ noticeDays: 60, renewalDate: '2027-03-01', today: '2026-12-31', deliveryBuffer: 0 });
ok(d6.lastSafeSend === '2026-12-31' && d6.daysLeft === 0, 'a deadline that lands today reports 0 days left');

ok(L.deadline({ today: '2026-02-30' }).ok === false, 'an impossible date is rejected');
ok(L.deadline({ noticeDays: 30, renewalDate: 'not-a-date', today: '2026-08-07' }).ok === false, 'a malformed renewal date is rejected');
ok(L.deadline({ noticeDays: 30, renewalDate: '2027-01-01', today: '2026-08-07' }).deliveryBuffer === 3, 'delivery buffer defaults to 3 days');

/* ═══════════ letters ═══════════ */
group('cancellation letter');
const lt = L.letter({
  kind: 'cancel', scan: g, yourName: 'J. Kingsbury', theirName: 'Fitness Co',
  reference: 'M-4471', today: '2026-08-07', deadline: d1
});
ok(lt.text.includes('Fitness Co'), 'letter addresses the company');
ok(lt.text.includes('M-4471'), 'letter carries the account reference');
ok(lt.text.includes('J. Kingsbury'), 'letter is signed');
ok(/thirty \(30\) days written notice/.test(lt.text), "letter quotes their own notice clause back at them");
ok(lt.text.includes('1 December 2026'), 'letter states the renewal date it is beating');
ok(/do not consent to any automatic renewal/.test(lt.text), 'letter refuses the auto-renewal explicitly');
ok(/itemised to me in writing first/.test(lt.text), 'letter pre-empts the exit fee because the scan found one');
ok(lt.notes.length >= 3, 'letter comes with instructions for sending it');
ok(/registered post/.test(lt.notes.join(' ')), 'sending instructions cover proof of delivery');
ok(/breach/.test(lt.notes.join(' ')), 'warns that cancelling the debit order early is a breach');

group('other letters');
const inc = L.letter({ kind: 'object_increase', scan: g, today: '2026-08-07' });
ok(/9,5%/.test(inc.text), 'increase objection quotes the escalation clause');
ok(/\[your full name\]/.test(inc.text), 'missing details become obvious placeholders, not fake names');
const dis = L.letter({ kind: 'dispute_fee', scan: g, today: '2026-08-07' });
ok(/R3 500,00/.test(dis.text), 'fee dispute quotes the exact fee from the contract');
ok(/dispute the debit with my bank/.test(dis.text), 'fee dispute names the bank remedy');
const req = L.letter({ kind: 'request_terms', today: '2026-08-07' });
ok(/complete terms/.test(req.text), 'request-terms letter works with no scan at all');

group('letters never invent a clause');
const bare = E.scan(clean);
const bareLetter = L.letter({ kind: 'cancel', scan: bare, today: '2026-08-07' });
ok(!/"/.test(bareLetter.text.split('Subject:')[1] || ''), 'no quoted clause when the scan found none to quote');

console.log(`\n${count - failures}/${count} passed`);
process.exit(failures ? 1 : 0);
