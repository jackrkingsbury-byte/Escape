/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — VIEWS
   ═══════════════════════════════════════════════════════════════ */

GF.views = (() => {
  const V = {};
  const E = () => GF.engine;
  const esc = GF.esc;

  const subjById = (id) => GF.state.subjects.find(s => s.id === id);
  const subjName = (id) => { const s = subjById(id); return s ? s.name : "General"; };
  const subjColor = (id) => { const s = subjById(id); return s ? s.color : "#5F7194"; };

  const gradePill = (v) => {
    if (v == null) return `<span class="pill">—</span>`;
    const cls = v >= 70 ? "good" : v >= 50 ? "warn" : "bad";
    return `<span class="pill ${cls}">${Math.round(v)}%</span>`;
  };

  const aiHeader = (text) => `<div class="ai-line"><span class="ai-dot"></span>${esc(text)}</div>`;

  /* ═══════════════ TODAY (AI STUDY PLANNER) ═══════════════ */

  V.today = () => {
    const eng = E();
    const plan = eng.dailyPlan();
    const doneKeys = eng.planDoneKeys();
    const doneCount = plan.filter(p => doneKeys.includes(p.key)).length;
    const totalMin = plan.reduce((a, p) => a + p.minutes, 0);
    const doneMin = plan.filter(p => doneKeys.includes(p.key)).reduce((a, p) => a + p.minutes, 0);
    const pct = plan.length ? Math.round(doneCount / plan.length * 100) : 0;
    const hour = new Date().getHours();
    const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const name = GF.state.user.name || "Scholar";
    const allDone = plan.length && doneCount === plan.length;

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Today's Plan</div>
      <div class="section-sub">Your AI-built study plan — ranked by what moves your grades the most</div></div>
    </div>

    <div class="grid grid-12">
      <div class="card hero-card" style="grid-template-columns:auto 1fr">
        <div class="hero-ring-wrap">
          ${GF.charts.ring(pct, { size: 150, stroke: 12 })}
          <div class="ring-center"><div class="ring-score" style="font-size:34px">${doneCount}<span style="font-size:18px;color:var(--text-3)">/${plan.length}</span></div><div class="ring-label">tasks done</div></div>
        </div>
        <div class="hero-body">
          ${aiHeader("PLAN ENGINE · spacing · interleaving · retrieval · 80/20")}
          <h2>${esc(greet)}, <span class="status-word">${esc(name)}</span></h2>
          <p>${allDone
            ? "Plan complete — outstanding. Every task today was chosen to move your grades the most. Rest, or get ahead of tomorrow."
            : plan.length
              ? `${plan.length - doneCount} task${plan.length - doneCount === 1 ? "" : "s"} left — about <b>${totalMin - doneMin} min</b> of focused study. Work them top to bottom; they're ranked by impact.`
              : "Add subjects, marks, flashcards and exams — your AI builds a fresh daily plan here automatically."}</p>
          ${plan.length ? `<div class="progress-line mt-12" style="max-width:460px"><div class="pl-fill" style="width:${pct}%"></div></div>` : ""}
        </div>
      </div>

      ${plan.length ? `
      <div class="card col-8">
        <div class="card-title"><span class="ico">✅</span> Your Missions Today <span class="ai-tag">AI RANKED</span></div>
        <div class="row-list">
          ${plan.map(p => { const done = doneKeys.includes(p.key); return `
          <div class="row-item ${done ? "completed" : ""}">
            <button class="gf-check ${done ? "done" : ""}" onclick="GF.app.togglePlanItem('${p.key}')" title="Mark done">✓</button>
            <div style="font-size:20px">${p.icon}</div>
            <div class="ri-main">
              <div class="ri-title">${esc(p.title)}</div>
              <div class="ri-sub"><span class="method-tag">${esc(p.method)}</span> ${esc(p.detail)}</div>
            </div>
            <div class="ri-end" style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
              <span class="pill info">${p.minutes} min</span>
              <button class="btn btn-sm" onclick="GF.app.go('${p.action}')">Go →</button>
            </div>
          </div>`; }).join("")}
        </div>
        <div class="small muted mt-12">⏱️ About ${totalMin} min total · ticking these off banks XP and protects your streak.</div>
      </div>

      <div class="card col-4">
        <div class="card-title"><span class="ico">🔬</span> Why This Works <span class="ai-tag">PROVEN</span></div>
        <div class="row-list">
          <div class="insight"><div class="ins-icon">🔀</div><div><div class="ins-title">Interleaving</div><div class="ins-text">Mixing subjects in one day beats blocking — switching forces deeper learning.</div></div></div>
          <div class="insight purple"><div class="ins-icon">🧩</div><div><div class="ins-title">Retrieval &amp; Spacing</div><div class="ins-text">Recalling on a schedule roughly doubles what you keep vs. re-reading.</div></div></div>
          <div class="insight good"><div class="ins-icon">🎯</div><div><div class="ins-title">80/20 Focus</div><div class="ins-text">The plan front-loads the few tasks that shift your grades most — not busywork.</div></div></div>
        </div>
      </div>` : `<div class="card col-12"><div class="empty"><div class="e-ico">🗓️</div><div class="e-title">Your plan is empty</div><div class="e-sub">Add subjects, log marks, create flashcards and track exams — your AI builds a fresh daily plan automatically.</div><button class="btn btn-primary" onclick="GF.app.go('marks')">Add a subject →</button></div></div>`}
    </div>`;
  };

  /* ═══════════════ DASHBOARD ═══════════════ */

  V.dashboard = () => {
    const eng = E();
    const ac = eng.academicScore();
    const forecast = eng.successForecast();
    const examReady = eng.overallExamReadiness();
    const focus = Math.round(eng.focusScore());
    const lvl = eng.levelInfo();
    const pending = eng.pendingAssignments();
    const exams = eng.upcomingExams();
    const insights = eng.insights();
    const avg = eng.overallAvg();
    const weak = eng.weakestSubject();

    const meters = ac.parts ? `
      <div class="hero-meters">
        ${heroMeter("AI Grade Predictor", forecast != null ? Math.round(forecast) : "—", "%", "#35DDEF", forecast ?? 0, "projected term result")}
        ${heroMeter("Exam Readiness", examReady ?? "—", examReady != null ? "%" : "", "#8B7CF6", examReady ?? 0, exams.length ? `${exams.length} exam${exams.length > 1 ? "s" : ""} tracked` : "no exams tracked")}
        ${heroMeter("Focus Score", focus, "%", "#4F8BFF", focus, `${eng.weekFocusMinutes()} min this week`)}
        ${heroMeter("Momentum", Math.round(ac.parts.momentum), "", "#3DD9A4", ac.parts.momentum, ac.parts.momentum >= 55 ? "trending upward" : ac.parts.momentum >= 45 ? "holding steady" : "needs attention")}
      </div>` : `
      <div class="mt-16"><button class="btn btn-primary" onclick="GF.app.openAddSubject()">+ Add your first subject to activate the AI engine</button></div>`;

    const examRows = exams.slice(0, 3).map(ex => {
      const d = GF.daysUntil(ex.date);
      const r = eng.examReadiness(ex);
      return `<div class="row-item">
        <span class="subj-dot" style="color:${subjColor(ex.subjectId)};background:${subjColor(ex.subjectId)}"></span>
        <div class="ri-main">
          <div class="ri-title">${esc(subjName(ex.subjectId))}</div>
          <div class="ri-sub">${esc(ex.title)} · ${GF.fmtDate(ex.date)}</div>
        </div>
        <div class="ri-end">
          <div class="mono" style="font-weight:700;font-size:15px;color:${d <= 3 ? "var(--bad)" : d <= 7 ? "var(--warn)" : "var(--text-1)"}">${d}d</div>
          <div class="muted" style="font-size:10px">ready ${r}%</div>
        </div>
      </div>`;
    }).join("") || `<div class="empty"><div class="e-ico">🛡️</div><div class="e-title">No exams on radar</div><div class="e-sub">Add upcoming exams so the AI can track your readiness.</div><button class="btn btn-sm" onclick="GF.app.openAddExam()">+ Add Exam</button></div>`;

    const taskRows = pending.slice(0, 4).map(a => assignmentRow(a)).join("") ||
      `<div class="empty"><div class="e-ico">✨</div><div class="e-title">All clear</div><div class="e-sub">No pending assignments. Add new work as it lands.</div><button class="btn btn-sm" onclick="GF.app.openAddAssignment()">+ Add Assignment</button></div>`;

    const insightRows = insights.map(i =>
      `<div class="insight ${i.cls}"><div class="ins-icon">${i.icon}</div><div><div class="ins-title">${esc(i.title)}</div><div class="ins-text">${esc(i.text)}</div></div></div>`
    ).join("");

    const recentAch = Object.entries(GF.state.game.achievements)
      .sort((a, b) => b[1].localeCompare(a[1])).slice(0, 3)
      .map(([id]) => GF.ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean);

    return `
    <div class="grid grid-12">

      <div class="card hero-card">
        <div class="hero-ring-wrap">
          ${GF.charts.ring(ac.score ?? 0, { size: 168, stroke: 13 })}
          <div class="ring-center">
            <div class="ring-score count-up" ${ac.score != null ? `data-count="${ac.score}"` : ""}>${ac.score ?? "—"}</div>
            <div class="ring-label">AI Academic Score</div>
          </div>
        </div>
        <div class="hero-body">
          ${aiHeader("AI ENGINE · live analysis of your academic data")}
          <h2>Status: <span class="status-word">${esc(ac.label)}</span></h2>
          <p>${ac.score != null
            ? `Your composite score blends performance, consistency, momentum, discipline and focus. ${ac.score >= 76 ? "You're operating above the curve — protect the streak." : ac.score >= 62 ? "Solid base. The fastest gain right now: " + (weak ? esc(weak.s.name) : "your weakest subject") + "." : "The engine has found clear quick wins below. Small daily moves compound fast."}`
            : "Add subjects and log your first marks — the AI engine activates instantly and starts forecasting your grades."}</p>
          ${meters}
        </div>
      </div>

      <div class="card col-4 hoverable">
        <div class="card-title"><span class="ico">📊</span> Current Average <span class="ai-tag">LIVE</span></div>
        <div class="flex spread">
          <div>
            <div class="big-num">${avg != null ? Math.round(avg) + "<span class='unit'>%</span>" : "—"}</div>
            ${forecast != null && avg != null ? `<div class="delta ${forecast >= avg + 1 ? "up" : forecast <= avg - 1 ? "down" : "flat"}">${forecast >= avg + 1 ? "▲" : forecast <= avg - 1 ? "▼" : "■"} AI forecast: ${Math.round(forecast)}%</div>` : `<div class="delta flat">awaiting data</div>`}
          </div>
          ${GF.charts.sparkline(allMarksSeries(), { w: 110, h: 40 })}
        </div>
      </div>

      <div class="card col-4 hoverable">
        <div class="card-title"><span class="ico">🔥</span> Study Streak</div>
        <div class="flex spread">
          <div>
            <div class="big-num">${GF.state.game.streak.count}<span class="unit"> days</span></div>
            <div class="delta flat">best: ${GF.state.game.streak.best} days</div>
          </div>
          <div style="font-size:38px;filter:drop-shadow(0 0 14px rgba(251,146,60,.7))">${GF.state.game.streak.count >= 7 ? "🔥" : GF.state.game.streak.count >= 3 ? "✨" : "🌱"}</div>
        </div>
        <div class="progress-line mt-12"><div class="pl-fill" style="width:${GF.clamp(GF.state.game.streak.count / 30 * 100, 3, 100)}%"></div></div>
        <div class="small muted mt-8">${30 - GF.clamp(GF.state.game.streak.count, 0, 30)} days to Eruption badge 🌋</div>
      </div>

      <div class="card col-4 hoverable">
        <div class="card-title"><span class="ico">⚔️</span> Level ${lvl.level} — ${esc(lvl.name)}</div>
        <div class="flex spread">
          <div>
            <div class="big-num mono">${lvl.xp}<span class="unit"> XP</span></div>
            <div class="delta flat">${lvl.nextAt ? lvl.nextAt - lvl.xp + " XP to level " + (lvl.level + 1) : "MAX LEVEL"}</div>
          </div>
          <div style="font-size:38px">🛡️</div>
        </div>
        <div class="progress-line mt-12"><div class="pl-fill" style="width:${Math.round(lvl.progress * 100)}%"></div></div>
        ${recentAch.length ? `<div class="flex mt-12" style="gap:7px">${recentAch.map(a => `<span class="pill purple" title="${esc(a.desc)}">${a.icon} ${esc(a.name)}</span>`).join("")}</div>` : ""}
      </div>

      <div class="card col-7">
        <div class="card-title"><span class="ico">📈</span> Performance Trajectory <span class="ai-tag">AI ANALYZED</span></div>
        ${GF.charts.lineChart(trajectorySeries())}
      </div>

      <div class="card col-5">
        <div class="card-title"><span class="ico">🤖</span> AI Insight Feed <span class="ai-tag">AI</span></div>
        <div class="row-list">${insightRows}</div>
      </div>

      <div class="card col-4">
        <div class="card-title"><span class="ico">🛡️</span> Exam Radar</div>
        <div class="row-list">${examRows}</div>
        ${exams.length ? `<button class="btn btn-ghost btn-sm btn-block mt-12" onclick="GF.app.go('exams')">Open Exam Center →</button>` : ""}
      </div>

      <div class="card col-4">
        <div class="card-title"><span class="ico">⚡</span> Mission Queue</div>
        <div class="row-list">${taskRows}</div>
        ${pending.length ? `<button class="btn btn-ghost btn-sm btn-block mt-12" onclick="GF.app.go('assignments')">Open Assignments →</button>` : ""}
      </div>

      <div class="card col-4">
        <div class="card-title"><span class="ico">🗓️</span> Study Heatmap <span class="ai-tag">12 WEEKS</span></div>
        ${GF.charts.heatmap(GF.state.focusSessions)}
        <div class="spread mt-12">
          <span class="small muted">${totalFocusHours()}h total focused study</span>
          <button class="btn btn-sm" onclick="GF.app.go('focus')">Start session ▸</button>
        </div>
      </div>

    </div>`;
  };

  const heroMeter = (label, val, unit, color, fill, sub) => `
    <div class="meter">
      <div class="m-label"><span>${esc(label)}</span></div>
      <div class="m-value">${val}<span class="unit">${unit}</span></div>
      <div class="m-bar"><div class="m-fill" style="width:${GF.clamp(fill, 0, 100)}%;background:${color};box-shadow:0 0 9px ${color}"></div></div>
      <div class="small muted" style="font-size:10px;margin-top:6px">${esc(sub)}</div>
    </div>`;

  const allMarksSeries = () => {
    const all = GF.state.subjects.flatMap(s => s.marks.map(m => ({ date: m.date, v: m.score / m.total * 100 })));
    return all.sort((a, b) => a.date.localeCompare(b.date)).map(m => m.v);
  };

  const trajectorySeries = () => {
    const all = GF.state.subjects.flatMap(s => s.marks.map(m => ({ date: m.date, v: m.score / m.total * 100 })))
      .sort((a, b) => a.date.localeCompare(b.date));
    // rolling average so the curve reads as a trajectory, not noise
    return all.map((m, i) => {
      const win = all.slice(Math.max(0, i - 2), i + 1);
      return { label: GF.fmtDate(m.date), value: win.reduce((a, x) => a + x.v, 0) / win.length };
    });
  };

  const totalFocusHours = () =>
    Math.round(GF.state.focusSessions.reduce((a, s) => a + s.minutes, 0) / 60 * 10) / 10;

  /* ═══════════════ MARKS CENTER ═══════════════ */

  V.marks = () => {
    const eng = E();
    const cards = GF.state.subjects.map(s => {
      const avg = eng.subjectAvg(s);
      const pred = eng.predictNext(s);
      const delta = eng.subjectDelta(s);
      const last = [...s.marks].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
      return `
      <div class="card col-4 hoverable subject-card">
        <div class="sc-head">
          <span class="subj-dot" style="color:${s.color};background:${s.color}"></span>
          <span class="sc-name">${esc(s.name)}</span>
          ${GF.charts.sparkline(s.marks.length ? [...s.marks].sort((a, b) => a.date.localeCompare(b.date)).map(m => m.score / m.total * 100) : [], { w: 76, h: 28, color: s.color })}
        </div>
        <div class="sc-grid">
          <div class="sc-stat"><div class="lab">Average</div><div class="val" style="color:${avg == null ? "var(--text-3)" : avg >= 70 ? "var(--good)" : avg >= 50 ? "var(--warn)" : "var(--bad)"}">${avg != null ? Math.round(avg) + "%" : "—"}</div></div>
          <div class="sc-stat"><div class="lab">AI Predicts</div><div class="val grad-text">${pred != null ? Math.round(pred) + "%" : "—"}</div></div>
          <div class="sc-stat"><div class="lab">Target</div><div class="val">${s.target}%</div></div>
        </div>
        ${s.marks.length >= 2 ? `<div class="delta ${delta > 1 ? "up" : delta < -1 ? "down" : "flat"}" style="font-size:11.5px">${delta > 1 ? "▲ improving" : delta < -1 ? "▼ slipping" : "■ stable"} ${delta ? `(${delta > 0 ? "+" : ""}${Math.round(delta)}% vs earlier work)` : ""}</div>` : ""}
        ${last.length ? `<div class="flex" style="flex-wrap:wrap;gap:6px">${last.map(m => `<span class="mark-chip" title="${esc(m.title)}">${esc(m.type || "Mark")} · <b style="color:${m.score / m.total >= .7 ? "var(--good)" : m.score / m.total >= .5 ? "var(--warn)" : "var(--bad)"}">${Math.round(m.score / m.total * 100)}%</b></span>`).join("")}</div>` : `<div class="small muted">No marks yet — log your first result.</div>`}
        <div class="flex" style="gap:8px">
          <button class="btn btn-sm btn-primary" onclick="GF.app.openAddMark('${s.id}')">+ Mark</button>
          <button class="btn btn-sm" onclick="GF.app.openSubjectDetail('${s.id}')">History</button>
          <button class="btn btn-sm btn-ghost" style="margin-left:auto" onclick="GF.app.confirmDeleteSubject('${s.id}')">✕</button>
        </div>
      </div>`;
    }).join("");

    const best = eng.bestSubject(), weak = eng.weakestSubject();

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Marks Center</div>
      <div class="section-sub">AI Performance Analyzer™ — every mark sharpens your predictions</div></div>
      <button class="btn btn-primary" onclick="GF.app.openAddSubject()">+ Add Subject</button>
    </div>

    ${(best || weak) ? `
    <div class="grid grid-12 mb-12" style="margin-bottom:16px">
      <div class="card col-6">
        <div class="card-title"><span class="ico">🏆</span> Strength Detected <span class="ai-tag">AI</span></div>
        ${best ? `<div class="flex spread"><div><div style="font-weight:700;font-family:var(--font-display);font-size:16px">${esc(best.s.name)}</div><div class="small muted">Your most reliable scorer — keep it warm with light reviews.</div></div>${gradePill(best.avg)}</div>` : ""}
      </div>
      <div class="card col-6">
        <div class="card-title"><span class="ico">🎯</span> Growth Opportunity <span class="ai-tag">AI</span></div>
        ${weak ? `<div class="flex spread"><div><div style="font-weight:700;font-family:var(--font-display);font-size:16px">${esc(weak.s.name)}</div><div class="small muted">Highest-leverage subject — every session here moves your average most.</div></div>${gradePill(weak.avg)}</div>` : ""}
      </div>
    </div>` : ""}

    <div class="grid grid-12">
      ${cards || `<div class="card col-12"><div class="empty"><div class="e-ico">📚</div><div class="e-title">No subjects yet</div><div class="e-sub">Add your subjects to start tracking marks and unlock AI grade predictions.</div><button class="btn btn-primary" onclick="GF.app.openAddSubject()">+ Add Your First Subject</button></div></div>`}
    </div>`;
  };

  /* ═══════════════ ASSIGNMENTS ═══════════════ */

  const assignmentRow = (a) => {
    const d = GF.daysUntil(a.due);
    const urg = a.done ? "" : d < 0 ? "bad" : d <= 1 ? "bad" : d <= 3 ? "warn" : "info";
    const urgText = a.done ? "done" : d < 0 ? `${-d}d overdue` : d === 0 ? "due today" : d === 1 ? "due tomorrow" : `${d}d left`;
    return `<div class="row-item ${a.done ? "completed" : ""}">
      <button class="gf-check ${a.done ? "done" : ""}" onclick="GF.app.toggleAssignment('${a.id}')" title="Mark complete">✓</button>
      <div class="ri-main">
        <div class="ri-title">${esc(a.title)}</div>
        <div class="ri-sub" style="color:${subjColor(a.subjectId)}">${esc(subjName(a.subjectId))} · due ${GF.fmtDate(a.due)}</div>
      </div>
      <div class="ri-end">
        <span class="pill ${urg || "good"}">${urgText}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteAssignment('${a.id}')" title="Delete">✕</button>
    </div>`;
  };

  V.assignments = () => {
    const eng = E();
    const pending = eng.pendingAssignments();
    const done = GF.state.assignments.filter(a => a.done).sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""));
    const overdue = pending.filter(a => GF.daysUntil(a.due) < 0);
    const week = pending.filter(a => { const d = GF.daysUntil(a.due); return d >= 0 && d <= 7; });
    const disc = Math.round(eng.assignmentScore());

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Assignment Center</div>
      <div class="section-sub">Smart priorities · deadline defense · workload balancing</div></div>
      <button class="btn btn-primary" onclick="GF.app.openAddAssignment()">+ Add Assignment</button>
    </div>

    <div class="grid grid-12">
      <div class="card col-3 hoverable center">
        <div class="card-title" style="justify-content:center"><span class="ico">⚡</span> Pending</div>
        <div class="big-num">${pending.length}</div>
      </div>
      <div class="card col-3 hoverable center">
        <div class="card-title" style="justify-content:center"><span class="ico">🚨</span> Overdue</div>
        <div class="big-num" style="color:${overdue.length ? "var(--bad)" : "var(--good)"}">${overdue.length}</div>
      </div>
      <div class="card col-3 hoverable center">
        <div class="card-title" style="justify-content:center"><span class="ico">📅</span> Due This Week</div>
        <div class="big-num" style="color:${week.length > 3 ? "var(--warn)" : "var(--text-1)"}">${week.length}</div>
      </div>
      <div class="card col-3 hoverable center">
        <div class="card-title" style="justify-content:center"><span class="ico">🛡️</span> Discipline Score</div>
        <div class="big-num" style="color:${disc >= 75 ? "var(--good)" : disc >= 50 ? "var(--warn)" : "var(--bad)"}">${disc}</div>
      </div>

      <div class="card col-7">
        <div class="card-title"><span class="ico">🎯</span> Priority Queue <span class="ai-tag">AI SORTED</span></div>
        <div class="row-list">
          ${pending.map(assignmentRow).join("") || `<div class="empty"><div class="e-ico">🏝️</div><div class="e-title">Inbox zero</div><div class="e-sub">Nothing pending. Enjoy it — or get ahead of next week.</div></div>`}
        </div>
      </div>

      <div class="card col-5">
        <div class="card-title"><span class="ico">✅</span> Completed (${done.length})</div>
        <div class="row-list">
          ${done.slice(0, 8).map(assignmentRow).join("") || `<div class="empty"><div class="e-ico">📭</div><div class="e-title">Nothing completed yet</div><div class="e-sub">Finished work lands here — and earns XP.</div></div>`}
        </div>
      </div>
    </div>`;
  };

  /* ═══════════════ EXAM CENTER ═══════════════ */

  V.exams = () => {
    const eng = E();
    const ups = eng.upcomingExams();
    const past = GF.state.exams.filter(e => GF.daysUntil(e.date) < 0).sort((a, b) => b.date.localeCompare(a.date));
    const overall = eng.overallExamReadiness();

    const cards = ups.map(ex => {
      const d = GF.daysUntil(ex.date);
      const r = eng.examReadiness(ex);
      const cls = d <= 3 ? "critical" : d <= 7 ? "soon" : "";
      const subj = subjById(ex.subjectId);
      return `
      <div class="card col-6 hoverable">
        <div class="exam-card ${cls}">
          <div class="countdown">
            <div class="cd-num">${d}</div>
            <div class="cd-lab">days left</div>
          </div>
          <div style="flex:1;min-width:0">
            <div class="flex spread">
              <div>
                <div style="font-weight:700;font-family:var(--font-display);font-size:15px;color:${subj ? subj.color : "inherit"}">${esc(subjName(ex.subjectId))}</div>
                <div class="small muted">${esc(ex.title)} · ${GF.fmtDate(ex.date)}</div>
              </div>
              <span class="pill ${r >= 75 ? "good" : r >= 55 ? "warn" : "bad"}">${r}% ready</span>
            </div>
            <div class="mt-12">
              <div class="spread" style="margin-bottom:4px"><span class="small muted">Confidence</span><span class="small mono">${ex.confidence}%</span></div>
              <input type="range" min="0" max="100" value="${ex.confidence}" oninput="GF.app.setExamConfidence('${ex.id}', this.value)">
            </div>
            <div class="flex mt-8" style="gap:8px">
              <button class="btn btn-sm btn-primary" onclick="GF.app.coachForExam('${ex.id}')">⚡ AI Battle Plan</button>
              <button class="btn btn-sm btn-ghost" style="margin-left:auto" onclick="GF.app.deleteExam('${ex.id}')">✕</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join("");

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Exam Center</div>
      <div class="section-sub">AI Exam Readiness™ — know exactly where you stand before you walk in</div></div>
      <button class="btn btn-primary" onclick="GF.app.openAddExam()">+ Add Exam</button>
    </div>

    <div class="grid grid-12">
      <div class="card col-4 center">
        <div class="card-title" style="justify-content:center"><span class="ico">🛡️</span> Fleet Readiness <span class="ai-tag">AI</span></div>
        <div class="hero-ring-wrap" style="margin:4px auto">
          ${GF.charts.ring(overall ?? 0, { size: 130, stroke: 11 })}
          <div class="ring-center">
            <div class="ring-score" style="font-size:32px">${overall ?? "—"}</div>
            <div class="ring-label">avg readiness</div>
          </div>
        </div>
        <div class="small muted mt-8">${overall == null ? "Add exams to activate readiness tracking." : overall >= 75 ? "Battle ready. Maintain with active recall." : overall >= 55 ? "Closing the gap — drill weak topics first." : "Readiness is low. Run an AI Battle Plan now."}</div>
      </div>

      <div class="card col-8">
        <div class="card-title"><span class="ico">📡</span> Readiness by Exam</div>
        ${ups.length ? ups.map(ex => GF.charts.barRow(`${subjName(ex.subjectId)} — ${ex.title}`, eng.examReadiness(ex), subjColor(ex.subjectId), `${GF.daysUntil(ex.date)}d out`)).join("") : `<div class="empty"><div class="e-ico">📡</div><div class="e-title">Radar empty</div><div class="e-sub">Add your upcoming exams and the AI will score your readiness for each one.</div></div>`}
      </div>

      ${cards}

      ${past.length ? `
      <div class="card col-12">
        <div class="card-title"><span class="ico">📜</span> Past Exams</div>
        <div class="row-list">${past.slice(0, 6).map(ex => `
          <div class="row-item">
            <span class="subj-dot" style="color:${subjColor(ex.subjectId)};background:${subjColor(ex.subjectId)}"></span>
            <div class="ri-main"><div class="ri-title">${esc(subjName(ex.subjectId))} — ${esc(ex.title)}</div><div class="ri-sub">${GF.fmtDate(ex.date)}</div></div>
            <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteExam('${ex.id}')">✕</button>
          </div>`).join("")}</div>
      </div>` : ""}
    </div>`;
  };

  /* ═══════════════ AI STUDY COACH ═══════════════ */

  V.coach = () => {
    const isSA = GF.state.user.mode === "sa";
    const actions = GF.COACH_ACTIONS.filter(a => !a.sa || isSA);
    const subjects = GF.state.subjects;
    const sel = GF.coachState || (GF.coachState = { action: "explain", subjectId: subjects[0]?.id || "", topic: "" });

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> AI Study Coach</div>
      <div class="section-sub">Your private AI tutor — one click builds a precision prompt for ChatGPT, Claude or Gemini</div></div>
    </div>

    <div class="grid grid-12">
      <div class="card col-12">
        ${aiHeader("COACH ENGINE · select a mode, aim it at a topic, deploy")}
        <div class="coach-actions">
          ${actions.map(a => `
          <button class="coach-btn ${sel.action === a.id ? "selected" : ""}" onclick="GF.app.coachSelect('${a.id}')">
            <span class="cb-ico">${a.icon}</span>
            <span class="cb-name">${esc(a.name)}</span>
            <span class="cb-desc">${esc(a.desc)}</span>
          </button>`).join("")}
        </div>
      </div>

      <div class="card col-5">
        <div class="card-title"><span class="ico">🎛️</span> Mission Parameters</div>
        <div class="field">
          <label>Subject</label>
          <select id="coach-subject" onchange="GF.app.coachParam('subjectId', this.value)">
            ${subjects.map(s => `<option value="${s.id}" ${sel.subjectId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
            ${subjects.length ? "" : `<option value="">Add subjects in Marks Center first</option>`}
          </select>
        </div>
        <div class="field">
          <label>Topic</label>
          <input id="coach-topic" placeholder="e.g. Trigonometric identities" value="${esc(sel.topic)}" oninput="GF.app.coachParam('topic', this.value)">
          <span class="hint">Be specific — the sharper the topic, the sharper the AI.</span>
        </div>
        <button class="btn btn-primary btn-block" onclick="GF.app.coachGenerate()">⚡ Generate Coach Prompt</button>
        <div class="small muted mt-12">💡 Pro move: paste the prompt into your AI of choice, then save the best outputs into your notes.</div>
      </div>

      <div class="card col-7">
        <div class="card-title"><span class="ico">🧠</span> Deployed Prompt <span class="ai-tag">READY TO PASTE</span></div>
        <div class="prompt-output" id="coach-output">${esc(GF.coachOutput || "Your engineered prompt will appear here.\n\nSelect a coaching mode, set the subject and topic, then hit Generate.\n\nEach prompt is built with proven learning-science structure:\nactive recall · spaced repetition · 80/20 prioritisation · exam alignment.")}</div>
        <div class="flex mt-12" style="gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="GF.app.coachCopy()">📋 Copy Prompt</button>
          <button class="btn" onclick="GF.app.coachOpen('chatgpt')">💬 Open in ChatGPT</button>
          <button class="btn" onclick="GF.app.coachOpen('gemini')">✨ Open in Gemini</button>
        </div>
        <div class="small muted mt-8">✅ 100% free — powered by the AI you already have. Tap a button: your prompt is copied and your AI opens. Paste if it isn't already filled in.</div>
      </div>
    </div>`;
  };

  /* ═══════════════ FOCUS ENGINE ═══════════════ */

  V.focus = () => {
    const eng = E();
    const t = GF.timer;
    const goal = GF.state.user.weeklyFocusGoalMin;
    const weekMin = eng.weekFocusMinutes();
    const recent = [...GF.state.focusSessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> AI Focus Engine™</div>
      <div class="section-sub">Deep work sessions · streaks · every focused minute earns XP</div></div>
    </div>

    <div class="grid grid-12">
      <div class="card col-6">
        <div class="mode-pills">
          <button class="mode-pill ${t.modeName === "Pomodoro" ? "active" : ""}" onclick="GF.app.timerMode('Pomodoro', 25)">🍅 Pomodoro 25</button>
          <button class="mode-pill ${t.modeName === "Deep Work" ? "active" : ""}" onclick="GF.app.timerMode('Deep Work', 50)">🌊 Deep Work 50</button>
          <button class="mode-pill ${t.modeName === "Sprint" ? "active" : ""}" onclick="GF.app.timerMode('Sprint', 15)">⚡ Sprint 15</button>
          <button class="mode-pill ${t.modeName === "Break" ? "active" : ""}" onclick="GF.app.timerMode('Break', 5)">☕ Break 5</button>
        </div>
        <div class="timer-wrap">
          <div id="timer-ring">${GF.charts.ring(t.total ? (t.remaining / t.total) * 100 : 100, { size: 210, stroke: 13 })}</div>
          <div class="timer-center">
            <div class="timer-time" id="timer-time">${GF.app ? GF.app.fmtTime(t.remaining) : "25:00"}</div>
            <div class="timer-mode">${esc(t.modeName)}</div>
          </div>
        </div>
        <div class="timer-controls">
          ${t.running
            ? `<button class="btn btn-primary" onclick="GF.app.timerPause()">⏸ Pause</button>`
            : `<button class="btn btn-primary" onclick="GF.app.timerStart()">▶ ${t.remaining < t.total ? "Resume" : "Launch Session"}</button>`}
          <button class="btn" onclick="GF.app.timerReset()">↺ Reset</button>
          ${t.total - t.remaining >= 60 ? `<button class="btn" onclick="GF.app.timerFinishEarly()">✔ Log & Finish</button>` : ""}
        </div>
        <div class="center small muted mt-12">Finish a session to bank XP and feed your streak 🔥</div>
      </div>

      <div class="card col-6">
        <div class="card-title"><span class="ico">📊</span> Weekly Focus <span class="ai-tag">AI TRACKED</span></div>
        <div class="flex spread">
          <div>
            <div class="big-num">${weekMin}<span class="unit"> / ${goal} min</span></div>
            <div class="delta ${weekMin >= goal ? "up" : "flat"}">${weekMin >= goal ? "▲ goal smashed" : Math.round(eng.focusScore()) + "% of weekly goal"}</div>
          </div>
          <div style="font-size:36px">${weekMin >= goal ? "🏆" : "🎯"}</div>
        </div>
        <div class="progress-line mt-12"><div class="pl-fill" style="width:${GF.clamp(weekMin / goal * 100, 2, 100)}%"></div></div>

        <div class="card-title mt-20"><span class="ico">🗓️</span> Consistency Map</div>
        ${GF.charts.heatmap(GF.state.focusSessions)}

        <div class="card-title mt-20"><span class="ico">📜</span> Recent Sessions</div>
        <div class="row-list">
          ${recent.map(s => `<div class="row-item"><div class="ri-main"><div class="ri-title">${esc(s.mode)} — ${s.minutes} min</div><div class="ri-sub">${GF.fmtDate(s.date)}</div></div><span class="pill info">+${s.minutes} XP</span></div>`).join("") || `<div class="empty"><div class="e-ico">⏱️</div><div class="e-title">No sessions yet</div><div class="e-sub">Launch your first focus session — the heatmap starts glowing immediately.</div></div>`}
        </div>
      </div>
    </div>`;
  };

  /* ═══════════════ ACHIEVEMENTS ═══════════════ */

  V.achievements = () => {
    const lvl = E().levelInfo();
    const unlockedIds = GF.state.game.achievements;
    const unlockedCount = Object.keys(unlockedIds).length;

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Achievement Vault</div>
      <div class="section-sub">${unlockedCount} / ${GF.ACHIEVEMENTS.length} unlocked — every badge is a screenshot moment</div></div>
    </div>

    <div class="grid grid-12">
      <div class="card col-12 hero-card" style="grid-template-columns:auto 1fr">
        <div class="hero-ring-wrap">
          ${GF.charts.ring(lvl.progress * 100, { size: 140, stroke: 12 })}
          <div class="ring-center">
            <div class="ring-score" style="font-size:36px">${lvl.level}</div>
            <div class="ring-label">Level</div>
          </div>
        </div>
        <div class="hero-body">
          ${aiHeader("RANK SYSTEM · earn XP from marks, missions and focus")}
          <h2><span class="status-word">${esc(lvl.name)}</span></h2>
          <p class="mono" style="font-size:13px">${lvl.xp} XP banked${lvl.nextAt ? ` · ${lvl.nextAt - lvl.xp} XP until Level ${lvl.level + 1} — ${esc(GF.LEVELS[Math.min(lvl.level, GF.LEVELS.length - 1)].name)}` : " · MAXIMUM RANK ACHIEVED"}</p>
          <div class="progress-line mt-12" style="max-width:420px"><div class="pl-fill" style="width:${Math.round(lvl.progress * 100)}%"></div></div>
        </div>
      </div>

      <div class="card col-12">
        <div class="ach-grid">
          ${GF.ACHIEVEMENTS.map(a => {
            const got = unlockedIds[a.id];
            return `<div class="ach-card ${got ? "unlocked" : "locked"}">
              <div class="ach-icon">${a.icon}</div>
              <div>
                <div class="ach-name">${esc(a.name)}</div>
                <div class="ach-desc">${esc(a.desc)}</div>
                <div class="ach-xp">${got ? `UNLOCKED ${GF.fmtDate(got)}` : `+${a.xp} XP`}</div>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>`;
  };

  /* ═══════════════ UNIVERSITY HUB ═══════════════ */

  V.university = () => {
    const isSA = GF.state.user.mode === "sa";
    const aps = E().apsBreakdown();
    const band = E().apsBand(aps.total);
    const matricDays = GF.daysUntil(GF.state.user.matricDate);
    const u = GF.state.uni;

    const apsBlock = `
      <div class="card col-5">
        <div class="card-title"><span class="ico">🎓</span> APS Score Calculator <span class="ai-tag">${isSA ? "🇿🇦 NSC" : "SA MODULE"}</span></div>
        <div class="aps-display">
          <span class="aps-score count-up">${aps.total}</span><span class="aps-max"> / 42</span>
          <div class="aps-band"><span class="pill ${band.cls}">${esc(band.label)}</span></div>
          <div class="small muted mt-8" style="max-width:300px;margin-left:auto;margin-right:auto">${esc(band.note)}</div>
        </div>
        <div class="row-list mt-16">
          ${aps.rows.map(r => `
          <div class="aps-row">
            <div class="level-badge">${r.level}</div>
            <div class="ri-main">
              <div class="ri-title" style="font-size:12.5px">${esc(r.subject.name)} ${r.isLO ? `<span class="muted small">(LO — not counted)</span>` : ""}</div>
            </div>
            <span class="small mono" style="color:${r.avg >= 70 ? "var(--good)" : r.avg >= 50 ? "var(--warn)" : "var(--bad)"}">${Math.round(r.avg)}%</span>
          </div>`).join("") || `<div class="empty"><div class="e-ico">🧮</div><div class="e-title">No data yet</div><div class="e-sub">Log marks in the Marks Center — your APS calculates automatically from subject averages.</div></div>`}
        </div>
        <div class="small muted mt-12">APS = sum of your best 6 NSC levels (Life Orientation excluded). Levels: 80%+→7 · 70%+→6 · 60%+→5 · 50%+→4 · 40%+→3.</div>
      </div>`;

    const statusPill = (s) => {
      const map = { "Submitted": "good", "Accepted": "good", "In Progress": "info", "Applying": "info", "Planned": "warn", "Researching": "warn", "Rejected": "bad" };
      return `<span class="pill ${map[s] || "info"}">${esc(s)}</span>`;
    };

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> University Success Hub</div>
      <div class="section-sub">Applications · scholarships · portfolio · your future, engineered</div></div>
    </div>

    <div class="grid grid-12">
      ${isSA ? `
      <div class="card col-12 hero-card" style="grid-template-columns:auto 1fr">
        <div class="countdown center" style="min-width:120px">
          <div class="cd-num grad-text" style="font-size:54px;font-family:var(--font-display);font-weight:700">${Math.max(matricDays, 0)}</div>
          <div class="cd-lab">days to matric finals</div>
        </div>
        <div class="hero-body">
          ${aiHeader("MATRIC COMMAND · NSC final exams countdown")}
          <h2>Matric Countdown <span class="status-word">${matricDays > 100 ? "— runway is long. Build now." : matricDays > 30 ? "— sharpen the blade." : "— final approach. Execute."}</span></h2>
          <p>Finals begin ${GF.fmtDate(GF.state.user.matricDate)}. Your AI University Readiness combines APS trajectory, exam readiness and consistency. Change the date in Settings.</p>
        </div>
      </div>` : ""}

      ${apsBlock}

      <div class="card col-7">
        <div class="card-title"><span class="ico">🏛️</span> University Applications
          <button class="btn btn-sm" style="margin-left:auto" onclick="GF.app.openAddUni('applications')">+ Add</button>
        </div>
        <div class="row-list">
          ${u.applications.map(a => `<div class="row-item">
            <div class="ri-main"><div class="ri-title">${esc(a.institution)}</div><div class="ri-sub">${esc(a.course)} · deadline ${GF.fmtDate(a.deadline)}</div></div>
            ${statusPill(a.status)}
            <button class="btn btn-ghost btn-sm" onclick="GF.app.cycleUniStatus('applications','${a.id}')" title="Cycle status">↻</button>
            <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteUni('applications','${a.id}')">✕</button>
          </div>`).join("") || `<div class="empty"><div class="e-ico">🏛️</div><div class="e-title">No applications tracked</div><div class="e-sub">Add the universities you're targeting and never miss a deadline.</div></div>`}
        </div>

        <div class="card-title mt-20"><span class="ico">💰</span> Scholarship Tracker
          <button class="btn btn-sm" style="margin-left:auto" onclick="GF.app.openAddUni('scholarships')">+ Add</button>
        </div>
        <div class="row-list">
          ${u.scholarships.map(s => `<div class="row-item">
            <div class="ri-main"><div class="ri-title">${esc(s.name)}</div><div class="ri-sub">${esc(s.amount)} · deadline ${GF.fmtDate(s.deadline)}</div></div>
            ${statusPill(s.status)}
            <button class="btn btn-ghost btn-sm" onclick="GF.app.cycleUniStatus('scholarships','${s.id}')" title="Cycle status">↻</button>
            <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteUni('scholarships','${s.id}')">✕</button>
          </div>`).join("") || `<div class="empty"><div class="e-ico">💰</div><div class="e-title">No scholarships tracked</div><div class="e-sub">Free money exists. Track every opportunity here.</div></div>`}
        </div>

        <div class="card-title mt-20"><span class="ico">🏅</span> Achievement Portfolio
          <button class="btn btn-sm" style="margin-left:auto" onclick="GF.app.openAddUni('portfolio')">+ Add</button>
        </div>
        <div class="row-list">
          ${u.portfolio.map(p => `<div class="row-item">
            <div class="ri-main"><div class="ri-title">${esc(p.title)}</div><div class="ri-sub">${esc(p.category)} · ${GF.fmtDate(p.date)}</div></div>
            <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteUni('portfolio','${p.id}')">✕</button>
          </div>`).join("") || `<div class="empty"><div class="e-ico">🏅</div><div class="e-title">Portfolio empty</div><div class="e-sub">Log awards, leadership roles and projects — application season will thank you.</div></div>`}
        </div>
      </div>
    </div>`;
  };

  /* ═══════════════ MEMORY LAB (SPACED REPETITION) ═══════════════ */

  const reviewSessionView = () => {
    const r = GF.review;
    if (r.index >= r.queue.length) {
      return `
      <div class="section-head"><div><div class="section-title"><span class="dot"></span> Review Complete</div></div></div>
      <div class="grid grid-12"><div class="card col-12 hero-card" style="grid-template-columns:1fr;text-align:center">
        <div class="hero-body" style="margin:0 auto">
          <div style="font-size:48px">🎉</div>
          <h2>Session complete!</h2>
          <p style="margin:6px auto">You reviewed <b>${r.reviewed}</b> card${r.reviewed === 1 ? "" : "s"} and banked <b>${r.reviewed * 2} XP</b>. The AI has already scheduled each one for the perfect moment — come back tomorrow to lock it in.</p>
          <div class="flex" style="justify-content:center;gap:10px;margin-top:10px">
            <button class="btn btn-primary" onclick="GF.app.endReview()">Back to Memory Lab</button>
          </div>
        </div>
      </div></div>`;
    }
    const card = GF.state.flashcards.find(c => c.id === r.queue[r.index]);
    if (!card) return `<div class="card"><div class="empty"><div class="e-title">Card not found</div><button class="btn mt-12" onclick="GF.app.endReview()">Back</button></div></div>`;
    const subj = subjById(card.subjectId);
    const pct = Math.round((r.index / r.queue.length) * 100);
    const hint = (g) => { const c = JSON.parse(JSON.stringify(card)); E().srSchedule(c, g); return c.interval === 0 ? "<10m" : c.interval === 1 ? "1d" : c.interval + "d"; };
    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Reviewing${subj ? " · " + esc(subj.name) : ""}</div>
      <div class="section-sub">Card ${r.index + 1} of ${r.queue.length} — recall the answer before you flip</div></div>
      <button class="btn btn-ghost" onclick="GF.app.endReview()">✕ End</button>
    </div>
    <div class="progress-line" style="margin-bottom:16px"><div class="pl-fill" style="width:${pct}%"></div></div>
    <div class="grid grid-12">
      <div class="card col-12 flashcard ${r.showBack ? "flipped" : ""}" ${r.showBack ? "" : `onclick="GF.app.revealCard()" style="cursor:pointer"`}>
        <div class="fc-label">${r.showBack ? "✅ ANSWER" : "❓ QUESTION — recall it"}</div>
        <div class="fc-text">${esc(r.showBack ? card.back : card.front)}</div>
        ${r.showBack ? "" : `<div class="small muted" style="margin-top:18px">Tap the card to reveal the answer</div>`}
      </div>
      ${r.showBack ? `
      <div class="col-12 fc-grades">
        <button class="btn fc-grade again" onclick="GF.app.gradeCard(0)">😬 Again<span>${hint(0)}</span></button>
        <button class="btn fc-grade hard" onclick="GF.app.gradeCard(1)">😐 Hard<span>${hint(1)}</span></button>
        <button class="btn fc-grade good" onclick="GF.app.gradeCard(2)">🙂 Good<span>${hint(2)}</span></button>
        <button class="btn fc-grade easy" onclick="GF.app.gradeCard(3)">😎 Easy<span>${hint(3)}</span></button>
      </div>` : `<div class="col-12 center"><button class="btn btn-primary" onclick="GF.app.revealCard()">Show Answer</button></div>`}
    </div>`;
  };

  V.flashcards = () => {
    const eng = E();
    if (GF.review && GF.review.queue && GF.review.queue.length) return reviewSessionView();

    const st = eng.srStats();
    const decks = GF.state.subjects.map(s => ({
      s, cards: GF.state.flashcards.filter(c => c.subjectId === s.id), due: eng.cardsDue(s.id).length,
    })).filter(d => d.cards.length);

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Memory Lab</div>
      <div class="section-sub">Spaced repetition + active recall — the two most proven ways to remember anything</div></div>
      <button class="btn btn-primary" onclick="GF.app.openAddCard()">+ Add Card</button>
    </div>

    <div class="grid grid-12">
      <div class="card col-3 hoverable center"><div class="card-title" style="justify-content:center"><span class="ico">⏰</span> Due Today</div><div class="big-num" style="color:${st.due ? "var(--cyan)" : "var(--good)"}">${st.due}</div></div>
      <div class="card col-3 hoverable center"><div class="card-title" style="justify-content:center"><span class="ico">🃏</span> Total Cards</div><div class="big-num">${st.total}</div></div>
      <div class="card col-3 hoverable center"><div class="card-title" style="justify-content:center"><span class="ico">🧠</span> Mastered</div><div class="big-num" style="color:var(--good)">${st.mature}</div></div>
      <div class="card col-3 hoverable center"><div class="card-title" style="justify-content:center"><span class="ico">📈</span> Learning</div><div class="big-num" style="color:var(--warn)">${st.learning}</div></div>

      ${st.due ? `
      <div class="card col-12" style="display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">
        <div><div style="font-family:var(--font-display);font-weight:700;font-size:17px">${st.due} card${st.due === 1 ? "" : "s"} ready to review 🔥</div>
        <div class="small muted">Reviewing right before you'd forget is what burns knowledge into long-term memory.</div></div>
        <button class="btn btn-primary" onclick="GF.app.startReview()">⚡ Review All Due (${st.due})</button>
      </div>` : (st.total ? `
      <div class="card col-12"><div class="insight good"><div class="ins-icon">✅</div><div><div class="ins-title">All caught up!</div><div class="ins-text">Nothing due right now — the AI scheduled your next reviews for the optimal day. Add more cards or come back later.</div></div></div></div>` : "")}

      <div class="card col-8">
        <div class="card-title"><span class="ico">📚</span> Your Decks</div>
        <div class="row-list">
          ${decks.map(d => `<div class="row-item">
            <span class="subj-dot" style="color:${d.s.color};background:${d.s.color}"></span>
            <div class="ri-main"><div class="ri-title">${esc(d.s.name)}</div><div class="ri-sub">${d.cards.length} card${d.cards.length === 1 ? "" : "s"}${d.due ? ` · <span style="color:var(--cyan)">${d.due} due</span>` : ""}</div></div>
            <button class="btn btn-sm ${d.due ? "btn-primary" : ""}" onclick="GF.app.startReview('${d.s.id}')" ${d.due ? "" : 'disabled style="opacity:.45"'}>Review</button>
            <button class="btn btn-sm btn-ghost" onclick="GF.app.openDeck('${d.s.id}')">⋯</button>
          </div>`).join("") || `<div class="empty"><div class="e-ico">🃏</div><div class="e-title">No flashcards yet</div><div class="e-sub">Create your first card — the app schedules every review with spaced repetition, so you study less and remember more.</div><button class="btn btn-primary" onclick="GF.app.openAddCard()">+ Add Your First Card</button></div>`}
        </div>
      </div>

      <div class="card col-4">
        <div class="card-title"><span class="ico">🔬</span> The Science <span class="ai-tag">PROVEN</span></div>
        <div class="row-list">
          <div class="insight"><div class="ins-icon">🔁</div><div><div class="ins-title">Spaced Repetition</div><div class="ins-text">Each card returns just before you'd forget it — proven to beat cramming by roughly 2×.</div></div></div>
          <div class="insight purple"><div class="ins-icon">🧩</div><div><div class="ins-title">Active Recall</div><div class="ins-text">Pulling answers from memory (not re-reading) is the #1 technique in learning research.</div></div></div>
          <div class="insight good"><div class="ins-icon">⚡</div><div><div class="ins-title">10 minutes a day</div><div class="ins-text">Short daily reviews build durable memory and feed your study streak.</div></div></div>
        </div>
      </div>
    </div>`;
  };

  /* ═══════════════ STUDY LAB (TECHNIQUE LIBRARY) ═══════════════ */

  V.studylab = () => {
    const techs = GF.TECHNIQUES;
    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Study Lab</div>
      <div class="section-sub">${techs.length} proven study techniques — tap any card to learn exactly how and why it works</div></div>
    </div>
    <div class="grid grid-12">
      <div class="card col-12">
        ${aiHeader("TECHNIQUE LIBRARY · grounded in learning-science research")}
        <div class="tech-grid">
          ${techs.map(t => `
          <button class="tech-card" onclick="GF.app.openTechnique('${t.id}')">
            <div class="tc-ico">${t.icon}</div>
            <div class="tc-body">
              <div class="tc-name">${esc(t.name)}</div>
              <div class="tc-short">${esc(t.short)}</div>
            </div>
            <span class="tc-tag">${esc(t.tag)}</span>
          </button>`).join("")}
        </div>
        <div class="small muted mt-16">💡 Tip: try one new technique a week. The best method is the one you'll actually use consistently.</div>
      </div>
    </div>`;
  };

  /* ═══════════════ HABIT FORGE ═══════════════ */

  V.habits = () => {
    const eng = E();
    const hs = GF.state.habits;
    const t = eng.habitsToday();
    const cons = eng.habitConsistency();
    const today = GF.todayISO();
    const dayInitial = (iso) => ["S", "M", "T", "W", "T", "F", "S"][new Date(iso + "T00:00:00").getDay()];
    const bestStreak = hs.length ? Math.max(...hs.map(h => eng.habitStreak(h))) : 0;

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Habit Forge</div>
      <div class="section-sub">Small daily habits compound into big results — consistency beats intensity</div></div>
      <button class="btn btn-primary" onclick="GF.app.openAddHabit()">+ Add Habit</button>
    </div>

    <div class="grid grid-12">
      <div class="card col-4 center">
        <div class="card-title" style="justify-content:center"><span class="ico">✅</span> Done Today <span class="ai-tag">LIVE</span></div>
        <div class="hero-ring-wrap" style="margin:4px auto">
          ${GF.charts.ring(t.total ? t.done / t.total * 100 : 0, { size: 122, stroke: 10 })}
          <div class="ring-center"><div class="ring-score" style="font-size:30px">${t.done}<span style="font-size:16px;color:var(--text-3)">/${t.total}</span></div><div class="ring-label">habits</div></div>
        </div>
      </div>
      <div class="card col-4 hoverable center"><div class="card-title" style="justify-content:center"><span class="ico">📊</span> 7-Day Consistency</div><div class="big-num" style="color:${cons >= 70 ? "var(--good)" : cons >= 40 ? "var(--warn)" : "var(--bad)"}">${cons}%</div><div class="small muted mt-8">of your habit-days hit this week</div></div>
      <div class="card col-4 hoverable center"><div class="card-title" style="justify-content:center"><span class="ico">🔥</span> Best Streak</div><div class="big-num">${bestStreak}<span class="unit"> days</span></div><div class="small muted mt-8">don't break the chain</div></div>

      <div class="card col-8">
        <div class="card-title"><span class="ico">🔁</span> Your Daily Habits</div>
        <div class="row-list">
          ${hs.map(h => {
            const wk = eng.habitWeek(h), streak = eng.habitStreak(h);
            return `<div class="row-item habit-row">
              <div style="font-size:20px">${h.icon || "✅"}</div>
              <div class="ri-main"><div class="ri-title">${esc(h.name)}</div><div class="ri-sub">🔥 ${streak} day streak</div></div>
              <div class="habit-week">
                ${wk.map(d => `<button class="habit-dot ${d.done ? "on" : ""} ${d.iso === today ? "today" : ""}" title="${GF.fmtDate(d.iso)}" onclick="GF.app.toggleHabit('${h.id}','${d.iso}')"><span>${dayInitial(d.iso)}</span></button>`).join("")}
              </div>
              <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteHabit('${h.id}')">✕</button>
            </div>`;
          }).join("") || `<div class="empty"><div class="e-ico">🔁</div><div class="e-title">No habits yet</div><div class="e-sub">Add a small daily habit — just tracking it makes you far more likely to stick with it.</div><button class="btn btn-primary" onclick="GF.app.openAddHabit()">+ Add Your First Habit</button></div>`}
        </div>
      </div>

      <div class="card col-4">
        <div class="card-title"><span class="ico">🔬</span> Why Habits Win <span class="ai-tag">PROVEN</span></div>
        <div class="row-list">
          <div class="insight good"><div class="ins-icon">📈</div><div><div class="ins-title">1% better daily</div><div class="ins-text">Tiny consistent gains compound — small habits beat occasional cramming every time.</div></div></div>
          <div class="insight"><div class="ins-icon">🔗</div><div><div class="ins-title">Don't break the chain</div><div class="ins-text">Watching your streak grow is a powerful pull to show up again tomorrow.</div></div></div>
          <div class="insight purple"><div class="ins-icon">🧠</div><div><div class="ins-title">Habit stacking</div><div class="ins-text">Bolt a new habit onto one you already do — "after dinner, review flashcards."</div></div></div>
        </div>
      </div>
    </div>`;
  };

  /* ═══════════════ NOTES ═══════════════ */

  V.notes = () => {
    const notes = [...GF.state.notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || "").localeCompare(a.updated || ""));
    const colOf = (id) => { const s = subjById(id); return s ? s.color : "#5F7194"; };
    const nameOf = (id) => { const s = subjById(id); return s ? s.name : ""; };
    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Notes</div>
      <div class="section-sub">Capture summaries, checklists and reminders — pin the important ones</div></div>
      <button class="btn btn-primary" onclick="GF.app.openAddNote()">+ New Note</button>
    </div>
    <div class="notes-grid">
      ${notes.map(n => `
      <button class="note-card" style="--nc:${colOf(n.subjectId)}" onclick="GF.app.openNote('${n.id}')">
        <div class="note-title">${n.pinned ? "📌 " : ""}${esc(n.title || "Untitled")}</div>
        <div class="note-body">${esc((n.body || "").slice(0, 200))}${(n.body || "").length > 200 ? "…" : ""}</div>
        <div class="note-foot"><span class="note-subj">${n.subjectId ? esc(nameOf(n.subjectId)) : "General"}</span><span class="muted">${GF.fmtDate(n.updated)}</span></div>
      </button>`).join("") || `<div class="card" style="grid-column:1/-1"><div class="empty"><div class="e-ico">📝</div><div class="e-title">No notes yet</div><div class="e-sub">Jot down summaries, checklists or formulas — anything you want to keep handy.</div><button class="btn btn-primary" onclick="GF.app.openAddNote()">+ Write your first note</button></div></div>`}
    </div>`;
  };

  /* ═══════════════ TIMETABLE ═══════════════ */

  V.timetable = () => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDow = new Date(GF.todayISO() + "T00:00:00").getDay();
    const tt = GF.state.timetable;
    const colOf = (id) => { const s = subjById(id); return s ? s.color : "#5F7194"; };
    const present = new Set(tt.map(c => c.day));
    const showDays = [1, 2, 3, 4, 5].concat([6, 0].filter(d => present.has(d)));
    const nextUp = tt.filter(c => c.day === todayDow).sort((a, b) => (a.start || "").localeCompare(b.start || ""));

    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Timetable</div>
      <div class="section-sub">Your weekly class schedule — always know where to be and what's next</div></div>
      <button class="btn btn-primary" onclick="GF.app.openAddClass()">+ Add Class</button>
    </div>
    <div class="grid grid-12">
      ${tt.length ? showDays.map(d => {
        const classes = tt.filter(c => c.day === d).sort((a, b) => (a.start || "").localeCompare(b.start || ""));
        return `<div class="card col-4 ${d === todayDow ? "tt-today" : ""}">
          <div class="card-title"><span class="ico">${d === todayDow ? "📍" : "🗓️"}</span> ${dayNames[d]}${d === todayDow ? " · Today" : ""}</div>
          <div class="row-list">
            ${classes.map(c => `<div class="row-item">
              <span class="subj-dot" style="color:${colOf(c.subjectId)};background:${colOf(c.subjectId)}"></span>
              <div class="ri-main"><div class="ri-title">${esc(c.name)}</div><div class="ri-sub">${esc(c.start)}–${esc(c.end)}${c.room ? " · " + esc(c.room) : ""}</div></div>
              <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteClass('${c.id}')">✕</button>
            </div>`).join("") || `<div class="small muted" style="padding:8px 4px">No classes</div>`}
          </div>
        </div>`;
      }).join("") : `<div class="card col-12"><div class="empty"><div class="e-ico">🗓️</div><div class="e-title">No classes yet</div><div class="e-sub">Add your weekly classes so you always know your schedule at a glance.</div><button class="btn btn-primary" onclick="GF.app.openAddClass()">+ Add your first class</button></div></div>`}
    </div>`;
  };

  /* ═══════════════ SETTINGS ═══════════════ */

  V.settings = () => {
    const u = GF.state.user;
    return `
    <div class="section-head">
      <div><div class="section-title"><span class="dot"></span> Settings</div>
      <div class="section-sub">Tune your Academic OS</div></div>
    </div>

    <div class="grid grid-12">
      <div class="card col-6">
        <div class="card-title"><span class="ico">👤</span> Profile</div>
        <div class="field"><label>Your name</label><input id="set-name" value="${esc(u.name)}"></div>
        <div class="field-row">
          <div class="field"><label>Grade / Year</label><input id="set-grade" value="${esc(u.gradeLabel)}" placeholder="Grade 11"></div>
          <div class="field"><label>Region mode</label>
            <select id="set-mode">
              <option value="global" ${u.mode === "global" ? "selected" : ""}>🌍 Global</option>
              <option value="sa" ${u.mode === "sa" ? "selected" : ""}>🇿🇦 South Africa (CAPS + APS)</option>
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>Weekly focus goal (min)</label><input id="set-goal" type="number" min="30" step="30" value="${u.weeklyFocusGoalMin}"></div>
          <div class="field"><label>Matric / finals date</label><input id="set-matric" type="date" value="${u.matricDate}"></div>
        </div>
        <div class="field"><label>Appearance</label>
          <select id="set-theme">
            <option value="dark" ${u.theme !== "light" ? "selected" : ""}>🌙 Midnight (premium dark)</option>
            <option value="light" ${u.theme === "light" ? "selected" : ""}>☀️ Daylight (clean light)</option>
          </select>
        </div>
        <button class="btn btn-primary" onclick="GF.app.saveSettings()">Save Settings</button>
      </div>

      <div class="card col-6">
        <div class="card-title"><span class="ico">💾</span> Data Vault</div>
        <p class="small muted mb-12">Your data lives 100% on this device — private by design. Export a backup anytime and import it on any other device.</p>
        <div class="flex" style="gap:10px;flex-wrap:wrap">
          <button class="btn" onclick="GF.app.exportData()">⬇ Export Backup</button>
          <button class="btn" onclick="GF.app.importData()">⬆ Import Backup</button>
          <button class="btn" onclick="GF.app.loadDemo()">✨ Load Demo Data</button>
        </div>
        <div class="card-title mt-20"><span class="ico">⚠️</span> Danger Zone</div>
        <button class="btn btn-danger" onclick="GF.app.confirmReset()">Erase Everything & Start Fresh</button>

        <div class="card-title mt-20"><span class="ico">🚀</span> About</div>
        <p class="small muted">GradeForge AI X — Your Personal AI Academic Operating System.<br>Track. Learn. Improve. Dominate.<br><span class="mono">v1.0 · runs fully offline · zero accounts · zero tracking</span></p>
      </div>
    </div>`;
  };

  return V;
})();
