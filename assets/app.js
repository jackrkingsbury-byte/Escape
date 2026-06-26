/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — APP CONTROLLER
   Routing · gamification · timer · modals · onboarding
   ═══════════════════════════════════════════════════════════════ */

GF.timer = { modeName: "Pomodoro", total: 25 * 60, remaining: 25 * 60, running: false, handle: null };

GF.app = (() => {
  const A = {};
  const $ = (sel) => document.querySelector(sel);
  const esc = GF.esc;
  let currentView = "dashboard";

  /* ═══════ ROUTING ═══════ */

  A.go = (view) => {
    currentView = view;
    document.querySelectorAll(".nav-item, .mobile-nav button").forEach(b =>
      b.classList.toggle("active", b.dataset.view === view));
    A.render();
    window.scrollTo({ top: 0 });
  };

  A.render = () => {
    const fn = GF.views[currentView] || GF.views.dashboard;
    $("#view-root").innerHTML = fn();
    renderChrome();
    animateCounts();
  };

  const renderChrome = () => {
    const u = GF.state.user;
    const lvl = GF.engine.levelInfo();
    const h = new Date().getHours();
    const slot = h < 5 ? "Night owl mode" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    $("#greeting").innerHTML = `${slot}, <span class="hl">${esc(u.name || "Scholar")}</span>`;
    $("#date-line").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

    const st = GF.state.game.streak;
    const sc = $("#streak-chip");
    sc.innerHTML = `<span class="flame">🔥</span> ${st.count}`;
    sc.classList.toggle("hot", st.count >= 3);
    sc.title = `Study streak: ${st.count} day${st.count === 1 ? "" : "s"} (best ${st.best})`;

    $("#xp-chip").innerHTML = `<span class="lvl">LVL ${lvl.level}</span>
      <div class="xp-bar"><div class="xp-fill" style="width:${Math.round(lvl.progress * 100)}%"></div></div>
      <span class="mono" style="font-size:11px">${lvl.xp}</span>`;

    $("#sidebar-level").innerHTML = `
      <div class="lvl-row"><span class="lvl-num">Level ${lvl.level}</span><span class="lvl-name">${esc(lvl.name)}</span></div>
      <div class="progress-line"><div class="pl-fill" style="width:${Math.round(lvl.progress * 100)}%"></div></div>
      <div class="lvl-xp">${lvl.xp} XP${lvl.nextAt ? " · next at " + lvl.nextAt : " · MAX"}</div>`;
  };

  const animateCounts = () => {
    document.querySelectorAll(".count-up[data-count]").forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;
      const t0 = performance.now(), dur = 900;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  /* ═══════ TOASTS / CONFETTI ═══════ */

  A.toast = (icon, msg, xp = null) => {
    const stack = $("#toast-stack");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span class="t-icon">${icon}</span><span>${msg}</span>${xp ? `<span class="t-xp">+${xp} XP</span>` : ""}`;
    stack.appendChild(el);
    setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 320); }, 3400);
  };

  A.confetti = (n = 60) => {
    const layer = $("#confetti-layer");
    const colors = ["#2347FF", "#6480FF", "#8A7BFF", "#3DD9A4", "#FFD60A", "#FF5630"];
    for (let i = 0; i < n; i++) {
      const b = document.createElement("div");
      b.className = "confetti-bit";
      const size = 5 + Math.random() * 7;
      b.style.cssText = `left:${Math.random() * 100}vw;width:${size}px;height:${size * (0.5 + Math.random())}px;background:${colors[i % colors.length]};animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.4}s;`;
      layer.appendChild(b);
      setTimeout(() => b.remove(), 4200);
    }
  };

  /* ═══════ GAMIFICATION CORE ═══════ */

  const bumpStreak = () => {
    const st = GF.state.game.streak;
    const today = GF.todayISO();
    if (st.last === today) return;
    st.count = (st.last === GF.todayISO(-1)) ? st.count + 1 : 1;
    st.last = today;
    if (st.count > st.best) st.best = st.count;
    if (st.count === 3 || st.count === 7 || st.count === 30) {
      A.toast("🔥", `${st.count}-day streak! You're on fire.`);
    }
  };

  A.gainXP = (amount, icon, msg) => {
    const before = GF.engine.levelInfo().level;
    GF.state.game.xp += amount;
    bumpStreak();
    if (msg) A.toast(icon || "✨", msg, amount);
    const after = GF.engine.levelInfo();
    if (after.level > before) {
      A.confetti(110);
      setTimeout(() => A.toast("🚀", `LEVEL UP — Level ${after.level}: ${after.name}!`), 450);
    }
    checkAchievements();
    GF.save();
  };

  const checkAchievements = () => {
    const s = GF.state, got = s.game.achievements, eng = GF.engine;
    const allMarks = s.subjects.flatMap(x => x.marks);
    const doneAssign = s.assignments.filter(a => a.done);
    const focusMin = s.focusSessions.reduce((a, x) => a + x.minutes, 0);
    const aps = eng.apsBreakdown().total;
    const tests = {
      first_mark: allMarks.length >= 1,
      marks_25: allMarks.length >= 25,
      perfect: allMarks.some(m => m.score >= m.total),
      ace: allMarks.some(m => m.score / m.total >= 0.9),
      streak_3: s.game.streak.count >= 3 || s.game.streak.best >= 3,
      streak_7: s.game.streak.count >= 7 || s.game.streak.best >= 7,
      streak_30: s.game.streak.count >= 30 || s.game.streak.best >= 30,
      assign_1: doneAssign.length >= 1,
      assign_10: doneAssign.length >= 10,
      assign_25: doneAssign.length >= 25,
      focus_1h: focusMin >= 60,
      focus_10h: focusMin >= 600,
      focus_50h: focusMin >= 3000,
      comeback: s.subjects.some(x => x.marks.length >= 4 && eng.subjectDelta(x) >= 10),
      full_house: s.subjects.length >= 6,
      exam_ready: s.exams.some(e => GF.daysUntil(e.date) >= 0 && eng.examReadiness(e) >= 85),
      aps_30: aps >= 30,
      aps_36: aps >= 36,
      level_5: eng.levelInfo().level >= 5,
      night_owl: doneAssign.some(a => {
        if (!a.doneAt || !a.due) return false;
        const gap = (new Date(a.due) - new Date(a.doneAt)) / 86400000;
        return gap >= 0 && gap <= 1;
      }),
      recall_1: (s.game.reviews || 0) >= 1,
      recall_100: (s.game.reviews || 0) >= 100,
    };
    GF.ACHIEVEMENTS.forEach(a => {
      if (!got[a.id] && tests[a.id]) {
        got[a.id] = GF.todayISO();
        GF.state.game.xp += a.xp;
        A.confetti(70);
        A.toast(a.icon, `Achievement unlocked: ${a.name}!`, a.xp);
      }
    });
  };

  /* ═══════ MODALS ═══════ */

  A.openModal = (html, wide = false) => {
    const m = $("#modal");
    m.classList.toggle("wide", wide);
    m.innerHTML = html;
    $("#modal-backdrop").classList.add("open");
    const first = m.querySelector("input, select");
    if (first) setTimeout(() => first.focus(), 60);
  };
  A.closeModal = () => $("#modal-backdrop").classList.remove("open");

  /* ═══════ ONBOARDING ═══════ */

  let obMode = "global";
  A.obPick = (mode) => {
    obMode = mode;
    document.querySelectorAll(".ob-mode").forEach(el => el.classList.toggle("selected", el.dataset.mode === mode));
  };

  const openOnboarding = () => {
    const prev = document.getElementById("welcome-screen");
    if (prev) prev.remove();
    const el = document.createElement("div");
    el.className = "welcome-screen";
    el.id = "welcome-screen";
    el.innerHTML = `
      <div class="welcome-bg" aria-hidden="true"></div>
      <div class="welcome-inner">
        <div class="wc-top">
          <div class="wc-logo">
            <svg viewBox="0 0 100 100" width="30" height="30">
              <defs><linearGradient id="obGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2347FF"/><stop offset="1" stop-color="#8A7BFF"/></linearGradient></defs>
              <path d="M30 68 L50 28 L70 68 M38 54 H62" stroke="url(#obGrad)" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <div class="wc-brandline">GRADEFORGE&nbsp;AI&nbsp;X</div>
        </div>

        <h1 class="wc-head">Your Personal <span class="grad-text">AI&nbsp;Academic</span><br>Operating System</h1>
        <p class="wc-tag">Forge your future — one mark at a time.</p>

        <div class="wc-features">
          <div class="wc-feat"><span class="wf-ico">📈</span> AI Grade Predictor</div>
          <div class="wc-feat"><span class="wf-ico">🛡️</span> Exam Readiness</div>
          <div class="wc-feat"><span class="wf-ico">⚡</span> AI Study Coach</div>
          <div class="wc-feat"><span class="wf-ico">🔥</span> Streaks &amp; XP</div>
        </div>

        <div class="wc-card">
          <div class="field"><label>What should we call you?</label><input id="ob-name" placeholder="Your first name" maxlength="24" autocomplete="off"></div>
          <div class="wc-modelabel">Choose your mode</div>
          <div class="ob-choice">
            <button class="ob-mode selected" data-mode="global" onclick="GF.app.obPick('global')">
              <div class="om-flag">🌍</div><div class="om-name">Global</div><div class="om-sub">Universal grading & tools</div>
            </button>
            <button class="ob-mode" data-mode="sa" onclick="GF.app.obPick('sa')">
              <div class="om-flag">🇿🇦</div><div class="om-name">South Africa</div><div class="om-sub">CAPS · APS · Matric</div>
            </button>
          </div>
          <button class="btn btn-primary btn-block wc-cta" onclick="GF.app.obFinish(false)">Launch My Academic OS →</button>
          <button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="GF.app.obFinish(true)">✨ Explore with demo data first</button>
        </div>

        <p class="wc-foot">🔒 Private by design · works on any device · no account needed</p>
      </div>`;
    document.body.appendChild(el);
    obMode = "global";
    setTimeout(() => { const i = document.getElementById("ob-name"); if (i) i.focus(); }, 200);
  };

  const closeWelcome = () => {
    const w = document.getElementById("welcome-screen");
    if (w) { w.classList.add("welcome-out"); setTimeout(() => w.remove(), 420); }
  };

  A.obFinish = (demo) => {
    const name = ($("#ob-name").value || "").trim();
    if (demo) {
      GF.loadDemoData(name || "Alex");
      GF.state.user.mode = obMode === "global" ? "global" : "sa";
    } else {
      GF.state.user.name = name || "Scholar";
      GF.state.user.mode = obMode;
      GF.state.meta.onboarded = true;
      GF.state.game.xp = 10;
      GF.state.game.streak = { count: 1, last: GF.todayISO(), best: 1 };
    }
    GF.save();
    closeWelcome();
    A.closeModal();
    A.render();
    A.confetti(90);
    A.toast("🚀", demo ? "Demo loaded — explore everything, then start fresh in Settings." : "Academic OS online. Add your subjects to begin.", 10);
    if (!demo) setTimeout(() => A.openAddSubject(), 1000);
  };

  /* ═══════ SUBJECTS & MARKS ═══════ */

  A.openAddSubject = () => {
    const list = GF.state.user.mode === "sa" ? GF.CAPS_SUBJECTS : GF.GLOBAL_SUBJECTS;
    const existing = new Set(GF.state.subjects.map(s => s.name));
    A.openModal(`
      <h3>Add Subject</h3>
      <div class="modal-sub">Pick from the ${GF.state.user.mode === "sa" ? "CAPS curriculum" : "common list"} or type your own.</div>
      <div class="field"><label>Subject</label>
        <select id="ns-pick" onchange="document.getElementById('ns-name').value = this.value === '__custom' ? '' : this.value">
          ${list.filter(n => !existing.has(n)).map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join("")}
          <option value="__custom">✏️ Custom subject…</option>
        </select>
      </div>
      <div class="field"><label>Name (editable)</label><input id="ns-name" value="${esc(list.find(n => !existing.has(n)) || "")}"></div>
      <div class="field"><label>Target mark: <span id="ns-target-lab" class="mono">75%</span></label>
        <input id="ns-target" type="range" min="40" max="100" value="75" oninput="document.getElementById('ns-target-lab').textContent=this.value+'%'">
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveSubject()">Add Subject</button>
      </div>`);
  };

  A.saveSubject = () => {
    const name = $("#ns-name").value.trim();
    if (!name) return A.toast("⚠️", "Give the subject a name.");
    GF.state.subjects.push({
      id: GF.uid(), name,
      color: GF.SUBJECT_COLORS[GF.state.subjects.length % GF.SUBJECT_COLORS.length],
      target: parseInt($("#ns-target").value, 10), marks: [],
    });
    A.closeModal();
    A.gainXP(10, "📚", `${name} added to your OS.`);
    A.go("marks");
  };

  A.confirmDeleteSubject = (id) => {
    const s = GF.state.subjects.find(x => x.id === id);
    if (!s) return;
    A.openModal(`
      <h3>Delete ${esc(s.name)}?</h3>
      <div class="modal-sub">This removes the subject and its ${s.marks.length} mark${s.marks.length === 1 ? "" : "s"}. This cannot be undone.</div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Keep it</button>
        <button class="btn btn-danger" onclick="GF.app.deleteSubject('${id}')">Delete</button>
      </div>`);
  };

  A.deleteSubject = (id) => {
    GF.state.subjects = GF.state.subjects.filter(s => s.id !== id);
    GF.state.assignments = GF.state.assignments.filter(a => a.subjectId !== id);
    GF.state.exams = GF.state.exams.filter(e => e.subjectId !== id);
    GF.save(); A.closeModal(); A.render();
  };

  A.openAddMark = (subjectId) => {
    const opts = GF.state.subjects.map(s => `<option value="${s.id}" ${s.id === subjectId ? "selected" : ""}>${esc(s.name)}</option>`).join("");
    if (!opts) return A.openAddSubject();
    A.openModal(`
      <h3>Log a Mark</h3>
      <div class="modal-sub">Every mark you log makes the AI Grade Predictor™ sharper.</div>
      <div class="field"><label>Subject</label><select id="nm-subject">${opts}</select></div>
      <div class="field"><label>Title</label><input id="nm-title" placeholder="e.g. Trigonometry Test"></div>
      <div class="field-row">
        <div class="field"><label>Type</label>
          <select id="nm-type"><option>Test</option><option>Exam</option><option>Quiz</option><option>Assignment</option><option>Practical</option><option>Essay</option><option>Oral</option><option>Project</option></select>
        </div>
        <div class="field"><label>Date</label><input id="nm-date" type="date" value="${GF.todayISO()}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Score</label><input id="nm-score" type="number" min="0" step="0.5" placeholder="42"></div>
        <div class="field"><label>Out of</label><input id="nm-total" type="number" min="1" step="0.5" placeholder="50"></div>
      </div>
      <div class="field"><label>Weight</label>
        <select id="nm-weight"><option value="1">Normal (tests, quizzes)</option><option value="2">Heavy (exams, big projects)</option><option value="0.5">Light (homework, small tasks)</option></select>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveMark()">Log Mark</button>
      </div>`);
  };

  A.saveMark = () => {
    const subj = GF.state.subjects.find(s => s.id === $("#nm-subject").value);
    const score = parseFloat($("#nm-score").value);
    const total = parseFloat($("#nm-total").value);
    if (!subj || isNaN(score) || isNaN(total) || total <= 0 || score < 0 || score > total)
      return A.toast("⚠️", "Check the score and total.");
    subj.marks.push({
      id: GF.uid(),
      title: $("#nm-title").value.trim() || $("#nm-type").value,
      type: $("#nm-type").value,
      score, total,
      weight: parseFloat($("#nm-weight").value),
      date: $("#nm-date").value || GF.todayISO(),
    });
    A.closeModal();
    const p = Math.round(score / total * 100);
    A.gainXP(p >= 80 ? 25 : 15, p >= 80 ? "🌟" : "📊", `${subj.name}: ${p}% logged.`);
    A.render();
  };

  A.openSubjectDetail = (id) => {
    const s = GF.state.subjects.find(x => x.id === id);
    if (!s) return;
    const ms = [...s.marks].sort((a, b) => b.date.localeCompare(a.date));
    A.openModal(`
      <h3><span style="color:${s.color}">●</span> ${esc(s.name)} — Mark History</h3>
      <div class="modal-sub">Average ${GF.engine.subjectAvg(s) != null ? Math.round(GF.engine.subjectAvg(s)) + "%" : "—"} · AI predicts ${GF.engine.predictNext(s) != null ? Math.round(GF.engine.predictNext(s)) + "%" : "—"} next</div>
      <div class="row-list" style="max-height:340px;overflow-y:auto">
        ${ms.map(m => `<div class="row-item">
          <div class="ri-main"><div class="ri-title">${esc(m.title)}</div><div class="ri-sub">${esc(m.type)} · ${GF.fmtDate(m.date)} · weight ${m.weight}</div></div>
          <span class="pill ${m.score / m.total >= .7 ? "good" : m.score / m.total >= .5 ? "warn" : "bad"}">${m.score}/${m.total} · ${Math.round(m.score / m.total * 100)}%</span>
          <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteMark('${s.id}','${m.id}')">✕</button>
        </div>`).join("") || `<div class="empty"><div class="e-ico">📭</div><div class="e-title">No marks yet</div></div>`}
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Close</button>
        <button class="btn btn-primary" onclick="GF.app.openAddMark('${s.id}')">+ Log Mark</button>
      </div>`, true);
  };

  A.deleteMark = (sid, mid) => {
    const s = GF.state.subjects.find(x => x.id === sid);
    if (!s) return;
    s.marks = s.marks.filter(m => m.id !== mid);
    GF.save(); A.openSubjectDetail(sid); A.render();
  };

  /* ═══════ ASSIGNMENTS ═══════ */

  A.openAddAssignment = () => {
    const opts = GF.state.subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    if (!opts) return A.openAddSubject();
    A.openModal(`
      <h3>New Assignment</h3>
      <div class="modal-sub">The AI sorts your queue by urgency automatically.</div>
      <div class="field"><label>Title</label><input id="na-title" placeholder="e.g. History essay draft"></div>
      <div class="field-row">
        <div class="field"><label>Subject</label><select id="na-subject">${opts}</select></div>
        <div class="field"><label>Due date</label><input id="na-due" type="date" value="${GF.todayISO(3)}"></div>
      </div>
      <div class="field"><label>Notes (optional)</label><input id="na-notes" placeholder="Anything to remember"></div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveAssignment()">Add to Queue</button>
      </div>`);
  };

  A.saveAssignment = () => {
    const title = $("#na-title").value.trim();
    if (!title) return A.toast("⚠️", "Give it a title.");
    GF.state.assignments.push({
      id: GF.uid(), title,
      subjectId: $("#na-subject").value,
      due: $("#na-due").value || GF.todayISO(3),
      notes: $("#na-notes").value.trim(),
      done: false,
    });
    A.closeModal();
    A.gainXP(5, "📝", "Mission added to the queue.");
    A.render();
  };

  A.toggleAssignment = (id) => {
    const a = GF.state.assignments.find(x => x.id === id);
    if (!a) return;
    a.done = !a.done;
    if (a.done) {
      a.doneAt = GF.todayISO();
      const onTime = a.doneAt <= a.due;
      A.confetti(45);
      A.gainXP(onTime ? 35 : 25, "✅", onTime ? "Completed on time. Clean execution." : "Completed. Better late than never.");
    } else {
      delete a.doneAt;
      GF.save();
    }
    A.render();
  };

  A.deleteAssignment = (id) => {
    GF.state.assignments = GF.state.assignments.filter(a => a.id !== id);
    GF.save(); A.render();
  };

  /* ═══════ TODAY PLAN ═══════ */

  A.togglePlanItem = (key) => {
    const today = GF.todayISO();
    if (!GF.state.plan || GF.state.plan.date !== today) GF.state.plan = { date: today, done: [] };
    const arr = GF.state.plan.done;
    const i = arr.indexOf(key);
    if (i === -1) {
      arr.push(key);
      A.confetti(30);
      A.gainXP(8, "✅", "Task done — strong momentum.");
    } else {
      arr.splice(i, 1);
      GF.save();
    }
    A.render();
  };

  /* ═══════ STUDY LAB ═══════ */

  A.openTechnique = (id) => {
    const t = (GF.TECHNIQUES || []).find(x => x.id === id);
    if (!t) return;
    A.openModal(`
      <div class="tech-modal-head">
        <div class="tech-modal-ico">${t.icon}</div>
        <div><h3 style="margin-bottom:6px">${esc(t.name)}</h3><span class="pill info">${esc(t.tag)}</span></div>
      </div>
      <p class="small" style="color:var(--text-2);margin:16px 0 2px;line-height:1.6">${esc(t.what)}</p>
      <div class="card-title mt-20"><span class="ico">🛠️</span> How to do it</div>
      <ol class="tech-steps">${t.how.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      <div class="insight good mt-16"><div class="ins-icon">🔬</div><div><div class="ins-title">Why it works</div><div class="ins-text">${esc(t.why)}</div></div></div>
      <div class="modal-actions">
        ${t.link ? `<button class="btn btn-primary" onclick="GF.app.closeModal();GF.app.go('${t.link.view}')">${esc(t.link.label)} →</button>` : ""}
        <button class="btn" onclick="GF.app.closeModal()">Close</button>
      </div>`, true);
  };

  /* ═══════ HABIT FORGE ═══════ */

  A.toggleHabit = (id, iso) => {
    const h = GF.state.habits.find(x => x.id === id);
    if (!h) return;
    if (!h.log) h.log = {};
    if (h.log[iso]) { delete h.log[iso]; GF.save(); }
    else {
      h.log[iso] = true;
      if (iso === GF.todayISO()) A.gainXP(4, "✅", "Habit done — chain unbroken.");
      else GF.save();
    }
    A.render();
  };

  A.openAddHabit = () => {
    A.openModal(`
      <h3>New Habit</h3>
      <div class="modal-sub">Keep it small and daily — that's what makes it stick.</div>
      <div class="field"><label>Habit</label><input id="nh-name" placeholder="e.g. Review flashcards" maxlength="40"></div>
      <div class="field"><label>Icon (emoji)</label><input id="nh-icon" placeholder="📚" maxlength="2" value="✅"></div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveHabit()">Add Habit</button>
      </div>`);
  };

  A.saveHabit = () => {
    const name = $("#nh-name").value.trim();
    if (!name) return A.toast("⚠️", "Give your habit a name.");
    const icon = ($("#nh-icon").value.trim() || "✅").slice(0, 2);
    GF.state.habits.push({ id: GF.uid(), name, icon, created: GF.todayISO(), log: {} });
    A.closeModal();
    A.gainXP(5, "🔁", "Habit added — show up tomorrow.");
    A.render();
  };

  A.deleteHabit = (id) => {
    GF.state.habits = GF.state.habits.filter(h => h.id !== id);
    GF.save(); A.render();
  };

  /* ═══════ NOTES ═══════ */

  A.openAddNote = () => A.openNote(null);

  A.openNote = (id) => {
    const n = id ? GF.state.notes.find(x => x.id === id) : null;
    const opts = `<option value="">General (no subject)</option>` +
      GF.state.subjects.map(s => `<option value="${s.id}" ${n && n.subjectId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("");
    A.openModal(`
      <h3>${n ? "Edit Note" : "New Note"}</h3>
      <div class="field"><label>Title</label><input id="note-title" value="${n ? esc(n.title) : ""}" placeholder="Note title"></div>
      <div class="field"><label>Note</label><textarea id="note-body" style="min-height:160px" placeholder="Write anything — summaries, checklists, formulas…">${n ? esc(n.body) : ""}</textarea></div>
      <div class="field"><label>Subject</label><select id="note-subject">${opts}</select></div>
      <label class="flex" style="gap:8px;cursor:pointer;font-size:13px;margin-bottom:4px"><input type="checkbox" id="note-pin" ${n && n.pinned ? "checked" : ""}> 📌 Pin to top</label>
      <div class="modal-actions">
        ${n ? `<button class="btn btn-danger" style="margin-right:auto" onclick="GF.app.deleteNote('${n.id}')">Delete</button>` : ""}
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveNote(${n ? `'${n.id}'` : "null"})">Save Note</button>
      </div>`, true);
  };

  A.saveNote = (id) => {
    const title = $("#note-title").value.trim();
    const body = $("#note-body").value.trim();
    if (!title && !body) return A.toast("⚠️", "Write something first.");
    const subjectId = $("#note-subject").value;
    const pinned = $("#note-pin").checked;
    if (id) {
      const n = GF.state.notes.find(x => x.id === id);
      if (n) Object.assign(n, { title: title || "Untitled", body, subjectId, pinned, updated: GF.todayISO() });
    } else {
      GF.state.notes.push({ id: GF.uid(), title: title || "Untitled", body, subjectId, pinned, updated: GF.todayISO() });
      A.gainXP(3, "📝", "Note saved.");
    }
    GF.save(); A.closeModal(); A.render();
  };

  A.deleteNote = (id) => {
    GF.state.notes = GF.state.notes.filter(n => n.id !== id);
    GF.save(); A.closeModal(); A.render();
  };

  /* ═══════ TIMETABLE ═══════ */

  A.openAddClass = () => {
    const opts = GF.state.subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    if (!opts) return A.openAddSubject();
    const dayOpts = [["Monday", 1], ["Tuesday", 2], ["Wednesday", 3], ["Thursday", 4], ["Friday", 5], ["Saturday", 6], ["Sunday", 0]]
      .map(([n, v]) => `<option value="${v}">${n}</option>`).join("");
    A.openModal(`
      <h3>Add Class</h3>
      <div class="field"><label>Day</label><select id="cl-day">${dayOpts}</select></div>
      <div class="field"><label>Subject</label><select id="cl-subject">${opts}</select></div>
      <div class="field-row">
        <div class="field"><label>Start</label><input id="cl-start" type="time" value="08:00"></div>
        <div class="field"><label>End</label><input id="cl-end" type="time" value="08:45"></div>
      </div>
      <div class="field"><label>Room (optional)</label><input id="cl-room" placeholder="e.g. B12"></div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveClass()">Add Class</button>
      </div>`);
  };

  A.saveClass = () => {
    const subjectId = $("#cl-subject").value;
    const subj = GF.state.subjects.find(s => s.id === subjectId);
    GF.state.timetable.push({
      id: GF.uid(), day: parseInt($("#cl-day").value, 10),
      start: $("#cl-start").value || "08:00", end: $("#cl-end").value || "08:45",
      subjectId, name: subj ? subj.name : "Class", room: $("#cl-room").value.trim(),
    });
    GF.save(); A.closeModal();
    A.gainXP(3, "🗓️", "Class added to your timetable.");
    A.render();
  };

  A.deleteClass = (id) => {
    GF.state.timetable = GF.state.timetable.filter(c => c.id !== id);
    GF.save(); A.render();
  };

  /* ═══════ EXAMS ═══════ */

  A.openAddExam = () => {
    const opts = GF.state.subjects.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    if (!opts) return A.openAddSubject();
    A.openModal(`
      <h3>Add Exam to Radar</h3>
      <div class="modal-sub">The AI starts computing readiness the moment it's tracked.</div>
      <div class="field"><label>Exam name</label><input id="ne-title" placeholder="e.g. Trial Exam Paper 1"></div>
      <div class="field-row">
        <div class="field"><label>Subject</label><select id="ne-subject">${opts}</select></div>
        <div class="field"><label>Date</label><input id="ne-date" type="date" value="${GF.todayISO(14)}"></div>
      </div>
      <div class="field"><label>Current confidence: <span id="ne-conf-lab" class="mono">50%</span></label>
        <input id="ne-conf" type="range" min="0" max="100" value="50" oninput="document.getElementById('ne-conf-lab').textContent=this.value+'%'">
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveExam()">Track Exam</button>
      </div>`);
  };

  A.saveExam = () => {
    const title = $("#ne-title").value.trim() || "Exam";
    GF.state.exams.push({
      id: GF.uid(), title,
      subjectId: $("#ne-subject").value,
      date: $("#ne-date").value || GF.todayISO(14),
      confidence: parseInt($("#ne-conf").value, 10),
    });
    A.closeModal();
    A.gainXP(10, "🛡️", "Exam locked onto radar.");
    A.render();
  };

  let confDebounce = null;
  A.setExamConfidence = (id, val) => {
    const e = GF.state.exams.find(x => x.id === id);
    if (!e) return;
    e.confidence = parseInt(val, 10);
    clearTimeout(confDebounce);
    confDebounce = setTimeout(() => { GF.save(); A.render(); }, 600);
  };

  A.deleteExam = (id) => {
    GF.state.exams = GF.state.exams.filter(e => e.id !== id);
    GF.save(); A.render();
  };

  A.coachForExam = (id) => {
    const e = GF.state.exams.find(x => x.id === id);
    if (!e) return;
    GF.coachState = { action: "examprep", subjectId: e.subjectId, topic: e.title };
    A.go("coach");
    A.coachGenerate();
  };

  /* ═══════ AI COACH ═══════ */

  A.coachSelect = (id) => {
    GF.coachState = GF.coachState || { action: "explain", subjectId: GF.state.subjects[0]?.id || "", topic: "" };
    GF.coachState.action = id;
    A.render();
  };

  A.coachParam = (key, val) => {
    GF.coachState = GF.coachState || { action: "explain", subjectId: "", topic: "" };
    GF.coachState[key] = val;
  };

  A.coachGenerate = () => {
    const cs = GF.coachState || { action: "explain", subjectId: GF.state.subjects[0]?.id || "", topic: "" };
    const subj = GF.state.subjects.find(s => s.id === cs.subjectId) || GF.state.subjects[0];
    const tmpl = GF.COACH_PROMPTS[cs.action] || GF.COACH_PROMPTS.explain;
    const avg = subj ? GF.engine.subjectAvg(subj) : null;
    const nextExam = GF.engine.upcomingExams().find(e => subj && e.subjectId === subj.id);
    const days = nextExam ? GF.daysUntil(nextExam.date) : 14;
    GF.coachOutput = tmpl
      .replaceAll("{SUBJECT}", subj ? subj.name : "my subject")
      .replaceAll("{TOPIC}", cs.topic.trim() || "the current topic I'm studying")
      .replaceAll("{LEVEL}", GF.state.user.gradeLabel || "high school")
      .replaceAll("{GRADE_LABEL}", GF.state.user.gradeLabel || "Grade 11")
      .replaceAll("{DAYS}", String(Math.max(days, 1)))
      .replaceAll("{AVG}", avg != null ? String(Math.round(avg)) : "unknown")
      .replaceAll("{TARGET}", subj ? String(subj.target) : "80");
    A.render();
    const out = $("#coach-output");
    if (out) out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    A.gainXP(5, "🧠", "Coach prompt engineered.");
  };

  A.coachOpen = (provider) => {
    if (!GF.coachOutput) A.coachGenerate();
    const text = GF.coachOutput || "";
    if (!text) return A.toast("⚠️", "Pick a mode and topic first.");
    const urls = {
      chatgpt: "https://chatgpt.com/?q=" + encodeURIComponent(text),
      gemini: "https://gemini.google.com/app",
    };
    // Open synchronously (inside the tap) so the browser doesn't block the new tab.
    window.open(urls[provider] || urls.chatgpt, "_blank", "noopener");
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text); } catch (e) {}
    A.toast("📋", "Prompt copied — paste it in if it isn't already filled.");
  };

  A.coachCopy = () => {
    if (!GF.coachOutput) return A.toast("⚠️", "Generate a prompt first.");
    const done = () => A.toast("📋", "Copied — paste it into your AI and learn.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(GF.coachOutput).then(done).catch(() => fallbackCopy(done));
    } else fallbackCopy(done);
  };

  const fallbackCopy = (done) => {
    const ta = document.createElement("textarea");
    ta.value = GF.coachOutput;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { A.toast("⚠️", "Select and copy the prompt manually."); }
    ta.remove();
  };

  /* ═══════ FLASHCARDS (MEMORY LAB) ═══════ */

  A.openAddCard = (subjectId) => {
    const opts = GF.state.subjects.map(s => `<option value="${s.id}" ${s.id === subjectId ? "selected" : ""}>${esc(s.name)}</option>`).join("");
    if (!opts) return A.openAddSubject();
    A.openModal(`
      <h3>New Flashcard</h3>
      <div class="modal-sub">Front = the question or cue. Back = the shortest complete answer.</div>
      <div class="field"><label>Subject (deck)</label><select id="nc-subject">${opts}</select></div>
      <div class="field"><label>Front — question</label><textarea id="nc-front" placeholder="e.g. What is the derivative of sin(x)?"></textarea></div>
      <div class="field"><label>Back — answer</label><textarea id="nc-back" placeholder="e.g. cos(x)"></textarea></div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveCard()">Add Card</button>
      </div>`);
  };

  A.saveCard = () => {
    const subjectId = $("#nc-subject").value;
    const front = $("#nc-front").value.trim();
    const back = $("#nc-back").value.trim();
    if (!front || !back) return A.toast("⚠️", "Fill in both the question and the answer.");
    GF.state.flashcards.push({
      id: GF.uid(), subjectId, front, back,
      ease: 2.4, interval: 0, reps: 0, lapses: 0, due: GF.todayISO(), created: GF.todayISO(),
    });
    A.closeModal();
    A.gainXP(5, "🃏", "Flashcard added to your deck.");
    A.render();
  };

  A.openDeck = (subjectId) => {
    const s = GF.state.subjects.find(x => x.id === subjectId);
    if (!s) return;
    const cards = GF.state.flashcards.filter(c => c.subjectId === subjectId);
    A.openModal(`
      <h3><span style="color:${s.color}">●</span> ${esc(s.name)} — ${cards.length} card${cards.length === 1 ? "" : "s"}</h3>
      <div class="modal-sub">Spaced-repetition deck. Tap ✕ to remove a card.</div>
      <div class="row-list" style="max-height:340px;overflow-y:auto">
        ${cards.map(c => `<div class="row-item"><div class="ri-main"><div class="ri-title">${esc(c.front)}</div><div class="ri-sub">${esc(c.back)}</div></div>
          <span class="pill ${(c.interval || 0) >= 21 ? "good" : (c.reps || 0) > 0 ? "warn" : "info"}">${(c.reps || 0) === 0 ? "new" : (c.interval || 0) >= 21 ? "mastered" : "learning"}</span>
          <button class="btn btn-ghost btn-sm" onclick="GF.app.deleteCard('${c.id}','${subjectId}')">✕</button></div>`).join("") || `<div class="empty"><div class="e-ico">🃏</div><div class="e-title">No cards in this deck yet</div></div>`}
      </div>
      <div class="modal-actions"><button class="btn" onclick="GF.app.closeModal()">Close</button><button class="btn btn-primary" onclick="GF.app.openAddCard('${subjectId}')">+ Add Card</button></div>`, true);
  };

  A.deleteCard = (id, subjectId) => {
    GF.state.flashcards = GF.state.flashcards.filter(c => c.id !== id);
    GF.save();
    A.render();
    if (subjectId) A.openDeck(subjectId);
  };

  A.startReview = (subjectId) => {
    const due = GF.engine.cardsDue(subjectId);
    if (!due.length) return A.toast("✅", "No cards due — you're all caught up!");
    GF.review = { queue: due.map(c => c.id), index: 0, showBack: false, reviewed: 0, subjectId: subjectId || null };
    A.go("flashcards");
  };

  A.revealCard = () => { if (GF.review) { GF.review.showBack = true; A.render(); } };

  A.gradeCard = (grade) => {
    const r = GF.review;
    if (!r) return;
    const card = GF.state.flashcards.find(c => c.id === r.queue[r.index]);
    if (card) GF.engine.srSchedule(card, grade);
    GF.state.game.reviews = (GF.state.game.reviews || 0) + 1;
    r.reviewed += 1;
    r.index += 1;
    r.showBack = false;
    GF.save();
    if (r.index >= r.queue.length) {
      A.confetti(70);
      A.gainXP(r.reviewed * 2, "🧠", `Memory Lab: ${r.reviewed} card${r.reviewed === 1 ? "" : "s"} reviewed.`);
    }
    A.render();
  };

  A.endReview = () => { GF.review = null; A.render(); };

  /* ═══════ FOCUS TIMER ═══════ */

  A.fmtTime = (sec) => {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  A.timerMode = (name, minutes) => {
    const t = GF.timer;
    if (t.handle) { clearInterval(t.handle); t.handle = null; }
    t.modeName = name; t.total = minutes * 60; t.remaining = minutes * 60; t.running = false;
    A.render();
  };

  const tickUI = () => {
    const t = GF.timer;
    const timeEl = $("#timer-time");
    if (timeEl) timeEl.textContent = A.fmtTime(t.remaining);
    const ringEl = $("#timer-ring");
    if (ringEl) ringEl.innerHTML = GF.charts.ring(t.total ? (t.remaining / t.total) * 100 : 100, { size: 210, stroke: 13 });
    document.title = t.running ? `${A.fmtTime(t.remaining)} · GradeForge AI X` : "GradeForge AI X — Your Personal AI Academic Operating System";
  };

  A.timerStart = () => {
    const t = GF.timer;
    if (t.running) return;
    t.running = true;
    t.handle = setInterval(() => {
      t.remaining--;
      if (t.remaining <= 0) { t.remaining = 0; finishSession(false); return; }
      tickUI();
    }, 1000);
    A.render();
  };

  A.timerPause = () => {
    const t = GF.timer;
    t.running = false;
    if (t.handle) { clearInterval(t.handle); t.handle = null; }
    A.render();
  };

  A.timerReset = () => {
    const t = GF.timer;
    if (t.handle) { clearInterval(t.handle); t.handle = null; }
    t.running = false; t.remaining = t.total;
    document.title = "GradeForge AI X — Your Personal AI Academic Operating System";
    A.render();
  };

  A.timerFinishEarly = () => finishSession(true);

  const finishSession = (early) => {
    const t = GF.timer;
    if (t.handle) { clearInterval(t.handle); t.handle = null; }
    t.running = false;
    const minutes = Math.max(1, Math.round((t.total - t.remaining) / 60) || Math.round(t.total / 60));
    const isBreak = t.modeName === "Break";
    t.remaining = t.total;
    document.title = "GradeForge AI X — Your Personal AI Academic Operating System";
    if (!isBreak) {
      GF.state.focusSessions.push({ id: GF.uid(), date: GF.todayISO(), minutes, mode: t.modeName });
      A.confetti(60);
      A.gainXP(minutes, "🧠", `${minutes} focused minutes banked.${early ? "" : " Session complete!"}`);
    } else {
      A.toast("☕", "Break over — back to the forge.");
    }
    A.render();
  };

  /* ═══════ UNIVERSITY HUB ═══════ */

  const UNI_FIELDS = {
    applications: { title: "University Application", fields: [["institution", "Institution", "University of..."], ["course", "Course", "BSc..."], ["deadline", "Deadline", ""]], statuses: ["Planned", "In Progress", "Submitted", "Accepted", "Rejected"] },
    scholarships: { title: "Scholarship", fields: [["name", "Scholarship name", "e.g. Merit Bursary"], ["amount", "Value", "e.g. R50,000/yr or Full"], ["deadline", "Deadline", ""]], statuses: ["Researching", "Applying", "Submitted", "Accepted", "Rejected"] },
    portfolio: { title: "Portfolio Achievement", fields: [["title", "Achievement", "e.g. Science fair winner"], ["category", "Category", "Academic / Leadership / Sport / Project"], ["date", "Date", ""]], statuses: null },
  };

  A.openAddUni = (kind) => {
    const cfg = UNI_FIELDS[kind];
    A.openModal(`
      <h3>Add ${cfg.title}</h3>
      ${cfg.fields.map(([k, label, ph]) => `
        <div class="field"><label>${label}</label>
          <input id="nu-${k}" ${k === "deadline" || k === "date" ? `type="date" value="${GF.todayISO(30)}"` : `placeholder="${ph}"`}>
        </div>`).join("")}
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.app.saveUni('${kind}')">Add</button>
      </div>`);
  };

  A.saveUni = (kind) => {
    const cfg = UNI_FIELDS[kind];
    const item = { id: GF.uid() };
    for (const [k] of cfg.fields) {
      item[k] = $(`#nu-${k}`).value.trim();
      if (!item[k] && k !== "deadline" && k !== "date") return A.toast("⚠️", "Fill in all fields.");
    }
    if (cfg.statuses) item.status = cfg.statuses[0];
    GF.state.uni[kind].push(item);
    A.closeModal();
    A.gainXP(10, "🎓", `${cfg.title} tracked.`);
    A.render();
  };

  A.cycleUniStatus = (kind, id) => {
    const cfg = UNI_FIELDS[kind];
    const item = GF.state.uni[kind].find(x => x.id === id);
    if (!item || !cfg.statuses) return;
    const i = cfg.statuses.indexOf(item.status);
    item.status = cfg.statuses[(i + 1) % cfg.statuses.length];
    GF.save(); A.render();
  };

  A.deleteUni = (kind, id) => {
    GF.state.uni[kind] = GF.state.uni[kind].filter(x => x.id !== id);
    GF.save(); A.render();
  };

  /* ═══════ QUICK ADD ═══════ */

  A.openQuickAdd = () => {
    A.openModal(`
      <h3>Quick Add</h3>
      <div class="modal-sub">What just happened?</div>
      <div class="coach-actions" style="grid-template-columns:1fr 1fr">
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.openAddMark()"><span class="cb-ico">📊</span><span class="cb-name">Log a Mark</span><span class="cb-desc">Got a result back</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.openAddAssignment()"><span class="cb-ico">📝</span><span class="cb-name">Assignment</span><span class="cb-desc">New work assigned</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.openAddExam()"><span class="cb-ico">🛡️</span><span class="cb-name">Exam</span><span class="cb-desc">Date announced</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('focus');GF.app.timerStart()"><span class="cb-ico">⚡</span><span class="cb-name">Focus Now</span><span class="cb-desc">Start a session</span></button>
      </div>`);
  };

  A.openMoreMenu = () => {
    A.openModal(`
      <h3>More</h3>
      <div class="coach-actions" style="grid-template-columns:1fr 1fr">
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('today')"><span class="cb-ico">🗓️</span><span class="cb-name">Today's Plan</span><span class="cb-desc">Your AI daily plan</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('flashcards')"><span class="cb-ico">🃏</span><span class="cb-name">Memory Lab</span><span class="cb-desc">Spaced-repetition flashcards</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('habits')"><span class="cb-ico">🔁</span><span class="cb-name">Habit Forge</span><span class="cb-desc">Daily habits & streaks</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('studylab')"><span class="cb-ico">🔬</span><span class="cb-name">Study Lab</span><span class="cb-desc">Proven technique library</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('notes')"><span class="cb-ico">📝</span><span class="cb-name">Notes</span><span class="cb-desc">Your notebook</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('timetable')"><span class="cb-ico">🗓️</span><span class="cb-name">Timetable</span><span class="cb-desc">Weekly schedule</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('assignments')"><span class="cb-ico">📝</span><span class="cb-name">Assignments</span><span class="cb-desc">Mission queue</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('achievements')"><span class="cb-ico">🏆</span><span class="cb-name">Achievements</span><span class="cb-desc">XP, levels & badges</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('university')"><span class="cb-ico">🎓</span><span class="cb-name">University Hub</span><span class="cb-desc">APS · applications</span></button>
        <button class="coach-btn" onclick="GF.app.closeModal();GF.app.go('settings')"><span class="cb-ico">⚙️</span><span class="cb-name">Settings</span><span class="cb-desc">Profile & data vault</span></button>
      </div>`);
  };

  /* ═══════ SETTINGS / DATA ═══════ */

  A.saveSettings = () => {
    const u = GF.state.user;
    u.name = $("#set-name").value.trim() || u.name;
    u.gradeLabel = $("#set-grade").value.trim() || u.gradeLabel;
    u.mode = $("#set-mode").value;
    u.weeklyFocusGoalMin = Math.max(30, parseInt($("#set-goal").value, 10) || 300);
    u.matricDate = $("#set-matric").value || u.matricDate;
    u.theme = $("#set-theme").value === "light" ? "light" : "dark";
    GF.save();
    A.applyTheme();
    A.toast("✅", "Settings saved.");
    A.render();
  };

  A.exportData = () => {
    const blob = new Blob([JSON.stringify(GF.state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gradeforge-backup-${GF.todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    A.toast("💾", "Backup exported.");
  };

  A.importData = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          if (!data.meta || !Array.isArray(data.subjects)) throw new Error("bad format");
          GF.state = Object.assign(GF.defaultState(), data);
          GF.save(); A.render();
          A.toast("✅", "Backup restored. Welcome back.");
        } catch (e) { A.toast("⚠️", "That file isn't a valid GradeForge backup."); }
      };
      r.readAsText(f);
    };
    input.click();
  };

  A.loadDemo = () => {
    A.openModal(`
      <h3>Load demo data?</h3>
      <div class="modal-sub">This replaces your current data with a fully populated example. Export a backup first if you have real data.</div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="GF.loadDemoData(GF.state.user.name);GF.app.closeModal();GF.app.go('dashboard');GF.app.toast('✨','Demo universe loaded.')">Load Demo</button>
      </div>`);
  };

  A.confirmReset = () => {
    A.openModal(`
      <h3>Erase everything?</h3>
      <div class="modal-sub">All subjects, marks, XP and achievements will be permanently deleted from this device.</div>
      <div class="modal-actions">
        <button class="btn" onclick="GF.app.closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="GF.app.doReset()">Erase & Restart</button>
      </div>`);
  };

  A.doReset = () => {
    localStorage.removeItem(GF.STORAGE_KEY);
    GF.state = GF.defaultState();
    A.closeModal();
    A.go("dashboard");
    openOnboarding();
  };

  /* ═══════ THEME ═══════ */

  A.applyTheme = () => {
    const t = GF.state.user.theme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
    const btn = $("#theme-toggle");
    if (btn) {
      btn.textContent = t === "light" ? "☀️" : "🌙";
      btn.title = t === "light" ? "Switch to midnight theme" : "Switch to daylight theme";
    }
  };

  A.toggleTheme = () => {
    GF.state.user.theme = GF.state.user.theme === "light" ? "dark" : "light";
    GF.save();
    A.applyTheme();
    A.toast(GF.state.user.theme === "light" ? "☀️" : "🌙",
      GF.state.user.theme === "light" ? "Daylight theme on." : "Midnight theme on.");
  };

  /* ═══════ INIT ═══════ */

  A.init = () => {
    GF.load();
    A.applyTheme();

    document.querySelectorAll(".nav-item[data-view], .mobile-nav button[data-view]").forEach(b =>
      b.addEventListener("click", () => A.go(b.dataset.view)));

    $("#quick-add").addEventListener("click", A.openQuickAdd);

    $("#modal-backdrop").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) A.closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") A.closeModal();
    });

    A.render();

    if (!GF.state.meta.onboarded) {
      setTimeout(openOnboarding, 350);
    } else {
      // daily login pulse
      const st = GF.state.game.streak;
      if (st.last !== GF.todayISO()) {
        setTimeout(() => A.toast("👋", `Welcome back, ${GF.state.user.name || "Scholar"}. Do one thing today to keep the streak alive.`), 800);
      }
      checkAchievements();
      GF.save();
    }
  };

  return A;
})();

document.addEventListener("DOMContentLoaded", GF.app.init);
