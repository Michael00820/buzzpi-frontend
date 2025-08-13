document.addEventListener("DOMContentLoaded", () => {
  const pageViews = document.querySelectorAll(".page__view");
  const tabButtons = document.querySelectorAll(".tabbar__item");
  const fabGift = document.getElementById("fabGift");
  const topTabs = document.querySelectorAll(".tab");
  const soundToggle = document.getElementById("soundToggle");
  const soundLabel = document.getElementById("soundLabel");
  const balanceAmountEl = document.getElementById("balanceAmount");

  // ---------- State ----------
  let balance = 0;
  let soundOn = true;
  let selectedGiftId = null;
  let pressTimer = null;   // for long-press sending
  let pressInterval = null;

  // ---------- Utils ----------
  const formatK = (val) => {
    if (val >= 1_000_000) return (val/1_000_000).toFixed(val>=10_000_000?0:1)+'m';
    if (val >= 1_000)     return (val/1_000).toFixed(val>=10_000?0:1)+'k';
    return String(val);
  };
  const setBalance = (v) => {
    balance = Math.max(0, Number(v)||0);
    balanceAmountEl.textContent = formatK(balance);
  };
  setBalance(0);

  const toast = (() => {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    let t;
    return (msg, ms=1600) => {
      el.textContent = msg;
      el.classList.add("toast--show");
      clearTimeout(t);
      t = setTimeout(()=> el.classList.remove("toast--show"), ms);
    };
  })();

  // ---------- Pages ----------
  const showPage = (id) => {
    pageViews.forEach(v => v.classList.toggle("page__view--active", v.id === id));
    // Highlight tabbar button
    tabButtons.forEach(btn => {
      const map = { home:"feedPage", gifts:"giftsPage", wallet:"walletPage", profile:"profilePage" };
      const isActive = map[btn.dataset.page] === id;
      btn.classList.toggle("active", !!isActive);
    });
  };

  // Bottom navigation
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (page === "home")  showPage("feedPage");
      if (page === "gifts") { showPage("giftsPage"); ensureGiftsMounted(); }
      if (page === "wallet") showPage("walletPage");
      if (page === "profile") showPage("profilePage");
    });
  });

  // Top tabs (Following / Popular / Nearby / New)
  topTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      topTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      // (optional) swap feed content here
    });
  });

  // FAB -> open Gifts
  if (fabGift) {
    fabGift.addEventListener("click", () => {
      showPage("giftsPage");
      ensureGiftsMounted();
    });
  }

  // Sound toggle
  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      soundOn = !soundOn;
      soundToggle.setAttribute("aria-pressed", String(soundOn));
      soundLabel.textContent = soundOn ? "On" : "Off";
    });
  }

  // Wallet dev buttons
  const add100 = document.getElementById("devAdd100");
  const resetBal = document.getElementById("resetBalance");
  if (add100) add100.addEventListener("click", () => setBalance(balance + 100));
  if (resetBal) resetBal.addEventListener("click", () => setBalance(0));

  // ---------- Gifts catalog ----------
  // Your price mapping & emoji per your spec
  const GIFTS = [
    {
      group: "Common",
      items: [
        // 1 buzzcoin
        { id:"g1-1",  label:"🥳", price:1 }, { id:"g1-2", label:"🥰", price:1 },
        { id:"g1-3",  label:"😍", price:1 }, { id:"g1-4", label:"😋", price:1 },
        { id:"g1-5",  label:"🤗", price:1 }, { id:"g1-6", label:"🤩", price:1 },
        { id:"g1-7",  label:"🤑", price:1 },
        // 2 buzzcoin
        { id:"g2-1",  label:"🍭", price:2 }, { id:"g2-2", label:"🍬", price:2 }, { id:"g2-3", label:"🍫", price:2 },
        // 5 buzzcoin
        { id:"g5-1",  label:"🍸", price:5 }, { id:"g5-2", label:"🍎", price:5 }, { id:"g5-3", label:"🍺", price:5 },
        // 10 buzzcoin
        { id:"g10-1", label:"🌹", price:10 }, { id:"g10-2", label:"🌸", price:10 }, { id:"g10-3", label:"✨️", price:10 },
        // 20 buzzcoin
        { id:"g20-1", label:"💐", price:20 }, { id:"g20-2", label:"🍻", price:20 }, { id:"g20-3", label:"👏", price:20 }, { id:"g20-4", label:"💋", price:20 },
      ]
    },
    {
      group: "Rare",
      items: [
        // 50
        { id:"r50-1", label:"🦋", price:50 }, { id:"r50-2", label:"🌩", price:50 }, { id:"r50-3", label:"🌤", price:50 }, { id:"r50-4", label:"🌈", price:50 }, { id:"r50-5", label:"❄️", price:50 },
        // 100
        { id:"r100-1", label:"🧸", price:100 }, { id:"r100-2", label:"🐇", price:100 }, { id:"r100-3", label:"🍾", price:100 }, { id:"r100-4", label:"👑", price:100 }, { id:"r100-5", label:"🍷", price:100 }, { id:"r100-6", label:"🥂", price:100 },
        // 500 (named items without emoji)
        { id:"r500-1", label:"Jade Lamborghini", price:500 },
        { id:"r500-2", label:"Crystal Aeroplane", price:500 },
        { id:"r500-3", label:"Golden Hummer Jeep", price:500 },
        { id:"r500-4", label:"Yacht", price:500 },
      ]
    },
    {
      group: "Billionaire",
      items: [
        { id:"b1000-1",  label:"Fiery Phoenix", price:1000 },
        { id:"b1000-2",  label:"Racing Unicorn", price:1000 },
        { id:"b1000-3",  label:"Crystal Castle", price:1000 },
        { id:"b1000-4",  label:"Pirate Treasure", price:1000 },
        { id:"b5000-1",  label:"Mansion in the Sky", price:5000 },
        { id:"b5000-2",  label:"Mermaid", price:5000 },
        { id:"b5000-3",  label:"Cupids", price:5000 },
        { id:"b5000-4",  label:"Elf Queen", price:5000 },
        { id:"b10000-1", label:"Golden Private Jet", price:10000 },
        { id:"b10000-2", label:"Diamond Rolex", price:10000 },
        { id:"b10000-3", label:"Chariots of Horses", price:10000 },
      ]
    }
  ];

  // ---------- Render gifts ----------
  function ensureGiftsMounted(){
    const container = document.getElementById("giftsPage");
    if (!container) return;
    // If already mounted once, do nothing
    if (container.dataset.mounted === "1") return;

    container.dataset.mounted = "1";
    container.innerHTML = `
      <h1 class="page__title">Gifts</h1>
      <div class="gifts" id="giftsRoot"></div>
      <div class="gifts__actions">
        <button id="sendGiftBtn" class="btn-send">Send</button>
        <button id="multiGiftBtn" class="btn-multi" title="Hold to multi-send">Hold for Combo</button>
      </div>
    `;

    const root = document.getElementById("giftsRoot");
    GIFTS.forEach(group => {
      const wrap = document.createElement("div");
      wrap.className = "gifts__group";
      wrap.innerHTML = `<div class="gifts__title">${group.group}</div>
                        <div class="gift-grid"></div>`;
      const grid = wrap.querySelector(".gift-grid");

      group.items.forEach(item => {
        const isEmoji = /\p{Extended_Pictographic}/u.test(item.label);
        const el = document.createElement("button");
        el.className = "gift";
        el.dataset.id = item.id;
        el.dataset.price = item.price;

        el.innerHTML = `
          <div class="gift__emoji">${isEmoji ? item.label : "🎇"}</div>
          <div class="gift__label">${isEmoji ? "" : item.label}</div>
          <div class="gift__price">${item.price} <span style="opacity:.8">①</span></div>
        `;

        el.addEventListener("click", () => {
          document.querySelectorAll(".gift").forEach(g => g.classList.remove("gift--selected"));
          el.classList.add("gift--selected");
          selectedGiftId = item.id;
        });

        // Long-press to auto-send combos
        el.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          document.querySelectorAll(".gift").forEach(g => g.classList.remove("gift--selected"));
          el.classList.add("gift--selected");
          selectedGiftId = item.id;

          // start after 300ms, then repeat every 220ms
          pressTimer = setTimeout(() => {
            sendGift(item);
            pressInterval = setInterval(() => sendGift(item), 220);
          }, 300);
        });
        const clearPress = () => {
          clearTimeout(pressTimer); pressTimer = null;
          clearInterval(pressInterval); pressInterval = null;
        };
        el.addEventListener("pointerup", clearPress);
        el.addEventListener("pointerleave", clearPress);
        el.addEventListener("pointercancel", clearPress);

        grid.appendChild(el);
      });

      root.appendChild(wrap);
    });

    // Wire Send button
    const sendBtn = document.getElementById("sendGiftBtn");
    const multiBtn = document.getElementById("multiGiftBtn");

    sendBtn.addEventListener("click", () => {
      if (!selectedGiftId) return toast("Select a gift first");
      const el = document.querySelector(`.gift[data-id="${selectedGiftId}"]`);
      if (!el) return;
      const price = Number(el.dataset.price);
      sendGift({ id:selectedGiftId, price });
    });

    // Hold the combo button as an alternative to long-press on tile
    multiBtn.addEventListener("pointerdown", () => {
      if (!selectedGiftId) return toast("Select a gift first");
      const el = document.querySelector(`.gift[data-id="${selectedGiftId}"]`);
      if (!el) return;
      const price = Number(el.dataset.price);
      pressInterval = setInterval(() => sendGift({ id:selectedGiftId, price }), 220);
    });
    const stopMulti = () => { clearInterval(pressInterval); pressInterval = null; };
    multiBtn.addEventListener("pointerup", stopMulti);
    multiBtn.addEventListener("pointerleave", stopMulti);
    multiBtn.addEventListener("pointercancel", stopMulti);
  }

  // ---------- Send gift (deduct + simple FX stub) ----------
  function sendGift(item){
    if (balance < item.price) {
      toast("Insufficient balance");
      return;
    }
    setBalance(balance - item.price);

    // Simple FX preview (we’ll plug in the big animations later)
    const layer = document.getElementById("fx-layer") || (() => {
      const d = document.createElement("div");
      d.id = "fx-layer"; d.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:70;";
      document.body.appendChild(d); return d;
    })();

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      position:absolute; left:50%; top:60%;
      transform:translate(-50%,-50%) scale(0.8);
      padding:14px 18px; border-radius:999px; font-weight:800;
      background:rgba(30,30,38,.85); color:#fff; border:1px solid rgba(255,255,255,.12);
      box-shadow:0 10px 30px rgba(0,0,0,.45);
    `;
    bubble.textContent = `+ ${item.price} gift sent`;
    layer.appendChild(bubble);
    bubble.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0.8)', opacity: 0 },
        { transform: 'translate(-50%,-60%) scale(1)', opacity: 1, offset: .3 },
        { transform: 'translate(-50%,-80%) scale(0.98)', opacity: 0 }
      ],
      { duration: 900, easing: 'ease-out' }
    ).onfinish = () => bubble.remove();
  }

  // ---------- Initial page ----------
  showPage("feedPage");
});