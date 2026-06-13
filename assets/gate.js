/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — ACCESS GATE
   A purchase-code lock for the hosted app. Buyers receive a code;
   the code is stored here only as a hash (never plain text).
   Uses a synchronous hash (cyrb53) so it works on every browser
   and device — no Web Crypto / secure-context dependency.
   ───────────────────────────────────────────────────────────────
   To change/add codes: replace/add the hashes in VALID_HASHES.
   Generate a hash for a new code (letters/numbers only) with cyrb53
   of the normalised (A-Z 0-9, uppercase) code.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var UNLOCK_KEY = "gradeforge_unlocked_v1";

  // cyrb53 hashes of accepted access codes (normalized: A-Z 0-9 only, uppercase).
  var VALID_HASHES = [
    "7376192739717603" // current launch code
  ];

  function normalize(s) { return (s || "").replace(/[^a-z0-9]/gi, "").toUpperCase(); }

  function cyrb53(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString();
  }

  function alreadyUnlocked() {
    try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch (e) { return false; }
  }
  function markUnlocked() {
    try { localStorage.setItem(UNLOCK_KEY, "1"); } catch (e) {}
  }

  function revealApp() {
    document.documentElement.classList.remove("gf-locked");
    var g = document.getElementById("gate-screen");
    if (g) g.hidden = true;
  }

  // Lock immediately (before paint) if not already unlocked.
  if (alreadyUnlocked()) return;
  document.documentElement.classList.add("gf-locked");

  function wire() {
    var gate = document.getElementById("gate-screen");
    if (!gate) return;
    gate.hidden = false;

    var input = document.getElementById("gate-input");
    var btn = document.getElementById("gate-btn");
    var err = document.getElementById("gate-error");
    if (!input || !btn) return;

    function showError(msg) {
      if (!err) return;
      err.textContent = msg;
      err.style.display = "block";
      var card = gate.querySelector(".gate-card");
      if (card) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); }
    }

    function attempt() {
      var code = normalize(input.value);
      if (!code) { showError("Enter your access code to continue."); return; }
      if (VALID_HASHES.indexOf(cyrb53(code)) !== -1) {
        markUnlocked();
        gate.classList.add("gate-ok");
        setTimeout(revealApp, 520);
      } else {
        showError("That code isn’t right. Check your purchase confirmation and try again.");
        try { input.select(); } catch (e) {}
      }
    }

    btn.addEventListener("click", attempt);
    btn.addEventListener("touchend", function (e) { e.preventDefault(); attempt(); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
