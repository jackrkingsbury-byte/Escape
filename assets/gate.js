/* ═══════════════════════════════════════════════════════════════
   GRADEFORGE AI X — ACCESS GATE
   A purchase-code lock for the hosted app. Buyers receive a code;
   the code is stored here only as a SHA-256 hash (never plain text).
   ───────────────────────────────────────────────────────────────
   To change or add codes: replace/add hashes in VALID_HASHES below.
   Generate a hash from a code (letters/numbers only, UPPERCASE) with:
     node -e "console.log(require('crypto').createHash('sha256').update('YOURCODE').digest('hex'))"
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var UNLOCK_KEY = "gradeforge_unlocked_v1";

  // SHA-256 hashes of accepted access codes (normalized: A-Z 0-9 only, uppercase).
  var VALID_HASHES = [
    "ef32f56294331626e122a1ff22c0ef8ab694fbcdcf2541ab316577bef92397b3" // current launch code
  ];

  var normalize = function (s) { return (s || "").replace(/[^a-z0-9]/gi, "").toUpperCase(); };

  var sha256 = function (str) {
    var data = new TextEncoder().encode(str);
    return crypto.subtle.digest("SHA-256", data).then(function (buf) {
      return Array.from(new Uint8Array(buf)).map(function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  };

  var alreadyUnlocked = function () {
    try { return localStorage.getItem(UNLOCK_KEY) === "1"; } catch (e) { return false; }
  };

  var markUnlocked = function () {
    try { localStorage.setItem(UNLOCK_KEY, "1"); } catch (e) {}
  };

  var lockPage = function () { document.documentElement.classList.add("gf-locked"); };
  var revealApp = function () {
    document.documentElement.classList.remove("gf-locked");
    var g = document.getElementById("gate-screen");
    if (g) g.hidden = true;
  };

  // Lock immediately (before paint) if not already unlocked.
  if (alreadyUnlocked()) return;
  lockPage();

  document.addEventListener("DOMContentLoaded", function () {
    var gate = document.getElementById("gate-screen");
    if (!gate) return;
    gate.hidden = false;

    var input = document.getElementById("gate-input");
    var btn = document.getElementById("gate-btn");
    var err = document.getElementById("gate-error");

    var attempt = function () {
      var code = normalize(input.value);
      if (!code) { showError("Enter your access code to continue."); return; }
      btn.disabled = true; btn.textContent = "Checking…";
      sha256(code).then(function (h) {
        if (VALID_HASHES.indexOf(h) !== -1) {
          markUnlocked();
          gate.classList.add("gate-ok");
          setTimeout(revealApp, 550);
        } else {
          btn.disabled = false; btn.textContent = "Unlock GradeForge AI X";
          showError("That code isn’t right. Check your purchase confirmation and try again.");
          input.select();
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = "Unlock GradeForge AI X";
        showError("Something went wrong — please try again.");
      });
    };

    var showError = function (msg) {
      err.textContent = msg;
      err.style.display = "block";
      gate.querySelector(".gate-card").classList.remove("shake");
      void gate.offsetWidth;
      gate.querySelector(".gate-card").classList.add("shake");
    };

    btn.addEventListener("click", attempt);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
    setTimeout(function () { input.focus(); }, 100);
  });
})();
