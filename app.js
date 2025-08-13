/* =========================================================
   BuzzPi – app.js (fresh copy with Pi auth fixes)
   ========================================================= */

// ---------- Utilities ----------
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function logToPanel(msg) {
  try {
    const el = $("#consolePanel");
    if (el) el.textContent += (el.textContent ? "\n" : "") + msg;
  } catch {}
  console.log(msg);
}

function formatAbbrev(n) {
  const num = Number(n || 0);
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(num % 1_000_000_000 ? 1 : 0) + "b";
  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(num % 1_000_000 ? 1 : 0) + "m";
  if (num >= 1_000)         return (num / 1_000).toFixed(num % 1_000 ? 1 : 0) + "k";
  return String(num);
}

// ---------- State ----------
const state = {
  balance: Number(localStorage.getItem("buzzpi.balance") || 0),
  soundOn: localStorage.getItem("buzzpi.soundOn") !== "0",
  user: null, // Pi user once authenticated
};

// ---------- UI Wiring ----------
function updateBalance() {
  $("#balanceValue").textContent = formatAbbrev(state.balance);
}

function setSound(on) {
  state.soundOn = !!on;
  localStorage.setItem("buzzpi.soundOn", on ? "1" : "0");
  const label = $(".sound-label");
  if (label) label.textContent = on ? "On" : "Off";
}

function showPage(id) {
  $$(".page").forEach(p => p.classList.toggle("visible", p.id === id));
  $$(".nav-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.target === id));
}

function attachNav() {
  $$(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showPage(btn.dataset.target));
  });
  // default
  showPage("feedPage");
}

// ---------- Pi SDK: prevent bad anchors ----------
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a) return;
  const href = (a.getAttribute("href") || "").trim().toLowerCase();
  if (href === "window.pi" || href === "http://window.pi" || href === "https://window.pi") {
    e.preventDefault();
    logToPanel('⚠️ Blocked navigation to literal "window.pi". Use Pi.authenticate().');
  }
});

function isPiBrowser() {
  return typeof window !== "undefined" && !!window.Pi;
}

async function onIncompletePaymentFound(payment) {
  logToPanel("🔎 Incomplete payment found: " + JSON.stringify(payment));
  // (Optional) Send to backend to complete/void.
}

async function doPiLogin() {
  try {
    if (!isPiBrowser()) {
      logToPanel("⚠️ Not in Pi Browser. Open this page inside the Pi Browser and enable Sandbox.");
      return;
    }

    // Init SDK (sandbox true while testing)
    await Pi.init({ version: "2.0", sandbox: true });
    logToPanel("✅ Pi.init complete.");

    const scopes = ["username"]; // keep lightweight for now
    logToPanel("⏳ Calling Pi.authenticate(username) …");
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);
    state.user = auth?.user || null;

    const line = $("#piUserLine");
    if (state.user?.username && line) {
      line.textContent = `Signed in as @${state.user.username}`;
    }
    logToPanel("✅ Auth success: " + (state.user?.username || "(no username)"));
  } catch (err) {
    logToPanel("❌ Auth error: " + (err?.message || err));
    console.error(err);
  }
}

// ---------- Demo controls ----------
function attachDemoControls() {
  const plus = $("#devPlus100");
  if (plus) {
    plus.addEventListener("click", () => {
      state.balance += 100;
      localStorage.setItem("buzzpi.balance", String(state.balance));
      updateBalance();
    });
  }
  const reset = $("#resetBalance");
  if (reset) {
    reset.addEventListener("click", () => {
      state.balance = 0;
      localStorage.setItem("buzzpi.balance", "0");
      updateBalance();
    });
  }

  const sound = $("#soundToggle");
  if (sound) {
    sound.checked = !!state.soundOn;
    setSound(sound.checked);
    sound.addEventListener("change", () => setSound(sound.checked));
  }

  const loginBtn = $("#piLoginBtn");
  if (loginBtn) loginBtn.addEventListener("click", doPiLogin);

  const fab = $("#honeypotFab");
  if (fab) {
    fab.addEventListener("click", () => {
      // simple pulse animation demo
      fab.animate(
        [
          { transform: "scale(1)",    filter: "brightness(1)" },
          { transform: "scale(1.06)", filter: "brightness(1.15)" },
          { transform: "scale(1)",    filter: "brightness(1)" }
        ],
        { duration: 420, easing: "ease-out" }
      );
    });
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  updateBalance();
  attachNav();
  attachDemoControls();

  // Tab buttons (visual only here)
  $$(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      $$(".tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Initial log
  logToPanel(`Console ready… 🔎 window.Pi present: ${isPiBrowser()}`);
});