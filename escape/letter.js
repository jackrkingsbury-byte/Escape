/* Escape Clause — deadlines and letters.
   Built on top of engine.js output. Pure logic: no DOM, no network.

   Two jobs:
     1. deadline()  — when you must send notice, given the notice period the
                      engine found and the date the contract renews.
     2. letter()    — the words to send, quoting their own clause back at them.

   Every date is computed in UTC so a timezone never shifts a deadline by a day.
   Nothing here is legal advice; it is arithmetic plus a template. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EscapeLetter = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY = 86400000;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  function toUTC(d) {
    if (d instanceof Date) return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    var m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    var ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
    var back = new Date(ms);
    // Reject impossible dates like 2026-02-31 rolling into March.
    if (back.getUTCMonth() !== +m[2] - 1 || back.getUTCDate() !== +m[3]) return null;
    return ms;
  }

  function iso(ms) {
    var d = new Date(ms);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
  }

  function longDate(ms) {
    var d = new Date(ms);
    return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
  }

  /* When is the last day you can safely send notice?

     opts: { noticeDays, renewalDate, today, deliveryBuffer }
     deliveryBuffer is the head start you give the post/email so that "sent" and
     "received" are not the same argument. Defaults to 3 days. */
  function deadline(opts) {
    opts = opts || {};
    var todayMs = toUTC(opts.today || new Date());
    if (todayMs === null) return { ok: false, reason: 'bad_today' };

    var notice = Number(opts.noticeDays);
    if (!isFinite(notice) || notice < 0) notice = null;

    var buffer = opts.deliveryBuffer === undefined ? 3 : Math.max(0, Number(opts.deliveryBuffer) || 0);
    var renewalMs = opts.renewalDate ? toUTC(opts.renewalDate) : null;
    if (opts.renewalDate && renewalMs === null) return { ok: false, reason: 'bad_renewal' };

    // No renewal date known: the only honest answer is when today's notice bites.
    if (renewalMs === null) {
      if (notice === null) {
        return { ok: true, mode: 'unknown', today: iso(todayMs), message: 'No notice period was found in the text, and no renewal date was given. Ask them in writing for both.' };
      }
      var effective = todayMs + notice * DAY;
      return {
        ok: true, mode: 'from_today', today: iso(todayMs),
        noticeDays: notice,
        effectiveDate: iso(effective), effectiveDateLong: longDate(effective),
        message: 'Send notice today and this ends on ' + longDate(effective) + '. You keep paying until then.'
      };
    }

    if (notice === null) {
      return {
        ok: true, mode: 'no_notice_period', today: iso(todayMs),
        renewalDate: iso(renewalMs), renewalDateLong: longDate(renewalMs),
        daysToRenewal: Math.round((renewalMs - todayMs) / DAY),
        message: 'It renews on ' + longDate(renewalMs) + ', but the text does not state a notice period. Send notice now and ask them to confirm the required window in writing.'
      };
    }

    var lastSafe = renewalMs - (notice + buffer) * DAY;
    var daysLeft = Math.round((lastSafe - todayMs) / DAY);
    var status = daysLeft < 0 ? 'missed' : daysLeft <= 7 ? 'urgent' : 'ok';

    var out = {
      ok: true, mode: 'renewal', today: iso(todayMs),
      noticeDays: notice, deliveryBuffer: buffer,
      renewalDate: iso(renewalMs), renewalDateLong: longDate(renewalMs),
      lastSafeSend: iso(lastSafe), lastSafeSendLong: longDate(lastSafe),
      daysLeft: daysLeft, status: status
    };

    if (status === 'missed') {
      var nextRenewal = renewalMs + 365 * DAY;
      out.message = 'The window for ' + longDate(renewalMs) + ' closed ' + Math.abs(daysLeft) + ' day' + (Math.abs(daysLeft) === 1 ? '' : 's') + ' ago. Send notice today anyway — it starts the clock, limits what you owe, and puts your intention on record before the next term.';
      out.nextWindowOpens = iso(nextRenewal - (notice + buffer) * DAY);
    } else if (status === 'urgent') {
      out.message = daysLeft === 0
        ? 'Today is the last safe day to send. After today you are into another term.'
        : daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' left. Send it today — do not wait for the deadline itself.';
    } else {
      out.message = 'You have until ' + longDate(lastSafe) + ' — ' + daysLeft + ' days. Sending it earlier costs nothing and removes the risk.';
    }
    return out;
  }

  /* ═══════════════════ letters ═══════════════════ */

  function quoteOf(scan, id) {
    if (!scan || !scan.findings) return null;
    for (var i = 0; i < scan.findings.length; i++) if (scan.findings[i].id === id) return scan.findings[i];
    return null;
  }

  function clauseRef(f) {
    if (!f) return null;
    return f.clause ? 'clause ' + f.clause : null;
  }

  function trimQuote(q, max) {
    if (!q) return null;
    q = q.replace(/\s+/g, ' ').trim();
    if (q.length <= max) return q;
    return q.slice(0, max - 1).replace(/[\s,;:]+\S*$/, '') + '…';
  }

  var SEND_RULES = [
    'Send it by email AND by registered post if the contract names a physical address.',
    'Keep the sent-mail copy and the post office slip. Delivery, not intention, is what gets argued about.',
    'Ask for written acknowledgement, and a final statement showing the closing balance.',
    'Do not cancel the debit order yet. Cancelling payment before the contract ends is a breach — it hands them the stronger position.'
  ];

  /* kind: cancel | object_increase | dispute_fee | request_terms */
  function letter(opts) {
    opts = opts || {};
    var kind = opts.kind || 'cancel';
    var scan = opts.scan || null;
    var you = (opts.yourName || '').trim() || '[your full name]';
    var them = (opts.theirName || '').trim() || '[company name]';
    var ref = (opts.reference || '').trim() || '[account / membership number]';
    var todayMs = toUTC(opts.today || new Date());
    var dl = opts.deadline || null;

    var notice = quoteOf(scan, 'notice_period');
    var renew = quoteOf(scan, 'auto_renew');
    var fee = quoteOf(scan, 'early_termination_fee');
    var esc = quoteOf(scan, 'price_escalation');

    var head = [
      longDate(todayMs),
      '',
      'To: ' + them,
      'Account / reference: ' + ref,
      ''
    ];

    var subject, body = [], notes = SEND_RULES.slice();

    if (kind === 'cancel') {
      subject = 'Notice of cancellation — ' + ref;
      body.push('I am giving formal written notice to cancel this agreement. Please treat this letter as the notice required under it.');
      if (notice) {
        var nref = clauseRef(notice);
        body.push('The agreement requires written notice' + (nref ? ' at ' + nref : '') + ': "' + trimQuote(notice.quote, 220) + '"');
      }
      if (dl && dl.mode === 'renewal') {
        body.push('This notice is sent on ' + longDate(todayMs) + ', ahead of the renewal date of ' + dl.renewalDateLong + '. On my calculation the agreement therefore ends on or before that date and does not renew.');
      } else if (dl && dl.mode === 'from_today' && dl.effectiveDateLong) {
        body.push('Counting the notice period from today, I calculate the end date as ' + dl.effectiveDateLong + '. Please confirm that date in writing.');
      }
      if (renew) {
        body.push('For the avoidance of doubt, I do not consent to any automatic renewal or extension of the term.');
      }
      body.push('Please confirm in writing, within 7 days: (1) that this notice is accepted and the date it takes effect, (2) the final amount owing, if any, and how it is calculated, and (3) that no further debit orders will be presented after the end date.');
      if (fee) {
        body.push('If you intend to charge any cancellation or early-termination amount, state the exact figure and the clause you rely on before you charge it. I do not authorise any deduction that has not been itemised to me in writing first.');
      }
    } else if (kind === 'object_increase') {
      subject = 'Objection to price increase — ' + ref;
      body.push('I am writing about the increase applied to my account. I do not accept it as validly applied, and I am asking you to justify it in writing.');
      if (esc) {
        var eref = clauseRef(esc);
        body.push('The clause you are presumably relying on' + (eref ? ' (' + eref + ')' : '') + ' reads: "' + trimQuote(esc.quote, 220) + '"');
      }
      body.push('Please provide, within 14 days: (1) the exact percentage applied and the figure it was applied to, (2) the clause that authorises it, (3) the date and method by which notice of the increase was given to me, and (4) the amount I was paying before.');
      body.push('Until those are provided, I reserve my rights, including the right to cancel and the right to dispute any amount charged above the previously agreed figure.');
      notes = notes.slice(0, 3);
    } else if (kind === 'dispute_fee') {
      subject = 'Dispute — cancellation charge on ' + ref;
      body.push('You have charged, or indicated you will charge, an amount for ending this agreement. I dispute it and I am asking you to justify it before it is collected.');
      if (fee) {
        var fref = clauseRef(fee);
        body.push('The clause relied on' + (fref ? ' (' + fref + ')' : '') + ' reads: "' + trimQuote(fee.quote, 220) + '"');
      }
      body.push('Please provide, within 14 days: (1) the exact amount and the arithmetic behind it, (2) the clause it comes from, (3) what actual loss it represents rather than a penalty, and (4) a full statement of the account.');
      body.push('I do not authorise any debit order or deduction for this amount pending your written answer. If any amount is taken before then, treat this letter as notice that I will dispute the debit with my bank.');
      notes = [
        'Send it before the next debit date, not after. Reversing a debit is harder than stopping one.',
        'Send by email and keep the sent copy.',
        'Ask your bank what the deadline is to dispute an unauthorised debit — it is usually short.',
        'If they do not answer, the written record you built here is what a complaint or a small-claims process runs on.'
      ];
    } else {
      subject = 'Request for the full terms — ' + ref;
      body.push('Before I commit further, please send me the complete terms that apply to this agreement, including any schedule, annexure or policy incorporated by reference.');
      body.push('Please also confirm in writing: (1) the full length of the term, (2) exactly how and by when I must cancel, (3) every amount payable on early cancellation, and (4) whether the agreement renews on its own, and on what terms.');
      body.push('I am asking for these in writing because a verbal answer is not something either of us can rely on later.');
      notes = ['Send by email so the request and the reply are both in writing.', 'A refusal to put the cancellation procedure in writing is itself information.'];
    }

    body.push('');
    body.push('Regards,');
    body.push(you);

    return {
      subject: subject,
      date: iso(todayMs),
      text: head.concat(['Subject: ' + subject, ''], body).join('\n'),
      notes: notes
    };
  }

  return { deadline: deadline, letter: letter, longDate: longDate, iso: iso, toUTC: toUTC };
});
