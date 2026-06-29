/* Dopamine Reset theme — interaction layer. No dependencies. */
(function () {
  'use strict';

  /* ---- reveal on scroll ---- */
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 })
    : null;
  function bindReveals(root) {
    (root || document).querySelectorAll('.reveal').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  /* ---- mobile nav ---- */
  function bindNav() {
    var t = document.querySelector('[data-nav-toggle]');
    var n = document.querySelector('[data-nav]');
    if (!t || !n) return;
    t.addEventListener('click', function () { n.classList.toggle('open'); });
    n.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { n.classList.remove('open'); });
    });
  }

  /* ---- FAQ accordion ---- */
  function bindFaq() {
    document.querySelectorAll('.faq__q').forEach(function (q) {
      q.addEventListener('click', function () {
        var item = q.closest('.faq__item');
        var a = item.querySelector('.faq__a');
        var open = item.classList.toggle('open');
        a.style.maxHeight = open ? a.scrollHeight + 'px' : 0;
      });
    });
  }

  /* ---- Quiz: "Which Escape Are You?" ---- */
  function bindQuiz() {
    var root = document.querySelector('[data-quiz]');
    if (!root) return;

    var questions, results;
    try {
      questions = JSON.parse(root.getAttribute('data-questions') || '[]');
      results = JSON.parse(root.getAttribute('data-results') || '{}');
    } catch (e) { return; }
    if (!questions.length) return;

    var bar = root.querySelector('.quiz__bar i');
    var qEl = root.querySelector('[data-quiz-q]');
    var optsEl = root.querySelector('[data-quiz-opts]');
    var resultEl = root.querySelector('[data-quiz-result]');
    var stepEl = root.querySelector('[data-quiz-step]');
    var i = 0, score = { starter: 0, pro: 0, circle: 0 };

    function render() {
      var q = questions[i];
      bar.style.width = ((i) / questions.length * 100) + '%';
      qEl.textContent = q.q;
      optsEl.innerHTML = '';
      q.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'quiz__opt';
        b.type = 'button';
        b.textContent = opt.label;
        b.addEventListener('click', function () {
          score[opt.weight] = (score[opt.weight] || 0) + 1;
          i++;
          if (i < questions.length) render(); else finish();
        });
        optsEl.appendChild(b);
      });
    }

    function finish() {
      bar.style.width = '100%';
      var key = 'pro';
      if (score.circle >= score.pro && score.circle >= score.starter) key = 'circle';
      else if (score.starter > score.pro && score.starter > score.circle) key = 'starter';
      var r = results[key] || {};
      qEl.parentElement.querySelectorAll('.quiz__hidden').forEach(function (n) { n.style.display = 'none'; });
      optsEl.style.display = 'none';
      if (stepEl) stepEl.style.display = 'none';
      resultEl.style.display = 'block';
      resultEl.innerHTML =
        '<span class="rec">Your match</span>' +
        '<h3>' + (r.title || 'Your result') + '</h3>' +
        '<p>' + (r.blurb || '') + '</p>' +
        '<a class="btn btn--gold btn--lg" href="' + (r.url || '#pricing') + '">' +
          (r.cta || 'Get ' + (r.title || 'the reset')) + ' →</a>' +
        '<p style="margin-top:18px;font-size:.85rem"><a href="#pricing" style="color:var(--ink-faint)">Compare all plans</a></p>';
    }

    render();
  }

  /* ---- live scarcity counter (cosmetic, deterministic per day) ---- */
  function bindScarcity() {
    document.querySelectorAll('[data-scarcity]').forEach(function (el) {
      var base = parseInt(el.getAttribute('data-scarcity'), 10) || 30;
      var day = Math.floor(Date.now() / 86400000);
      var left = base - (day % (base - 3)); // wanders, never hits 0
      el.textContent = el.getAttribute('data-label').replace('{n}', Math.max(3, left));
    });
  }

  /* ---- premium interactions: ripple (all) + tilt & magnetic (desktop) ---- */
  function bindPremium() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.addEventListener('pointerdown', function (e) {
      if (reduce) return;
      var b = e.target.closest('.btn'); if (!b) return;
      var r = document.createElement('span'); r.className = 'rip';
      var rc = b.getBoundingClientRect();
      r.style.left = (e.clientX - rc.left) + 'px'; r.style.top = (e.clientY - rc.top) + 'px';
      b.appendChild(r); setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 640);
    });
    var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    if (!fine || reduce) return;
    var curT = null, curB = null, lx = 0, ly = 0, tick = false;
    function reset(el) { if (el) el.style.transform = ''; }
    window.addEventListener('pointermove', function (e) {
      lx = e.clientX; ly = e.clientY; if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var el = document.elementFromPoint(lx, ly);
        if (!el || !el.closest) { reset(curT); curT = null; reset(curB); curB = null; return; }
        var t = el.closest('.tier,.feature,.card,.quote,.bn__card');
        if (t !== curT) { reset(curT); curT = t; }
        if (t) {
          var r = t.getBoundingClientRect();
          var px = (lx - r.left) / r.width - 0.5, py = (ly - r.top) / r.height - 0.5;
          var sc = (t.className.indexOf('tier--featured') > -1) ? ' scale(1.03)' : '';
          t.style.transform = 'perspective(900px) rotateX(' + (-py * 5).toFixed(2) + 'deg) rotateY(' + (px * 6).toFixed(2) + 'deg) translateY(-4px)' + sc;
        }
        var b = el.closest('.btn');
        if (b !== curB) { reset(curB); curB = b; }
        if (b) {
          var br = b.getBoundingClientRect();
          var mx = lx - (br.left + br.width / 2), my = ly - (br.top + br.height / 2);
          b.style.transform = 'translate(' + (mx * 0.14).toFixed(1) + 'px,' + (my * 0.26).toFixed(1) + 'px)';
        }
      });
    });
  }

  function init() {
    bindReveals();
    bindNav();
    bindFaq();
    bindQuiz();
    bindScarcity();
    bindPremium();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Re-bind reveals when Shopify theme editor injects/reloads a section
  document.addEventListener('shopify:section:load', function (e) { bindReveals(e.target); bindFaq(); bindQuiz(); });
})();
