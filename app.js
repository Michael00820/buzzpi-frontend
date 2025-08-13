/* =========================================================
   BuzzPi – App JS
   - Shortens balance (1k, 1.2k, 3.4M…)
   - Persists balance + sound setting
   - Wires honeypot FAB and tab buttons
   ========================================================= */

(function () {
  const STORAGE_KEYS = {
    balance: "buzzpi.balance",
    sound: "buzzpi.soundOn",
    lastTab: "buzzpi.lastTab",
  };

  const els = {
    balance: document.getElementById("buzzBalance"),
    soundBtn: document.getElementById("soundBtn"),
    honeypot: document.getElementById("honeypotBtn"),
    tabbar: document.getElementById("tabbar"),
  };

  // ---------- Helpers ----------
  // 1) Short number formatter (1k, 1.1k, 2.3M, 4B, 7T)
  function formatShort(n) {
    if (n == null || isNaN(n)) return "0";
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";

    if (abs < 1000) return sign + String(abs);

    const units = [
      { v: 1e12, s: "T" },
      { v: 1e9, s: "B" },
      { v: 1e6, s: "M" },
      { v: 1e3, s: "k" },
    ];
    for (const { v, s } of units) {
      if (abs >= v) {
        const val = (abs / v).toFixed(1);      // one decimal
        const cleaned = val.replace(/\.0$/, ""); // trim trailing .0
        return sign + cleaned + s;
      }
    }
    return sign + String(abs);
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  // ---------- State ----------
  const state = {
    balance: load(STORAGE_KEYS.balance, 0),
    soundOn: load(STORAGE_KEYS.sound, true),
    lastTab: load(STORAGE_KEYS.lastTab, "home"),
  };

  // ---------- UI Updaters ----------
  function renderBalance() {
    if (!els.balance) return;
    els.balance.textContent = formatShort(state.balance);
  }

  function renderSound() {
    if (!els.soundBtn) return;
    els.soundBtn.textContent = state.soundOn ? "🔊 On" : "🔈 Off";
    els.soundBtn.setAttribute("aria-pressed", state.soundOn ? "true" : "false");
  }

  function setActiveTab(name) {
    if (!els.tabbar) return;
    const buttons = els.tabbar.querySelectorAll("button.tab");
    buttons.forEach(btn => {
      const isActive = btn.dataset.tab === name;
      btn.classList.toggle("active", isActive);
    });
    state.lastTab = name;
    save(STORAGE_KEYS.lastTab, name);
  }

  // ---------- Actions you can call from elsewhere ----------
  // Example dev helpers you can invoke in Console:
  //   window.buzzpi.addCoins(1250)
  //   window.buzzpi.setCoins(987654)
  const api = {
    addCoins(amount) {
      state.balance = Math.max(0, Number(state.balance) + Number(amount || 0));
      save(STORAGE_KEYS.balance, state.balance);
      renderBalance();
    },
    setCoins(amount) {
      state.balance = Math.max(0, Number(amount || 0));
      save(STORAGE_KEYS.balance, state.balance);
      renderBalance();
    }
  };
  window.buzzpi = api;

  // ---------- Event Wiring ----------
  // FAB (honeypot) — example behavior placeholder
  if (els.honeypot) {
    els.honeypot.addEventListener("click", () => {
      // Demo: Add a small amount and show a subtle tap animation
      api.addCoins(1);
      els.honeypot.animate(
        [
          { transform: "translateX(-50%) scale(1)", filter: "brightness(1)" },
          { transform: "translateX(-50%) scale(1.06)", filter: "brightness(1.2)" },
          { transform: "translateX(-50%) scale(1)", filter: "brightness(1)" }
        ],
        { duration: 240, easing: "ease-out" }
      );
    });
  }

  // Sound toggle
  if (els.soundBtn) {
    els.soundBtn.addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      save(STORAGE_KEYS.sound, state.soundOn);
      renderSound();
    });
  }

  // Bottom nav tabs
  if (els.tabbar) {
    els.tabbar.addEventListener("click", (e) => {
      const btn = e.target.closest("button.tab");
      if (!btn) return;
      const name = btn.dataset.tab || "home";
      setActiveTab(name);
      // You can swap main content here based on `name` if needed
    });
  }

  // ---------- Initial render ----------
  renderBalance();
  renderSound();
  setActiveTab(state.lastTab);

  // Optional: keep FAB clear of keyboard (mobile typing)
  // Adds a tiny offset when viewport height shrinks
  const root = document.documentElement;
  let baseVh = window.innerHeight;
  window.addEventListener("resize", () => {
    const now = window.innerHeight;
    const delta = Math.max(0, baseVh - now);
    root.style.setProperty("--kb-offset", delta + "px");
  });
})();