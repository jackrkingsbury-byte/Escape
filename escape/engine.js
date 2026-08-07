/* Escape Clause — detection engine.
   Pure logic: no DOM, no network, no model. Given contract text it returns the
   clauses that cost people money or freedom, each one quoted from the source so
   the reader can check it against their own document.

   Design rule, and the reason this is not an LLM: a finding may only exist if a
   sentence in the input produced it. The engine can miss a trap (false
   negative). It can never invent one (false positive by fabrication). Every
   finding carries `quote` — the sentence it came from.

   Loaded as a plain script (window.EscapeEngine) or required from node. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EscapeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ═══════════════════ text preparation ═══════════════════ */

  var NUMBER_WORDS = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
    nine: 9, ten: 10, eleven: 11, twelve: 12, fourteen: 14, fifteen: 15,
    twenty: 20, thirty: 30, forty: 45 /* never used, guarded below */,
    forty_five: 45, sixty: 60, ninety: 90, 'one hundred and eighty': 180
  };
  delete NUMBER_WORDS.forty;

  function wordToNumber(w) {
    if (!w) return null;
    var k = String(w).toLowerCase().trim().replace(/[-\s]+/g, ' ');
    if (/^\d+$/.test(k)) return parseInt(k, 10);
    if (k === 'forty five' || k === 'forty-five') return 45;
    if (k === 'a' || k === 'an') return 1;
    return Object.prototype.hasOwnProperty.call(NUMBER_WORDS, k) ? NUMBER_WORDS[k] : null;
  }

  /* Contracts number their clauses ("3.2.1 The Member shall…"), so a naive
     split on "." shreds them. Split on line breaks first, then only on a full
     stop that is not part of a clause number or a decimal. */
  /* A clause marker is "3.2", "4.", "(a)" — never a bare number, or "24 months"
     would lose its 24. The marker is stripped from the sentence and kept in
     `clause`, so a quote reads as a sentence and the reference is separate. */
  var MARKER = /^((?:\d+\.\d+(?:\.\d+)*|\d+\.|\([a-z0-9]{1,4}\))\s+)/;

  function splitSentences(text) {
    var out = [];
    String(text).split(/\r?\n/).forEach(function (rawLine) {
      var line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line) return;
      // The line's own marker is the default for every sentence on it, so a
      // clause that runs to several sentences keeps one reference throughout.
      var lineMark = line.match(MARKER);
      var lineClause = lineMark ? lineMark[1].trim().replace(/\.$/, '') : null;
      line.split(/(?<=[^\d][.;])\s+(?=["“(]?[A-Z0-9])/).forEach(function (s) {
        var t = s.trim();
        var clause = lineClause;
        var m = t.match(MARKER);
        if (m) {
          clause = m[1].trim().replace(/\.$/, '');
          t = t.slice(m[1].length).trim();
        }
        if (t.length < 12) {
          // Too short to stand alone (a heading, a stray number) — glue it on.
          if (out.length && t) out[out.length - 1].text += ' ' + t;
          return;
        }
        out.push({ text: t, clause: clause, index: out.length });
      });
    });
    return out;
  }

  /* ═══════════════════ structured extraction ═══════════════════ */

  var DUR = '(\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fourteen|fifteen|twenty|thirty|sixty|ninety|forty[-\\s]?five)';

  function extractDuration(s) {
    // "thirty (30) days", "30 days'", "one (1) calendar month", "two months"
    var re = new RegExp(DUR + "\\s*(?:\\(\\s*(\\d{1,3})\\s*\\)\\s*)?(?:calendar\\s+|business\\s+|working\\s+)?(day|week|month|year)s?", 'i');
    var m = s.match(re);
    if (!m) return null;
    var n = m[2] ? parseInt(m[2], 10) : wordToNumber(m[1]);
    if (n === null || !isFinite(n)) return null;
    var unit = m[3].toLowerCase();
    var days = unit === 'day' ? n : unit === 'week' ? n * 7 : unit === 'month' ? n * 30 : n * 365;
    return { n: n, unit: unit, days: days, text: m[0].trim() };
  }

  function extractMoney(s) {
    // R1 200,00 · R1,200.00 · ZAR 1200 · $500 · £250 · €300
    var m = s.match(/(R|ZAR|\$|USD|£|GBP|€|EUR)\s?((?:\d{1,3}(?:[ ,]\d{3})+|\d+)(?:[.,]\d{2})?)/i);
    if (!m) return null;
    var raw = m[2];
    var normalised;
    if (/[ ,]\d{3}/.test(raw)) normalised = raw.replace(/[ ,](?=\d{3}\b)/g, '').replace(',', '.');
    else normalised = raw.replace(',', '.');
    var v = parseFloat(normalised);
    if (!isFinite(v)) return null;
    return { currency: m[1].toUpperCase() === 'ZAR' ? 'R' : m[1], value: v, text: m[0].trim() };
  }

  function extractPercent(s) {
    var m = s.match(/(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:%|per\s?cent)/i);
    if (m) return { value: parseFloat(m[1].replace(',', '.')), text: m[0].trim() };
    if (/\bCPI\b/i.test(s)) return { value: null, text: 'CPI-linked' };
    return null;
  }

  /* ═══════════════════ who does it bind? ═══════════════════ */

  var YOU_CORE = 'you|your|the\\s+(?:member|customer|subscriber|user|tenant|purchaser|buyer|borrower|consumer|employee|lessee|hirer|guest|patient|student|contractor|freelancer)';
  var THEM_CORE = 'we|us|our|the\\s+(?:company|provider|supplier|landlord|seller|lender|merchant|club|gym|business|firm|agency|lessor|institution|operator|platform)|[A-Z][A-Za-z]*\\s+\\(Pty\\)\\s+Ltd';

  /* "Client" is the ambiguous one: in a services contract the reader is usually
     the contractor and the client is the other side, but in a plain customer
     contract the client IS the reader. Resolve it per document rather than
     guessing the same way every time. */
  function buildRoles(text) {
    var contractorSide = /\b(contractor|freelancer|sub-?contractor|service\s+provider)\b/i.test(String(text || ''));
    var you = YOU_CORE, them = THEM_CORE;
    if (contractorSide) them += '|the\\s+client';
    else you += '|the\\s+client';
    return { you: new RegExp('\\b(' + you + ')\\b', 'i'), them: new RegExp('\\b(' + them + ')\\b', 'i') };
  }

  var DEFAULT_ROLES = buildRoles('');

  /* The verb that carries the obligation. Everything before it is the subject —
     the party actually bound. Kept broad so the subject gets cut off early:
     "The Member indemnifies the Club" must resolve to the Member, not the Club. */
  var OBLIGATION = new RegExp('\\b(' + [
    'shall', 'must', 'will', 'may', 'agree[sd]?\\s+to', 'undertake[sd]?', 'is\\s+liable',
    'are\\s+liable', 'remains?\\s+liable', 'is\\s+required', 'are\\s+required',
    'authoris\\w+', 'consents?\\s+to', 'indemnif\\w+', 'warrants?', 'acknowledges?',
    'waives?', 'hereby', 'cedes?', 'assigns?', 'binds?\\s+(?:himself|herself|itself|themselves)'
  ].join('|') + ')\\b', 'i');

  /* Whoever is named first before the obligation verb is carrying it. */
  function partyOf(sentence, roles) {
    var s = sentence;
    roles = roles || DEFAULT_ROLES;
    if (/\beither\s+party\b|\bboth\s+parties\b|\beach\s+party\b/i.test(s)) return 'both';
    var ob = s.search(OBLIGATION);
    var head = ob > 0 ? s.slice(0, ob) : s;
    var you = head.search(roles.you);
    var them = head.search(roles.them);
    if (you < 0 && them < 0) return 'unclear';
    if (them < 0) return 'you';
    if (you < 0) return 'them';
    return you < them ? 'you' : 'them';
  }

  /* ═══════════════════ the detectors ═══════════════════ */
  /* severity 1–4. `costs`: money | freedom | risk | privacy.
     `plain` is what it means. `why` is what it does to you in practice. */

  var DETECTORS = [
    {
      id: 'auto_renew', title: 'It renews itself', severity: 3, costs: 'money',
      plain: 'This contract rolls over into a new term on its own. Silence counts as "yes".',
      why: 'The default outcome is that you keep paying. Doing nothing is a decision, and it is the expensive one.',
      patterns: [
        /automatic(ally)?\s+renew/i, /auto-?renew/i,
        /(shall|will)\s+(be\s+)?renew(ed)?\s+for\s+(a\s+)?(further|additional|successive|like)/i,
        /renew(ed|s)?\s+for\s+successive/i,
        /(continue|remain\s+in\s+force)\s+(on\s+a\s+)?(month-to-month|rolling|indefinite)/i,
        /unless\s+(?:either\s+party|you|the\s+\w+)\s+(?:give|gives|provide|provides|serve|serves)[^.]{0,60}notice/i
      ]
    },
    {
      id: 'notice_period', title: 'You must give notice to leave', severity: 2, costs: 'freedom',
      plain: 'You cannot just stop. You have to tell them, in a specific way, a specific time in advance.',
      why: 'Miss the window by a day and you owe another full term. This is the single most common way people get charged for a service they thought they had cancelled.',
      patterns: [
        new RegExp(DUR + "\\s*(?:\\(\\s*\\d{1,3}\\s*\\)\\s*)?(?:calendar\\s+|business\\s+|working\\s+)?(?:days?|weeks?|months?)['’]?\\s*(?:prior\\s+)?(?:written\\s+)?notice", 'i'),
        /notice\s+of\s+(?:not\s+less\s+than|at\s+least)/i,
        /(?:give|provide|serve)[^.]{0,40}written\s+notice/i
      ],
      extract: function (s) {
        var d = extractDuration(s);
        return d ? { noticeDays: d.days, noticeText: d.text } : null;
      }
    },
    {
      id: 'early_termination_fee', title: 'Leaving early has a price', severity: 4, costs: 'money',
      plain: 'Ending this before the end of the term triggers a charge, or you owe the rest of the term anyway.',
      why: 'This is the clause that turns "I want out" into a bill. Find the number before you decide anything else.',
      patterns: [
        /(early|premature)\s+(termination|cancellation|settlement)\s*(fee|charge|penalty|amount|payment)?/i,
        /cancellation\s+(fee|penalty|charge)/i,
        /liable\s+for\s+the\s+(remaining|balance|full)/i,
        /pay\s+the\s+(full\s+)?balance\s+of\s+the\s+(contract|agreement|term|membership)/i,
        /remaining\s+(instal?ments|months|subscription\s+fees)\s+(shall\s+)?(become\s+)?(due|payable)/i
      ],
      extract: function (s) {
        var m = extractMoney(s), p = extractPercent(s);
        var o = {};
        if (m) o.exitFee = m;
        if (p) o.exitPercent = p;
        return Object.keys(o).length ? o : null;
      }
    },
    {
      id: 'min_term', title: 'You are locked in for a fixed period', severity: 2, costs: 'freedom',
      plain: 'There is a minimum term. Until it ends, you are committed.',
      why: 'Everything else in the contract — fees, increases, penalties — runs for at least this long.',
      patterns: [
        /minimum\s+(term|period|commitment|duration)/i,
        /fixed[- ]term/i, /initial\s+(term|period)\s+of/i, /lock[- ]?in/i,
        /for\s+a\s+period\s+of\s+\w+\s+(months|years)\s+from\s+the\s+(commencement|effective)/i
      ],
      extract: function (s) {
        var d = extractDuration(s);
        return d ? { minTermDays: d.days, minTermText: d.text } : null;
      }
    },
    {
      id: 'price_escalation', title: 'The price goes up on a schedule', severity: 3, costs: 'money',
      plain: 'The amount you pay is not fixed. It rises at set intervals, or whenever they decide.',
      why: 'The number that sold you the contract is the lowest number you will ever pay under it.',
      patterns: [
        /(increase|escalat\w+|adjust\w*)[^.]{0,60}(annually|each\s+year|per\s+annum|on\s+each\s+anniversary|every\s+12\s+months)/i,
        /annual\s+(increase|escalation|adjustment)/i,
        /\bCPI\b/i,
        /at\s+the\s+then[- ]current\s+(price|rate|fee|tariff)/i,
        /(fees|prices|rates|tariffs)[^.]{0,40}(subject\s+to\s+change|may\s+be\s+increased)/i
      ],
      extract: function (s) {
        var p = extractPercent(s);
        return p ? { increasePercent: p } : null;
      }
    },
    {
      id: 'unilateral_change', title: 'They can change the deal without you', severity: 3, costs: 'risk',
      plain: 'One side can rewrite the terms after you have signed. That side is not you.',
      why: 'Whatever you read today is not what you are bound by tomorrow. It makes every other clause provisional.',
      patterns: [
        /(may|reserve[s]?\s+the\s+right\s+to)[^.]{0,60}(amend|vary|change|modify|update|substitute)[^.]{0,60}(terms|agreement|fees|prices|conditions|policy)/i,
        /(amend|vary|change)[^.]{0,40}(at\s+(our|its)\s+(sole\s+)?discretion|from\s+time\s+to\s+time\s+without)/i,
        /continued\s+use[^.]{0,60}constitutes?\s+acceptance/i
      ]
    },
    {
      id: 'debit_order', title: 'They pull the money themselves', severity: 2, costs: 'money',
      plain: 'You authorise them to take payment from your account, on a repeating basis.',
      why: 'The money leaves whether or not you are still using the thing. Cancelling the debit order is not the same as cancelling the contract — you can be in breach and still be charged.',
      patterns: [
        /debit\s+order/i, /direct\s+debit/i, /continuous\s+payment\s+authorit/i,
        /authoris\w+[^.]{0,60}(deduct|debit)/i, /recurring\s+(billing|payment|charge)/i,
        /stop\s+order/i
      ]
    },
    {
      id: 'late_fees', title: 'Late payment carries interest or a penalty', severity: 2, costs: 'money',
      plain: 'Pay late and the debt grows on its own.',
      why: 'A small missed payment compounds quietly into a number worth chasing you for.',
      patterns: [
        /(interest|penalty)[^.]{0,50}(per\s+(month|annum)|%|per\s?cent)/i,
        /late\s+(payment\s+)?(fee|charge|interest|penalty)/i,
        /prime\s+(lending\s+)?rate\s+plus/i, /mora\s+interest/i,
        /interest\s+shall\s+accrue/i
      ],
      extract: function (s) {
        var p = extractPercent(s);
        return p ? { latePercent: p } : null;
      }
    },
    {
      id: 'liability_cap', title: 'Their exposure is capped. Yours is not.', severity: 3, costs: 'risk',
      plain: 'If they cause you a loss, the most you can recover is limited — often to what you already paid them.',
      why: 'The downside is not shared. You carry the real risk of the thing going wrong.',
      patterns: [
        /(limit\w*|cap\w*)[^.]{0,60}liabilit/i,
        /in\s+no\s+event\s+(shall|will)[^.]{0,60}liable/i,
        /(total|aggregate)\s+liabilit\w+[^.]{0,50}(shall\s+not\s+exceed|is\s+limited\s+to|will\s+not\s+exceed)/i,
        /not\s+be\s+liable\s+for\s+any[^.]{0,60}(indirect|consequential|special)\s+(loss|damage)/i
      ]
    },
    {
      id: 'indemnity', title: 'You cover their losses', severity: 4, costs: 'risk',
      plain: 'If someone sues them over something connected to you, you pay their costs.',
      why: 'This is unlimited by default. It is the clause with the largest possible number attached and no number written next to it.',
      patterns: [
        /indemnif(y|ies|ication|ied)/i, /hold[^.]{0,20}harmless/i,
        /defend[^.]{0,30}(against\s+any|from\s+any)\s+claim/i
      ]
    },
    {
      id: 'dispute_forum', title: 'Where and how you are allowed to fight', severity: 2, costs: 'freedom',
      plain: 'Disputes go somewhere specific — arbitration, a named court, sometimes another country.',
      why: 'It decides whether complaining is realistic or unaffordable. A waiver of class action means you fight alone.',
      patterns: [
        /arbitrat(ion|or)/i, /waive[^.]{0,40}(class\s+action|jury\s+trial)/i,
        /exclusive\s+jurisdiction/i, /consent\s+to\s+the\s+jurisdiction/i,
        /magistrate['’]?s\s+court/i, /governed\s+by\s+(and\s+construed\s+)?(in\s+accordance\s+with\s+)?the\s+laws\s+of/i
      ]
    },
    {
      id: 'ip_assignment', title: 'They own what you make', severity: 4, costs: 'money',
      plain: 'Intellectual property in your work transfers to them.',
      why: 'You cannot reuse it, show it, or sell it again. For anyone paid to create things, this is the clause that decides whether the work builds an asset or just pays once.',
      patterns: [
        /(assign|assigns|cede|transfer)[^.]{0,80}(intellectual\s+property|copyright|all\s+right,?\s+title)/i,
        /work\s+(made\s+)?for\s+hire/i,
        /(vest|vests|vested)[^.]{0,40}in\s+the\s+(company|client|employer)/i,
        /(all\s+)?(deliverables|works?\s+product|materials)[^.]{0,60}(shall\s+be|become)[^.]{0,30}(sole\s+)?propert/i
      ]
    },
    {
      id: 'non_compete', title: 'Limits on your work after this ends', severity: 4, costs: 'freedom',
      plain: 'After the contract ends, you are restricted from certain work, clients, or areas.',
      why: 'It reaches past the end of the deal into your future income.',
      patterns: [
        /non-?compet\w*/i, /restraint\s+of\s+trade/i, /non-?solicit\w*/i,
        /shall\s+not[^.]{0,80}(solicit|entice|approach)[^.]{0,40}(client|customer|employee)/i,
        /shall\s+not[^.]{0,60}engage\s+in\s+any\s+business/i
      ]
    },
    {
      id: 'perpetual_confidentiality', title: 'Confidentiality never expires', severity: 2, costs: 'freedom',
      plain: 'The duty to keep quiet outlives the contract, sometimes forever.',
      why: 'Ordinary in a professional deal. Worth knowing if you ever want to describe this work publicly.',
      patterns: [
        /confidential\w*[^.]{0,60}(survive|perpetuit|indefinite|no\s+time\s+limit)/i,
        /(survive|remain\s+in\s+(force|effect))[^.]{0,50}(termination|expiry)[^.]{0,60}(indefinitely|in\s+perpetuity)/i
      ]
    },
    {
      id: 'non_refundable', title: 'Money paid does not come back', severity: 3, costs: 'money',
      plain: 'Fees, deposits or prepayments are not returned, whatever happens next.',
      why: 'It removes your leverage. Once paid, you have nothing to withhold.',
      patterns: [
        /non-?refundable/i, /no\s+refunds?\b/i,
        /(deposit|amount|fee)[^.]{0,50}(shall\s+be\s+)?forfeit/i,
        /not\s+be\s+entitled\s+to\s+(a\s+)?(refund|reimbursement)/i
      ]
    },
    {
      id: 'assignment_transfer', title: 'They can hand you to someone else', severity: 2, costs: 'risk',
      plain: 'Your contract can be sold or transferred to another company without asking you.',
      why: 'You chose who to deal with. This clause says that choice was not permanent — including a transfer to a debt collector.',
      patterns: [
        /(may\s+)?(assign|cede|transfer)[^.]{0,80}(without[^.]{0,30}consent|to\s+any\s+third\s+part)/i,
        /cede\s+and\s+assign/i,
        /(assign|transfer)[^.]{0,40}(its\s+)?rights[^.]{0,40}(and\s+obligations\s+)?(under\s+this\s+agreement)/i
      ]
    },
    {
      id: 'data_marketing', title: 'Your information travels', severity: 2, costs: 'privacy',
      plain: 'Personal data is shared with third parties, or used to market at you.',
      why: 'The contract is not only about the service. It is also a data agreement.',
      patterns: [
        /(share|sell|disclose|provide)[^.]{0,60}(personal\s+(information|data))[^.]{0,60}(third\s+part|partners|affiliates)/i,
        /direct\s+marketing/i,
        /consent\s+to\s+receiv\w+[^.]{0,40}(marketing|promotional)/i
      ]
    },
    {
      id: 'payment_terms_long', title: 'They pay you slowly', severity: 3, costs: 'money',
      plain: 'Invoices are settled well after the work is done — 60 days or more.',
      why: 'You are financing them. For a small supplier this is the difference between a profitable contract and a cash-flow hole.',
      patterns: [
        /\bnet\s*(60|90|120)\b/i,
        /(within|after)\s+(60|90|120|sixty|ninety|one\s+hundred\s+and\s+twenty)\s+(calendar\s+|business\s+)?days[^.]{0,40}(payment|invoice|receipt)/i,
        /payment[^.]{0,40}within\s+(60|90|120|sixty|ninety)\s+(calendar\s+|business\s+)?days/i,
        /(60|90|120)\s+days\s+(from|after)\s+(date\s+of\s+)?invoice/i
      ]
    },
    {
      id: 'termination_convenience', title: 'They can walk away. You cannot.', severity: 3, costs: 'freedom',
      plain: 'They may end it at any time, for any reason — while you are held to the term.',
      why: 'The exit is one-directional. You carry the commitment, they keep the option.',
      patterns: [
        /(may|reserve[s]?\s+the\s+right\s+to)[^.]{0,60}terminate[^.]{0,80}(for\s+any\s+reason|without\s+cause|at\s+any\s+time|for\s+convenience|in\s+its\s+sole\s+discretion)/i,
        /terminate[^.]{0,40}immediately[^.]{0,60}(without\s+notice|sole\s+discretion)/i,
        /suspend[^.]{0,40}(your\s+)?(access|account|service)[^.]{0,60}(without\s+notice|any\s+reason)/i
      ]
    },
    {
      id: 'suretyship', title: 'You are personally on the hook', severity: 4, costs: 'money',
      plain: 'You stand behind the debt personally — not just through a business.',
      why: 'It pierces whatever separation you thought existed between the deal and your own money.',
      patterns: [
        /suret(y|yship|ies)/i, /personally\s+liable/i, /personal\s+guarantee/i,
        /co-?principal\s+debtor/i, /\bbind\w*\s+(myself|himself|herself|themselves)\s+as\s+suret/i
      ]
    },
    {
      id: 'acceleration', title: 'One slip makes the whole balance due', severity: 4, costs: 'money',
      plain: 'Miss a payment and the entire outstanding amount becomes payable at once.',
      why: 'A single bad month converts a manageable instalment into a demand for everything.',
      patterns: [
        /(entire|full|whole)\s+(outstanding\s+)?(balance|amount|sum)[^.]{0,60}(immediately\s+due|become\s+due\s+and\s+payable)/i,
        /acceleration\s+clause/i,
        /all\s+amounts?\s+owing[^.]{0,40}(shall\s+)?become\s+immediately\s+(due|payable)/i
      ]
    }
  ];

  /* Clauses that count in your favour — the engine has to be able to say
     "this one is fair", or the score is just a fear generator. */
  var CREDITS = [
    {
      id: 'mutual_termination', title: 'Either side can end it', credit: 6,
      plain: 'The exit is symmetric — both parties have the same right to leave.',
      patterns: [/either\s+party\s+may\s+(terminate|cancel)/i, /both\s+parties[^.]{0,40}(terminate|cancel)/i]
    },
    {
      id: 'capped_increase', title: 'Increases have a ceiling', credit: 4,
      plain: 'The price can rise, but the contract puts a limit on how far.',
      patterns: [
        /(increase|escalation|adjustment)[^.]{0,60}(shall\s+not\s+exceed|capped\s+at|limited\s+to)[^.]{0,30}(\d{1,2}\s*%|CPI)/i,
        /(shall\s+not\s+exceed|capped\s+at)[^.]{0,20}CPI/i
      ]
    },
    {
      id: 'cooling_off', title: 'There is a cooling-off period', credit: 6,
      plain: 'You can walk away within a short window after signing, without penalty.',
      patterns: [
        /cooling[- ]off/i,
        /within\s+\d{1,2}\s+(business\s+)?days[^.]{0,60}(cancel|withdraw|refund)[^.]{0,40}(without\s+penalty|no\s+penalty|full\s+refund)/i
      ]
    },
    {
      id: 'pro_rata_refund', title: 'Unused time is refunded', credit: 5,
      plain: 'If it ends early you get back the part you did not use.',
      patterns: [/pro[- ]rata[^.]{0,40}refund/i, /refund[^.]{0,40}pro[- ]?rata/i]
    }
  ];

  var SEVERITY_COST = { 1: 2, 2: 5, 3: 9, 4: 13 };

  /* ═══════════════════ contract type ═══════════════════ */

  var TYPES = [
    { id: 'gym', label: 'Gym or club membership', patterns: [/\bgym\b/i, /fitness\s+(centre|center|club)/i, /membership\s+(agreement|contract)/i, /\bclub\s+rules\b/i] },
    { id: 'lease', label: 'Lease or rental', patterns: [/\blease\b/i, /\blandlord\b/i, /\btenant\b/i, /rental\s+agreement/i, /\bpremises\b/i, /\bdeposit\b.{0,40}\brent\b/i] },
    { id: 'subscription', label: 'Subscription or telecom', patterns: [/\bsubscription\b/i, /\bsubscriber\b/i, /\bairtime\b/i, /\bdata\s+bundle\b/i, /\bmobile\s+(plan|contract)\b/i, /\bservice\s+plan\b/i] },
    { id: 'freelance', label: 'Freelance or services', patterns: [/\bcontractor\b/i, /\bfreelance\b/i, /statement\s+of\s+work/i, /\bdeliverables?\b/i, /services\s+agreement/i, /\binvoice\b/i] },
    { id: 'employment', label: 'Employment', patterns: [/\bemployee\b/i, /\bemployer\b/i, /\bremuneration\b/i, /\bprobation\b/i, /basic\s+salary/i] },
    { id: 'credit', label: 'Credit or finance', patterns: [/\bcredit\s+agreement\b/i, /\binstal?ments?\b/i, /\bloan\b/i, /\bborrower\b/i, /\bprincipal\s+debt\b/i, /\binterest\s+rate\b/i] }
  ];

  function detectType(text) {
    var best = { id: 'generic', label: 'General agreement', hits: 0 };
    TYPES.forEach(function (t) {
      var hits = t.patterns.reduce(function (n, p) { return n + (p.test(text) ? 1 : 0); }, 0);
      if (hits > best.hits) best = { id: t.id, label: t.label, hits: hits };
    });
    return best;
  }

  /* ═══════════════════ scan ═══════════════════ */

  function scan(rawText) {
    var text = String(rawText || '');
    var sentences = splitSentences(text);
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;

    if (words < 40) {
      return {
        ok: false,
        reason: words === 0 ? 'empty' : 'too_short',
        words: words, sentences: sentences.length,
        findings: [], credits: [], score: null, terms: {}, missing: [],
        type: { id: 'generic', label: 'General agreement' },
        asymmetry: { you: 0, them: 0, both: 0, unclear: 0 }
      };
    }

    var roles = buildRoles(text);
    var byId = {};
    var terms = {};

    sentences.forEach(function (sn) {
      DETECTORS.forEach(function (d) {
        var hit = null;
        for (var i = 0; i < d.patterns.length; i++) {
          if (d.patterns[i].test(sn.text)) { hit = d.patterns[i]; break; }
        }
        if (!hit) return;

        var detail = d.extract ? d.extract(sn.text) : null;
        var party = partyOf(sn.text, roles);
        var existing = byId[d.id];

        if (!existing) {
          byId[d.id] = {
            id: d.id, title: d.title, severity: d.severity, costs: d.costs,
            plain: d.plain, why: d.why,
            quote: sn.text, clause: sn.clause, party: party,
            occurrences: 1, detail: detail || {}, alsoAt: []
          };
        } else {
          existing.occurrences++;
          if (sn.clause && existing.alsoAt.length < 4) existing.alsoAt.push(sn.clause);
          // Better evidence beats earlier evidence. A sentence carrying hard
          // numbers wins, and so does one that names who is actually bound
          // ("The Member authorises…" over "the fee is collected by debit order").
          var newDetail = detail && Object.keys(detail).length;
          var oldDetail = Object.keys(existing.detail).length;
          var namesParty = existing.party === 'unclear' && party !== 'unclear';
          if ((newDetail && !oldDetail) || (namesParty && !oldDetail)) {
            existing.quote = sn.text;
            existing.clause = sn.clause;
            if (newDetail) existing.detail = detail;
            existing.party = party;
          }
        }
        if (detail) Object.keys(detail).forEach(function (k) { if (terms[k] === undefined) terms[k] = detail[k]; });
      });
    });

    var findings = Object.keys(byId).map(function (k) { return byId[k]; });
    findings.sort(function (a, b) { return b.severity - a.severity || a.id.localeCompare(b.id); });

    var credits = [];
    CREDITS.forEach(function (c) {
      for (var i = 0; i < sentences.length; i++) {
        for (var j = 0; j < c.patterns.length; j++) {
          if (c.patterns[j].test(sentences[i].text)) {
            credits.push({ id: c.id, title: c.title, plain: c.plain, credit: c.credit, quote: sentences[i].text, clause: sentences[i].clause });
            return;
          }
        }
      }
    });

    var asymmetry = { you: 0, them: 0, both: 0, unclear: 0 };
    findings.forEach(function (f) { asymmetry[f.party] = (asymmetry[f.party] || 0) + 1; });

    var scored = score(findings, credits, terms);
    var missing = findGaps(findings, credits, text);

    return {
      ok: true,
      words: words, sentences: sentences.length,
      type: detectType(text),
      findings: findings, credits: credits,
      score: scored.score, band: scored.band, breakdown: scored.breakdown,
      terms: terms, missing: missing, asymmetry: asymmetry
    };
  }

  function score(findings, credits, terms) {
    var breakdown = [];
    var penalty = 0;
    findings.forEach(function (f) {
      var cost = SEVERITY_COST[f.severity] || 5;
      // A clause that binds only you is worse than one that binds both sides.
      if (f.party === 'both') cost = Math.round(cost * 0.5);
      else if (f.party === 'them') cost = Math.round(cost * 0.4);
      penalty += cost;
      breakdown.push({ id: f.id, title: f.title, delta: -cost, note: f.party === 'both' ? 'applies to both sides' : f.party === 'them' ? 'binds them, not you' : null });
    });

    var bonus = 0;
    credits.forEach(function (c) { bonus += c.credit; breakdown.push({ id: c.id, title: c.title, delta: +c.credit, note: null }); });

    if (terms.noticeDays && terms.noticeDays <= 30) {
      bonus += 4;
      breakdown.push({ id: 'short_notice', title: 'Notice period is 30 days or less', delta: +4, note: null });
    }

    var s = Math.max(0, Math.min(100, 100 - penalty + bonus));
    var band = s >= 80 ? 'Fair' : s >= 60 ? 'Watch it' : s >= 40 ? 'Loaded' : 'Trap';
    return { score: s, band: band, breakdown: breakdown };
  }

  /* What the document does NOT say. Stated carefully: absence of a match is
     absence of evidence in the pasted text, not proof the clause is missing. */
  function findGaps(findings, credits, text) {
    var has = {};
    findings.forEach(function (f) { has[f.id] = true; });
    credits.forEach(function (c) { has[c.id] = true; });
    var gaps = [];

    if (has.auto_renew && !has.notice_period) {
      gaps.push({ id: 'renew_no_notice', title: 'It renews, but no notice window is stated', note: 'Ask them in writing for the exact cancellation procedure and deadline, and keep the reply.' });
    }
    if (has.price_escalation && !has.capped_increase) {
      gaps.push({ id: 'increase_no_cap', title: 'The price can rise with no stated ceiling', note: 'Nothing here limits how large an increase can be.' });
    }
    if (has.indemnity && !has.liability_cap) {
      gaps.push({ id: 'indemnity_uncapped', title: 'You indemnify them with no cap on the amount', note: 'Your exposure under this clause has no stated maximum.' });
    }
    if (!/(terminat|cancel|end\s+this\s+agreement|withdraw)/i.test(text)) {
      gaps.push({ id: 'no_exit', title: 'No cancellation or termination clause found', note: 'The pasted text does not describe how this ends. Get the full document before signing.' });
    }
    if (has.min_term && !has.early_termination_fee) {
      gaps.push({ id: 'term_no_fee', title: 'A fixed term, but no early-exit price given', note: 'Ask what leaving early actually costs, in rands, in writing.' });
    }
    return gaps;
  }

  return {
    scan: scan,
    // exported for tests and for the letter builder
    splitSentences: splitSentences,
    partyOf: partyOf,
    buildRoles: buildRoles,
    extractDuration: extractDuration,
    extractMoney: extractMoney,
    extractPercent: extractPercent,
    detectType: detectType,
    DETECTORS: DETECTORS,
    CREDITS: CREDITS
  };
});
