/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — AI ANALYTICS ENGINE
   Every score is computed live from the student's real data.
   ═══════════════════════════════════════════════════════════════ */

GF.engine = (() => {
  const E = {};

  const pct = (m) => (m.score / m.total) * 100;

  const sortedMarks = (subj) =>
    [...subj.marks].sort((a, b) => a.date.localeCompare(b.date));

  /* ----- subject metrics ----- */

  E.subjectAvg = (subj) => {
    if (!subj.marks.length) return null;
    let w = 0, sum = 0;
    subj.marks.forEach(m => { const wt = m.weight || 1; w += wt; sum += pct(m) * wt; });
    return sum / w;
  };

  // least-squares slope (percent per assessment) over the mark sequence
  E.subjectSlope = (subj) => {
    const ms = sortedMarks(subj);
    if (ms.length < 2) return 0;
    const ys = ms.map(pct);
    const n = ys.length;
    const xm = (n - 1) / 2;
    const ym = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    ys.forEach((y, i) => { num += (i - xm) * (y - ym); den += (i - xm) ** 2; });
    return den ? num / den : 0;
  };

  // AI Grade Predictor™ — trend-projected next result
  E.predictNext = (subj) => {
    const avg = E.subjectAvg(subj);
    if (avg == null) return null;
    const recent = sortedMarks(subj).slice(-4);
    const recentAvg = recent.reduce((a, m) => a + pct(m), 0) / recent.length;
    const slope = E.subjectSlope(subj);
    return GF.clamp(recentAvg * 0.6 + avg * 0.4 + slope * 1.5, 0, 100);
  };

  E.subjectDelta = (subj) => {
    const ms = sortedMarks(subj);
    if (ms.length < 2) return 0;
    const half = Math.floor(ms.length / 2);
    const a = ms.slice(0, half), b = ms.slice(half);
    const av = (arr) => arr.reduce((s, m) => s + pct(m), 0) / arr.length;
    return av(b) - av(a);
  };

  /* ----- global metrics ----- */

  E.overallAvg = () => {
    const avgs = GF.state.subjects.map(E.subjectAvg).filter(v => v != null);
    if (!avgs.length) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  };

  E.consistency = () => {
    const all = GF.state.subjects.flatMap(s => s.marks.map(pct));
    if (all.length < 3) return 70;
    const mean = all.reduce((a, b) => a + b, 0) / all.length;
    const sd = Math.sqrt(all.reduce((a, v) => a + (v - mean) ** 2, 0) / all.length);
    return GF.clamp(100 - sd * 2.2, 20, 100);
  };

  E.momentum = () => {
    const slopes = GF.state.subjects
      .filter(s => s.marks.length >= 2)
      .map(E.subjectSlope);
    if (!slopes.length) return 50;
    const avg = slopes.reduce((a, b) => a + b, 0) / slopes.length;
    return GF.clamp(50 + avg * 9, 0, 100);
  };

  E.assignmentScore = () => {
    const as = GF.state.assignments;
    if (!as.length) return 70;
    const today = GF.todayISO();
    let score = 0, n = 0;
    as.forEach(a => {
      n++;
      if (a.done) score += (a.doneAt && a.doneAt <= a.due) ? 100 : 75;
      else if (a.due < today) score += 10;          // overdue
      else score += 60;                              // pending, not yet due
    });
    return score / n;
  };

  // AI Focus Score™ — this week's focused minutes vs goal
  E.weekFocusMinutes = () => {
    const cutoff = GF.todayISO(-6);
    return GF.state.focusSessions
      .filter(s => s.date >= cutoff)
      .reduce((a, s) => a + s.minutes, 0);
  };

  E.focusScore = () => {
    const goal = GF.state.user.weeklyFocusGoalMin || 300;
    return GF.clamp((E.weekFocusMinutes() / goal) * 100, 0, 100);
  };

  // AI Academic Score™ — the flagship composite
  E.academicScore = () => {
    const avg = E.overallAvg();
    if (avg == null) {
      return { score: null, label: "Awaiting Data", parts: null };
    }
    const parts = {
      performance: avg,
      consistency: E.consistency(),
      momentum: E.momentum(),
      discipline: E.assignmentScore(),
      focus: E.focusScore(),
    };
    const score = Math.round(
      parts.performance * 0.42 +
      parts.consistency * 0.13 +
      parts.momentum * 0.15 +
      parts.discipline * 0.18 +
      parts.focus * 0.12
    );
    const label =
      score >= 88 ? "Elite" :
      score >= 76 ? "Ascending" :
      score >= 62 ? "Building" :
      score >= 45 ? "Warming Up" : "Critical";
    return { score, label, parts };
  };

  // AI Success Forecast™ — projected end-of-term average
  E.successForecast = () => {
    const avg = E.overallAvg();
    if (avg == null) return null;
    const slopes = GF.state.subjects.filter(s => s.marks.length >= 2).map(E.subjectSlope);
    const slope = slopes.length ? slopes.reduce((a, b) => a + b, 0) / slopes.length : 0;
    return GF.clamp(avg + slope * 3, 0, 100);
  };

  /* ----- exams ----- */

  // AI Exam Readiness™
  E.examReadiness = (exam) => {
    const subj = GF.state.subjects.find(s => s.id === exam.subjectId);
    const avg = subj ? E.subjectAvg(subj) : null;
    const days = GF.daysUntil(exam.date);
    const conf = exam.confidence ?? 50;
    // time factor: enough runway boosts readiness, last-minute drains it
    const timeFactor = days <= 0 ? 50 : GF.clamp(35 + days * 6, 35, 100);
    const base = conf * 0.45 + (avg ?? 60) * 0.35 + timeFactor * 0.20;
    return Math.round(GF.clamp(base, 0, 100));
  };

  E.upcomingExams = () =>
    GF.state.exams
      .filter(e => GF.daysUntil(e.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date));

  E.overallExamReadiness = () => {
    const ups = E.upcomingExams();
    if (!ups.length) return null;
    return Math.round(ups.reduce((a, e) => a + E.examReadiness(e), 0) / ups.length);
  };

  /* ----- assignments ----- */

  E.assignmentPriority = (a) => {
    if (a.done) return -1;
    const days = GF.daysUntil(a.due);
    if (days < 0) return 100;
    return GF.clamp(90 - days * 9, 5, 90);
  };

  E.pendingAssignments = () =>
    GF.state.assignments
      .filter(a => !a.done)
      .sort((x, y) => E.assignmentPriority(y) - E.assignmentPriority(x));

  /* ----- APS (South Africa) ----- */

  E.apsLevel = (percent) => {
    if (percent >= 80) return 7;
    if (percent >= 70) return 6;
    if (percent >= 60) return 5;
    if (percent >= 50) return 4;
    if (percent >= 40) return 3;
    if (percent >= 30) return 2;
    return 1;
  };

  E.apsBreakdown = () => {
    const rows = GF.state.subjects
      .map(s => ({ subject: s, avg: E.subjectAvg(s) }))
      .filter(r => r.avg != null)
      .map(r => ({ ...r, level: E.apsLevel(r.avg), isLO: /life orientation/i.test(r.subject.name) }));
    const counted = rows.filter(r => !r.isLO).sort((a, b) => b.level - a.level).slice(0, 6);
    const total = counted.reduce((a, r) => a + r.level, 0);
    return { rows, counted, total };
  };

  E.apsBand = (total) => {
    if (total >= 36) return { label: "Top-tier degree ready", cls: "good", note: "Competitive for Medicine, Engineering, Actuarial & top programmes." };
    if (total >= 30) return { label: "Degree ready", cls: "good", note: "Meets typical Bachelor's degree admission thresholds." };
    if (total >= 23) return { label: "Diploma ready", cls: "warn", note: "On track for Diploma programmes — push 2 subjects up one level for degree entry." };
    if (total >= 19) return { label: "Higher Certificate", cls: "warn", note: "Building the base — targeted revision can move this fast." };
    return { label: "Foundation phase", cls: "bad", note: "Every subject you lift one level adds points. Start with your closest-to-next-band subject." };
  };

  /* ----- AI insight feed ----- */

  E.bestSubject = () => {
    const rows = GF.state.subjects.map(s => ({ s, avg: E.subjectAvg(s) })).filter(r => r.avg != null);
    if (!rows.length) return null;
    return rows.reduce((a, b) => (b.avg > a.avg ? b : a));
  };

  E.weakestSubject = () => {
    const rows = GF.state.subjects.map(s => ({ s, avg: E.subjectAvg(s) })).filter(r => r.avg != null);
    if (!rows.length) return null;
    return rows.reduce((a, b) => (b.avg < a.avg ? b : a));
  };

  E.insights = () => {
    const out = [];
    const subjects = GF.state.subjects;
    const today = GF.todayISO();

    // Risk: overdue assignments
    const overdue = GF.state.assignments.filter(a => !a.done && a.due < today);
    if (overdue.length) {
      out.push({ cls: "bad", icon: "🚨", title: "Academic Risk Alert", text: `${overdue.length} assignment${overdue.length > 1 ? "s" : ""} overdue. Clearing the oldest one today protects your discipline score.` });
    }

    // Risk: imminent exam with low readiness
    E.upcomingExams().forEach(e => {
      const d = GF.daysUntil(e.date);
      const r = E.examReadiness(e);
      const subj = subjects.find(s => s.id === e.subjectId);
      if (d <= 7 && r < 60) {
        out.push({ cls: "warn", icon: "⏳", title: `${subj ? subj.name : "Exam"} readiness at ${r}%`, text: `${e.title} is in ${d} day${d === 1 ? "" : "s"}. Run Exam Preparation Mode in the AI Coach to build a day-by-day plan.` });
      }
    });

    // Downward trend detection
    subjects.forEach(s => {
      if (s.marks.length >= 3 && E.subjectSlope(s) < -2.5) {
        out.push({ cls: "warn", icon: "📉", title: `${s.name} is trending down`, text: `Recent results are slipping. Schedule one focused session this week before it compounds.` });
      }
    });

    // Strength
    const best = E.bestSubject();
    if (best && best.avg >= 70) {
      out.push({ cls: "good", icon: "🏆", title: `${best.s.name} is your power subject`, text: `Averaging ${Math.round(best.avg)}%. Protect it with light maintenance reviews while you push weaker subjects.` });
    }

    // Suggested focus
    const weak = E.weakestSubject();
    if (weak && best && weak.s.id !== best.s.id) {
      const gap = (weak.subject?.target ?? weak.s.target ?? 75) - weak.avg;
      if (gap > 0) {
        out.push({ cls: "purple", icon: "🎯", title: `Suggested focus: ${weak.s.name}`, text: `${Math.round(weak.avg)}% vs ${weak.s.target}% target. Highest-leverage move: ${Math.ceil(gap / 4)} extra focused sessions this week.` });
      }
    }

    // Improvement celebration
    subjects.forEach(s => {
      const d = E.subjectDelta(s);
      if (s.marks.length >= 4 && d >= 8) {
        out.push({ cls: "good", icon: "🚀", title: `${s.name} up ${Math.round(d)}%`, text: `Your recent results are significantly above your earlier ones. Whatever you changed — keep doing it.` });
      }
    });

    // Focus nudge
    if (E.focusScore() < 40 && GF.state.focusSessions.length) {
      out.push({ cls: "info", icon: "🧠", title: "Focus engine running cold", text: `Only ${E.weekFocusMinutes()} focused minutes this week. One 25-minute Pomodoro today restarts the engine.` });
    }

    if (!out.length) {
      out.push({ cls: "info", icon: "🤖", title: "All systems nominal", text: "No risks detected. Log marks, assignments and focus sessions to sharpen your AI insights." });
    }
    return out.slice(0, 6);
  };

  // Recommended weekly study hours from workload + gaps
  E.recommendedHours = () => {
    const examLoad = E.upcomingExams().filter(e => GF.daysUntil(e.date) <= 21).length;
    const pending = E.pendingAssignments().length;
    const avg = E.overallAvg() ?? 65;
    const gapBoost = avg < 60 ? 3 : avg < 75 ? 1.5 : 0;
    return Math.round(GF.clamp(4 + examLoad * 1.5 + pending * 0.5 + gapBoost, 4, 21));
  };

  /* ----- gamification ----- */

  E.levelInfo = () => {
    const xp = GF.state.game.xp;
    let idx = 0;
    GF.LEVELS.forEach((l, i) => { if (xp >= l.xp) idx = i; });
    const cur = GF.LEVELS[idx];
    const next = GF.LEVELS[idx + 1] || null;
    const span = next ? next.xp - cur.xp : 1;
    const into = next ? xp - cur.xp : 1;
    return {
      level: idx + 1,
      name: cur.name,
      xp,
      nextAt: next ? next.xp : null,
      progress: next ? GF.clamp(into / span, 0, 1) : 1,
    };
  };

  return E;
})();
