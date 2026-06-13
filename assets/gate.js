/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — ACCESS GATE  (build 4)
   Purchase-code lock. Codes stored only as a synchronous hash.
   Runs synchronously and exposes window.GFGATE.unlock() so the
   button can call it inline — no event-listener / timing / crypto
   dependencies. Works on every browser and device.
   ───────────────────────────────────────────────────────────────
   Change/add codes: edit VALID_HASHES (cyrb53 of the normalised,
   A-Z 0-9 uppercase code).
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var UNLOCK_KEY = "gradeforge_unlocked_v1";
  var VALID_HASHES = ["7376192739717603"]; // current launch code

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

  function isUnlocked() {
    try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch (e) { return false; }
  }

  function reveal() {
    try { localStorage.setItem(UNLOCK_KEY, "1"); } catch (e) {}
    document.documentElement.classList.remove("gf-locked");
    var g = document.getElementById("gate-screen");
    if (g) { g.classList.add("gate-ok"); setTimeout(function () { g.hidden = true; }, 520); }
  }

  function showError(msg) {
    var err = document.getElementById("gate-error");
    if (err) { err.textContent = msg; err.style.display = "block"; }
    var card = document.querySelector(".gate-card");
    if (card) { card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake"); }
  }

  // Public — called inline by the button and the input's Enter key.
  window.GFGATE = {
    unlock: function () {
      var input = document.getElementById("gate-input");
      var code = normalize(input ? input.value : "");
      if (!code) { showError("Please type your access code first."); return false; }
      if (VALID_HASHES.indexOf(cyrb53(code)) !== -1) { reveal(); return true; }
      showError("That code isn’t right. Check your confirmation and try again.");
      try { input.select(); } catch (e) {}
      return false;
    }
  };

  // Lock + show the gate immediately. The gate markup sits above this
  // script in the body, so it is already parsed and available now.
  if (isUnlocked()) return;
  document.documentElement.classList.add("gf-locked");
  var gate = document.getElementById("gate-screen");
  if (gate) gate.hidden = false;
  var inp = document.getElementById("gate-input");
  if (inp) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 120);
})();
