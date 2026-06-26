/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — DATA LAYER
   State, persistence, constants, demo data
   ═══════════════════════════════════════════════════════════════ */

const GF = window.GF = {};

GF.STORAGE_KEY = "gradeforge_ai_x_v1";

/* ---------- helpers ---------- */

GF.uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

GF.localISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

GF.todayISO = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return GF.localISO(d);
};

GF.daysUntil = (iso) => {
  const a = new Date(GF.todayISO());
  const b = new Date(iso);
  return Math.round((b - a) / 86400000);
};

GF.fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

GF.esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));

GF.clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ---------- constants ---------- */

GF.SUBJECT_COLORS = ["#00F0FF", "#A855F7", "#3B82F6", "#34D399", "#FBBF24", "#EC4899", "#F97316", "#8B5CF6", "#14B8A6", "#F87171"];

GF.CAPS_SUBJECTS = [
  "Mathematics", "Mathematical Literacy", "Physical Sciences", "Life Sciences",
  "Accounting", "Business Studies", "Economics", "Geography", "History",
  "English Home Language", "English First Additional Language", "Afrikaans FAL",
  "isiZulu FAL", "Consumer Studies", "Information Technology", "Computer Applications Technology",
  "Engineering Graphics and Design", "Tourism", "Life Orientation", "Visual Arts", "Dramatic Arts"
];

GF.GLOBAL_SUBJECTS = [
  "Mathematics", "English", "Biology", "Chemistry", "Physics", "History",
  "Geography", "Computer Science", "Economics", "Business Studies", "Art", "Psychology",
  "Spanish", "French", "Literature", "Statistics", "Accounting", "Music"
];

GF.LEVELS = [
  { xp: 0,     name: "Novice Scholar" },
  { xp: 150,   name: "Rising Mind" },
  { xp: 400,   name: "Focused Achiever" },
  { xp: 800,   name: "Momentum Builder" },
  { xp: 1400,  name: "Honor Contender" },
  { xp: 2200,  name: "Knowledge Forger" },
  { xp: 3200,  name: "Academic Weapon" },
  { xp: 4500,  name: "Dean's List Threat" },
  { xp: 6200,  name: "Valedictorian Mode" },
  { xp: 8500,  name: "GradeForge Legend" },
];

GF.ACHIEVEMENTS = [
  { id: "first_mark",   icon: "🎯", name: "First Blood",        desc: "Log your first mark.", xp: 25 },
  { id: "perfect",      icon: "💯", name: "Flawless Victory",   desc: "Score 100% on any assessment.", xp: 100 },
  { id: "ace",          icon: "🌟", name: "Ace Tier",           desc: "Score 90%+ on any assessment.", xp: 50 },
  { id: "streak_3",     icon: "🔥", name: "Ignition",           desc: "Reach a 3-day study streak.", xp: 30 },
  { id: "streak_7",     icon: "⚡", name: "Unstoppable Week",   desc: "Reach a 7-day study streak.", xp: 75 },
  { id: "streak_30",    icon: "🌋", name: "Eruption",           desc: "Reach a 30-day study streak.", xp: 300 },
  { id: "assign_1",     icon: "✅", name: "Shipped It",         desc: "Complete your first assignment.", xp: 25 },
  { id: "assign_10",    icon: "📦", name: "Deadline Machine",   desc: "Complete 10 assignments.", xp: 100 },
  { id: "assign_25",    icon: "🏭", name: "Productivity Plant", desc: "Complete 25 assignments.", xp: 200 },
  { id: "focus_1h",     icon: "⏱️", name: "Deep Diver",         desc: "Log 1 hour of focused study.", xp: 30 },
  { id: "focus_10h",    icon: "🧠", name: "Brain Forge",        desc: "Log 10 hours of focused study.", xp: 120 },
  { id: "focus_50h",    icon: "🛰️", name: "Orbit Mode",         desc: "Log 50 hours of focused study.", xp: 400 },
  { id: "comeback",     icon: "📈", name: "The Comeback",       desc: "Improve a subject average by 10%+.", xp: 150 },
  { id: "full_house",   icon: "🏠", name: "Full House",         desc: "Track 6 or more subjects.", xp: 50 },
  { id: "exam_ready",   icon: "🛡️", name: "Battle Ready",       desc: "Reach 85%+ exam readiness on any exam.", xp: 80 },
  { id: "marks_25",     icon: "📊", name: "Data Driven",        desc: "Log 25 marks.", xp: 100 },
  { id: "aps_30",       icon: "🎓", name: "University Bound",   desc: "Reach an APS score of 30+.", xp: 150 },
  { id: "aps_36",       icon: "👑", name: "Top Tier APS",       desc: "Reach an APS score of 36+.", xp: 250 },
  { id: "level_5",      icon: "🚀", name: "Ascension",          desc: "Reach Level 5.", xp: 100 },
  { id: "night_owl",    icon: "🦉", name: "Clutch Player",      desc: "Complete an assignment due within 24h.", xp: 40 },
  { id: "recall_1",     icon: "🃏", name: "Active Recaller",    desc: "Review your first flashcard.", xp: 25 },
  { id: "recall_100",   icon: "🧠", name: "Memory Athlete",     desc: "Review 100 flashcards in total.", xp: 200 },
];

GF.COACH_ACTIONS = [
  { id: "explain",    icon: "💡", name: "Explain This Simply",   desc: "Break any topic down like you're 12." },
  { id: "quiz",       icon: "❓", name: "Create Quiz",            desc: "Generate a practice quiz with answers." },
  { id: "flashcards", icon: "🃏", name: "Generate Flashcards",    desc: "Spaced-repetition ready card deck." },
  { id: "test",       icon: "🧪", name: "Test My Knowledge",      desc: "Adaptive Q&A that probes weak spots." },
  { id: "summarize",  icon: "📝", name: "Summarize Notes",        desc: "Condense notes into exam-ready points." },
  { id: "guide",      icon: "🗺️", name: "Create Study Guide",     desc: "Full structured guide for a topic." },
  { id: "examprep",   icon: "🎖️", name: "Exam Preparation Mode",  desc: "A complete battle plan for exam day." },
  { id: "assignment", icon: "🛠️", name: "Assignment Assistant",   desc: "Plan, structure and improve your work." },
  { id: "concept",    icon: "🧩", name: "Concept Breakdown",      desc: "Deconstruct hard ideas step by step." },
  { id: "memory",     icon: "🧲", name: "Memory Reinforcement",   desc: "Mnemonics + active recall drills." },
  { id: "accelerate", icon: "⚡", name: "Learning Accelerator",   desc: "Learn a topic 2x faster with 80/20." },
  { id: "caps_plan",  icon: "🇿🇦", name: "CAPS Study Plan",       desc: "CAPS-aligned plan for SA students.", sa: true },
];

GF.COACH_PROMPTS = {
  explain: `Act as the world's best teacher for {SUBJECT}. Explain "{TOPIC}" to me as if I'm a beginner.

Rules:
1. Start with a one-sentence "big idea" summary.
2. Use a real-world analogy I'll never forget.
3. Break it into max 5 simple steps or parts.
4. Avoid jargon — if you must use a technical term, define it instantly.
5. End with a 3-question mini-check to confirm I understood.

My current level: {LEVEL}. My goal: actually understand this, not memorize it.`,

  quiz: `You are my personal exam-setter for {SUBJECT}. Create a practice quiz on "{TOPIC}".

Format:
- 10 questions: 4 easy, 4 medium, 2 hard (exam difficulty).
- Mix of multiple choice, short answer, and one application question.
- Number every question.
- Put ALL answers with short explanations at the very end under "ANSWER KEY".
- After the key, list the 3 concepts I should revise if I scored under 7/10.

Make the questions feel like real exam questions, not trivia.`,

  flashcards: `Create a flashcard deck for {SUBJECT} — topic: "{TOPIC}".

Rules:
1. 15 cards in the format "FRONT: ... / BACK: ...".
2. Front = a question or cue, never a full sentence to complete.
3. Back = the shortest complete answer possible (max 2 sentences).
4. Order cards from foundational → advanced.
5. Mark the 5 most exam-critical cards with ⭐.
6. End with a suggested spaced-repetition schedule for the next 7 days.`,

  test: `You are a strict but encouraging examiner for {SUBJECT}. Test my knowledge of "{TOPIC}" interactively.

Process:
1. Ask me ONE question at a time and wait for my answer.
2. Start medium difficulty. If I'm right, go harder. If I'm wrong, go simpler and explain.
3. Track my score silently.
4. After 8 questions, give me: my score, my strongest area, my weakest area, and exactly what to revise next.

Begin with question 1 now.`,

  summarize: `Summarize my {SUBJECT} notes on "{TOPIC}" into an exam-ready revision sheet.

Output format:
1. "CORE IDEAS" — max 7 bullet points, each under 15 words.
2. "MUST-KNOW DEFINITIONS" — term: definition table.
3. "COMMON EXAM TRAPS" — 3 mistakes students make on this topic.
4. "ONE-MINUTE VERSION" — the entire topic in one short paragraph.

Here are my notes:
[PASTE YOUR NOTES HERE]`,

  guide: `Build me a complete study guide for {SUBJECT}: "{TOPIC}".

Structure:
1. Topic map — how the sub-topics connect (text diagram).
2. Each sub-topic: key points, one worked example, one practice question.
3. Difficulty rating per sub-topic (1-5) so I know where to spend time.
4. "If you only have 1 hour" — the 20% of content worth 80% of marks.
5. Final self-test: 5 questions covering the whole topic.

My exam is in {DAYS} days. Calibrate the depth accordingly.`,

  examprep: `You are my exam strategist. My {SUBJECT} exam on "{TOPIC}" is in {DAYS} days. Current average: {AVG}%. Target: {TARGET}%.

Build me a battle plan:
1. Day-by-day revision schedule from today until exam day.
2. Daily sessions max 45 min each, with specific goals per session.
3. Include 2 full practice-test days.
4. Active recall + spaced repetition only — no passive re-reading.
5. The night before + morning of: exact routine.
6. Top 5 predicted question types and how to approach each.`,

  assignment: `Act as my assignment coach for {SUBJECT}. I'm working on: "{TOPIC}".

Help me in 4 phases:
1. DECONSTRUCT — what is this assignment really asking? Identify the verbs (analyse, evaluate, compare...) and what markers want.
2. STRUCTURE — give me a skeleton outline with sections and what goes in each.
3. UPGRADE — list 5 things that separate a 90% answer from a 70% answer.
4. CHECKLIST — a final pre-submission checklist.

Important: guide me to produce my own work — coach me, don't write it for me.`,

  concept: `Deconstruct this difficult concept from {SUBJECT}: "{TOPIC}".

Method:
1. First Principles — strip it to its most basic truths.
2. Build it back up in 4 layers: intuition → mechanics → edge cases → exam application.
3. At each layer, give one "checkpoint question" to confirm I'm following.
4. Show the single most common misconception and why it's wrong.
5. Connect it to one concept I probably already understand.`,

  memory: `You are a memory coach. Help me permanently memorize "{TOPIC}" for {SUBJECT}.

Give me:
1. A vivid mnemonic or memory palace for the hardest list/sequence in this topic.
2. 5 active-recall prompts I should test myself with (no answers visible).
3. An absurd story linking the key terms (the weirder the better — weird sticks).
4. A 1-3-7 review plan: what to re-test after 1 day, 3 days, 7 days.
5. The "sticky sentence" — one memorable line that captures the core idea.`,

  accelerate: `I need to learn "{TOPIC}" for {SUBJECT} FAST. Apply the 80/20 rule.

1. The vital 20%: list the core ideas that deliver 80% of exam marks.
2. Teach me each one in under 100 words with one example.
3. Skip-list: what I can safely deprioritize and why.
4. One "anchor problem" that forces me to use everything at once.
5. A 25-minute power-session plan I can run right now with a timer.

I have {DAYS} days and my current average is {AVG}%. Be ruthless about priorities.`,

  caps_plan: `You are a South African CAPS curriculum expert. Build a CAPS-aligned study plan for {SUBJECT} ({GRADE_LABEL}).

Requirements:
1. Align to the official CAPS Annual Teaching Plan topics for this subject and grade.
2. Topic: "{TOPIC}" — or if blank, cover this term's full ATP scope.
3. Weight topics by their typical NSC/exam paper mark allocation.
4. Include past-paper practice: tell me which paper (P1/P2) and question types to drill.
5. Day-by-day plan for the next {DAYS} days, max 60 min/day.
6. Flag the topics that are most often poorly answered in NSC examiner reports.

My current mark: {AVG}%. Target: {TARGET}%. Make the plan realistic for a school week.`,
};

/* ---------- default state ---------- */

GF.defaultState = () => ({
  meta: { version: 1, created: GF.todayISO(), onboarded: false },
  user: {
    name: "",
    mode: "global",            // "global" | "sa"
    theme: "dark",             // "dark" | "light"
    gradeLabel: "Grade 11",
    weeklyFocusGoalMin: 300,
    matricDate: new Date().getFullYear() + "-10-21",
  },
  subjects: [],
  assignments: [],
  exams: [],
  flashcards: [],             // {id, subjectId, front, back, ease, interval, reps, lapses, due, created}
  focusSessions: [],           // {id, date, minutes, mode}
  plan: { date: null, done: [] },   // today's AI study-plan progress (keys completed)
  habits: [],                  // {id, name, icon, created, log:{ISO:true}}
  game: {
    xp: 0,
    reviews: 0,                // total flashcards reviewed
    streak: { count: 0, last: null, best: 0 },
    achievements: {},          // id -> dateISO
  },
  uni: {
    applications: [],          // {id, institution, course, deadline, status}
    scholarships: [],          // {id, name, amount, deadline, status}
    portfolio: [],             // {id, title, date, category}
  },
});

/* ---------- persistence ---------- */

GF.load = () => {
  try {
    const raw = localStorage.getItem(GF.STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      GF.state = Object.assign(GF.defaultState(), parsed);
      GF.state.user = Object.assign(GF.defaultState().user, parsed.user || {});
      GF.state.game = Object.assign(GF.defaultState().game, parsed.game || {});
      GF.state.uni = Object.assign(GF.defaultState().uni, parsed.uni || {});
      return;
    }
  } catch (e) { console.warn("GradeForge: failed to load state", e); }
  GF.state = GF.defaultState();
};

GF.save = () => {
  try { localStorage.setItem(GF.STORAGE_KEY, JSON.stringify(GF.state)); }
  catch (e) { console.warn("GradeForge: failed to save state", e); }
};

/* ---------- demo data ---------- */

GF.loadDemoData = (name) => {
  const s = GF.defaultState();
  s.meta.onboarded = true;
  s.user.name = name || "Alex";
  s.user.mode = "sa";
  s.user.gradeLabel = "Grade 11";

  const mk = (title, type, score, total, weeksAgo, weight = 1) => ({
    id: GF.uid(), title, type, score, total, weight,
    date: GF.todayISO(-weeksAgo * 7),
  });

  const subjDefs = [
    { name: "Mathematics", target: 80, marks: [
      mk("Algebra Test", "Test", 31, 50, 10), mk("Functions Quiz", "Quiz", 14, 20, 8),
      mk("Term Assignment", "Assignment", 33, 45, 7), mk("Trigonometry Test", "Test", 36, 50, 5),
      mk("Mid-Year Exam", "Exam", 112, 150, 3, 2), mk("Geometry Test", "Test", 41, 50, 1),
    ]},
    { name: "Physical Sciences", target: 75, marks: [
      mk("Chemistry Test", "Test", 28, 50, 9), mk("Practical: Reactions", "Practical", 17, 25, 7),
      mk("Physics Test: Motion", "Test", 33, 50, 5), mk("Mid-Year Exam", "Exam", 96, 150, 3, 2),
      mk("Electricity Quiz", "Quiz", 16, 20, 1),
    ]},
    { name: "English Home Language", target: 78, marks: [
      mk("Essay: Identity", "Essay", 36, 50, 9), mk("Comprehension Test", "Test", 31, 40, 7),
      mk("Oral Presentation", "Oral", 21, 25, 5), mk("Mid-Year Exam", "Exam", 109, 140, 3, 2),
      mk("Poetry Analysis", "Essay", 39, 50, 1),
    ]},
    { name: "Life Sciences", target: 80, marks: [
      mk("Cells Test", "Test", 38, 50, 10), mk("Practical: Microscopy", "Practical", 22, 25, 8),
      mk("Genetics Quiz", "Quiz", 17, 20, 6), mk("Mid-Year Exam", "Exam", 121, 150, 3, 2),
      mk("Human Systems Test", "Test", 44, 50, 1),
    ]},
    { name: "Accounting", target: 75, marks: [
      mk("Ledgers Test", "Test", 30, 50, 9), mk("Case Study", "Assignment", 28, 40, 6),
      mk("Mid-Year Exam", "Exam", 102, 150, 3, 2), mk("Budgeting Test", "Test", 37, 50, 1),
    ]},
    { name: "Geography", target: 72, marks: [
      mk("Mapwork Task", "Practical", 19, 30, 9), mk("Climate Test", "Test", 32, 50, 6),
      mk("Mid-Year Exam", "Exam", 94, 150, 3, 2), mk("Settlement Quiz", "Quiz", 15, 20, 1),
    ]},
  ];

  s.subjects = subjDefs.map((d, i) => ({
    id: GF.uid(), name: d.name, color: GF.SUBJECT_COLORS[i % GF.SUBJECT_COLORS.length],
    target: d.target, marks: d.marks,
  }));

  const sid = (n) => s.subjects.find(x => x.name.startsWith(n)).id;

  s.assignments = [
    { id: GF.uid(), title: "Euclidean Geometry Worksheet", subjectId: sid("Mathematics"), due: GF.todayISO(1), done: false, notes: "" },
    { id: GF.uid(), title: "Chemistry Practical Write-Up", subjectId: sid("Physical"), due: GF.todayISO(3), done: false, notes: "Titration results + conclusion" },
    { id: GF.uid(), title: "Macbeth Essay Draft", subjectId: sid("English"), due: GF.todayISO(6), done: false, notes: "" },
    { id: GF.uid(), title: "Genetics Poster", subjectId: sid("Life"), due: GF.todayISO(9), done: false, notes: "" },
    { id: GF.uid(), title: "Cash Flow Statement Exercise", subjectId: sid("Accounting"), due: GF.todayISO(-2), done: true, doneAt: GF.todayISO(-3), notes: "" },
    { id: GF.uid(), title: "Mapwork Portfolio", subjectId: sid("Geography"), due: GF.todayISO(-6), done: true, doneAt: GF.todayISO(-7), notes: "" },
    { id: GF.uid(), title: "Trig Revision Set", subjectId: sid("Mathematics"), due: GF.todayISO(-10), done: true, doneAt: GF.todayISO(-10), notes: "" },
  ];

  s.exams = [
    { id: GF.uid(), title: "Trial Exam P1", subjectId: sid("Mathematics"), date: GF.todayISO(9), confidence: 62 },
    { id: GF.uid(), title: "Trial Exam P1", subjectId: sid("Physical"), date: GF.todayISO(13), confidence: 48 },
    { id: GF.uid(), title: "Literature Paper", subjectId: sid("English"), date: GF.todayISO(17), confidence: 74 },
    { id: GF.uid(), title: "Trial Exam", subjectId: sid("Life"), date: GF.todayISO(21), confidence: 80 },
    { id: GF.uid(), title: "Trial Exam", subjectId: sid("Accounting"), date: GF.todayISO(24), confidence: 55 },
  ];

  const fc = (subjName, front, back, dueOffset, reps) => ({
    id: GF.uid(), subjectId: sid(subjName), front, back,
    ease: 2.4, interval: reps ? Math.max(1, dueOffset + 2) : 0, reps: reps || 0, lapses: 0,
    due: GF.todayISO(dueOffset), created: GF.todayISO(-20),
  });
  s.flashcards = [
    fc("Mathematics", "What is the derivative of sin(x)?", "cos(x)", 0, 2),
    fc("Mathematics", "sin²θ + cos²θ = ?", "1", -1, 3),
    fc("Mathematics", "Quadratic formula?", "x = (−b ± √(b² − 4ac)) / 2a", 0, 1),
    fc("Mathematics", "Area of a circle?", "πr²", -2, 4),
    fc("Physical", "Unit of electric current?", "Ampere (A)", 0, 1),
    fc("Physical", "Newton's 2nd law of motion?", "F = ma  (force = mass × acceleration)", 2, 2),
    fc("Physical", "Approx. speed of light?", "3 × 10⁸ m/s", -1, 4),
    fc("Life", "What is the powerhouse of the cell?", "The mitochondria", 0, 5),
    fc("Life", "Which base pairs with adenine in DNA?", "Thymine (T)", 1, 3),
    fc("English", "Define 'juxtaposition'.", "Placing two things side by side for contrasting effect.", 0, 1),
    fc("Accounting", "State the accounting equation.", "Assets = Liabilities + Owner's Equity", 0, 2),
    fc("Geography", "What causes a sea breeze?", "By day, land heats faster than sea, so cool air moves from sea to land.", 3, 1),
  ];

  const habitLog = (chance, run) => {
    const log = {};
    for (let d = 20; d >= 0; d--) {
      if (d <= run || (Math.sin(d * 5.3) * 0.5 + 0.5) < chance) log[GF.todayISO(-d)] = true;
    }
    return log;
  };
  s.habits = [
    { id: GF.uid(), name: "Review flashcards", icon: "🃏", created: GF.todayISO(-20), log: habitLog(0.8, 4) },
    { id: GF.uid(), name: "30 minutes of focus", icon: "⏱️", created: GF.todayISO(-20), log: habitLog(0.7, 3) },
    { id: GF.uid(), name: "Revise today's notes", icon: "📖", created: GF.todayISO(-20), log: habitLog(0.6, 2) },
    { id: GF.uid(), name: "Phone away while studying", icon: "📵", created: GF.todayISO(-20), log: habitLog(0.65, 1) },
    { id: GF.uid(), name: "Plan tomorrow", icon: "🗓️", created: GF.todayISO(-20), log: habitLog(0.55, 0) },
  ];

  // 8 weeks of focus history with an upward trend + 12-day streak
  for (let d = 56; d >= 0; d--) {
    const dow = new Date(GF.todayISO(-d) + "T00:00:00").getDay();
    const isRecent = d <= 12;
    const chance = isRecent ? 1 : (dow === 0 ? 0.3 : 0.62);
    if (Math.sin(d * 7.31) * 0.5 + 0.5 < chance) {
      const base = isRecent ? 45 : 25;
      const minutes = Math.round(base + (Math.sin(d * 3.7) * 0.5 + 0.5) * 50);
      s.focusSessions.push({ id: GF.uid(), date: GF.todayISO(-d), minutes, mode: minutes > 45 ? "Deep Work" : "Pomodoro" });
    }
  }

  s.game.xp = 1685;
  s.game.reviews = 34;
  s.game.streak = { count: 12, last: GF.todayISO(), best: 12 };
  const unlock = ["first_mark", "ace", "streak_3", "streak_7", "assign_1", "focus_1h", "focus_10h", "full_house", "marks_25", "level_5", "aps_30", "recall_1"];
  unlock.forEach((id, i) => { s.game.achievements[id] = GF.todayISO(-(40 - i * 3)); });

  s.uni.applications = [
    { id: GF.uid(), institution: "University of Cape Town", course: "BSc Computer Science", deadline: GF.todayISO(45), status: "In Progress" },
    { id: GF.uid(), institution: "Stellenbosch University", course: "BEng Electrical", deadline: GF.todayISO(60), status: "Planned" },
    { id: GF.uid(), institution: "University of Pretoria", course: "BSc Data Science", deadline: GF.todayISO(75), status: "Planned" },
  ];
  s.uni.scholarships = [
    { id: GF.uid(), name: "Allan Gray Orbis Fellowship", amount: "Full funding", deadline: GF.todayISO(30), status: "Applying" },
    { id: GF.uid(), name: "StudyTrust Bursary", amount: "R80,000/yr", deadline: GF.todayISO(50), status: "Researching" },
  ];
  s.uni.portfolio = [
    { id: GF.uid(), title: "Top 10 in Provincial Maths Olympiad", date: GF.todayISO(-90), category: "Academic" },
    { id: GF.uid(), title: "Debate Team Captain", date: GF.todayISO(-120), category: "Leadership" },
    { id: GF.uid(), title: "Built a study-tracker app", date: GF.todayISO(-40), category: "Project" },
  ];

  GF.state = s;
  GF.save();
};
