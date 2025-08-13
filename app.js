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
  let pressTimer = null;
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
    const map = { home:"feedPage", gifts:"giftsPage", wallet:"walletPage", profile:"profilePage" };
    tabButtons.forEach(btn => btn.classList.toggle("active", map[btn.dataset.page] === id));
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      if (page === "home")  showPage("feedPage");
      if (page === "gifts") { showPage("giftsPage"); ensureGiftsMounted(); }
      if (page === "wallet") showPage("walletPage");
      if (page === "profile") showPage("profilePage");
    });
  });

  topTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      topTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
    });
  });

  if (fabGift) {
    fabGift.addEventListener("click", () => {
      showPage("giftsPage");
      ensureGiftsMounted();
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      soundOn = !soundOn;
      soundToggle.setAttribute("aria-pressed", String(soundOn));
      soundLabel.textContent = soundOn ? "On" : "Off";
    });
  }

  const add100 = document.getElementById("devAdd100");
  const resetBal = document.getElementById("resetBalance");
  if (add100) add100.addEventListener("click", () => setBalance(balance + 100));
  if (resetBal) resetBal.addEventListener("click", () => setBalance(0));

  // ---------- Gift Icon Generator (SVG badges) ----------
  // returns a data URL (data:image/svg+xml;utf8,...) per name
  function iconDataURL(key) {
    const K = key.toLowerCase().replace(/\s+/g,'-'); // normalized
    const svg = (inner, grad=`<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"  stop-color="#303041"/>
        <stop offset="100%" stop-color="#191922"/>
      </linearGradient>`,
      accent="#8aa0ff") => `
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <defs>${grad}</defs>
  <rect x="2" y="2" width="36" height="36" rx="9" fill="url(#g)"/>
  ${inner}
  <circle cx="33.2" cy="8.2" r="1.2" fill="${accent}" opacity=".9"/>
</svg>`;

    const goldGrad = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"  stop-color="#3a2a12"/>
        <stop offset="55%" stop-color="#8b5e17"/>
        <stop offset="100%" stop-color="#281f0e"/>
      </linearGradient>`;

    const crystalGrad = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"  stop-color="#233041"/>
        <stop offset="50%" stop-color="#2a4b69"/>
        <stop offset="100%" stop-color="#1a2635"/>
      </linearGradient>`;

    const jadeGrad = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0e3a2a"/>
        <stop offset="60%" stop-color="#2aa071"/>
        <stop offset="100%" stop-color="#0b2b20"/>
      </linearGradient>`;

    // tiny pictos (simple shapes—fast to render)
    const car = (fill) => `<path d="M8 22h24l-2-5.2c-.4-1-1.3-1.8-2.4-2l-6.2-1.1c-1.6-.3-3.2-.3-4.8 0L10.9 15c-1.1.2-2 .9-2.4 2L8 22Z" fill="${fill}"/>
      <circle cx="14" cy="25" r="2.6" fill="#0d0d12"/><circle cx="26" cy="25" r="2.6" fill="#0d0d12"/>`;
    const plane = (fill) => `<path d="M7 23l26-6-1.6-2.4L18 18l1-6-2.6-.8-1.6 6.9-6.8 2.1L7 23Z" fill="${fill}"/>`;
    const yacht = (fill) => `<path d="M9 24h22c-.9 2.7-4 5-10.8 5-7.4 0-10.7-2.3-11.2-5Z" fill="${fill}"/><path d="M13 17h8l5 4H12l1-4Z" fill="#cfd8ff" opacity=".35"/><path d="M14 12l8 5h-9l1-5Z" fill="#cfd8ff" opacity=".25"/>`;
    const crown = (fill) => `<path d="M9 24l2-7 5 4 4-6 4 6 5-4 2 7H9Z" fill="${fill}"/><rect x="11" y="24" width="18" height="4" rx="1.2" fill="#0d0d12"/>`;
    const castle = (fill) => `<rect x="10" y="18" width="20" height="10" rx="2" fill="${fill}"/><rect x="17" y="14" width="6" height="4" fill="${fill}"/><rect x="18" y="21" width="4" height="7" fill="#0d0d12"/>`;
    const treasure = (fill) => `<rect x="10" y="18" width="20" height="10" rx="2" fill="${fill}"/><rect x="10" y="16" width="20" height="4" rx="2" fill="#65420f"/><circle cx="20" cy="23" r="2" fill="#0d0d12"/>`;
    const mansion = (fill) => `<rect x="12" y="16" width="16" height="12" rx="1.6" fill="${fill}"/><rect x="18" y="19" width="4" height="9" fill="#0d0d12"/><rect x="14" y="19" width="2.6" height="3.6" fill="#0d0d12"/><rect x="23.4" y="19" width="2.6" height="3.6" fill="#0d0d12"/>`;
    const mermaid = (fill) => `<circle cx="17.5" cy="19" r="3" fill="${fill}"/><path d="M15 22c4 2 7 2 9 6-5-.4-8-1.5-10-3.3 0-1.1.4-2.1 1-2.7Z" fill="#3bc9af"/>`;
    const cupids = (fill) => `<path d="M12 24c2.2-4.2 5.8-5 8-1.2 2.2-3.8 5.8-3 8 1.2-3.2 1.6-6 3.3-8 5.2-2-1.9-4.8-3.6-8-5.2Z" fill="${fill}"/>`;
    const jet = (fill) => `<path d="M8 24l10-4 1-8 3 6 10-4-8 10-6 3-10-3Z" fill="${fill}"/>`;
    const rolex = (fill) => `<circle cx="20" cy="22" r="7" fill="${fill}"/><rect x="18.8" y="11" width="2.4" height="6" rx="1" fill="${fill}"/><rect x="18.8" y="27" width="2.4" height="6" rx="1" fill="${fill}"/><circle cx="20" cy="22" r="3.2" fill="#0d0d12"/>`;
    const horses = (fill) => `<path d="M9 25c3-5 7-6 11-3l2-2 2 1-1 3c2 2 3 3 5 6-6-1-11-2-19-5Z" fill="${fill}"/>`;
    const phoenix = (fill) => `<path d="M13 26c4-1 5-3 6-6 1 3 3 5 8 6-3 .6-5 2.2-8 4-3-1.8-5-3.4-6-4Z" fill="${fill}"/><path d="M20 14c1.8 0 3.2 1.4 3.2 3.2S21.8 20.4 20 20.4 16.8 19 16.8 17.2 18.2 14 20 14Z" fill="#ffb37a"/>`;
    const unicorn = (fill) => `<rect x="12" y="18" width="16" height="9" rx="4.5" fill="${fill}"/><path d="M26 16l3-3 .8 2.6L26 18v-2Z" fill="#ffd26e"/>`;

    // map keys to pictos + palette
    if (K.includes('jade-lamborghini'))   return toURL(svg(car('#2fc48f'), jadeGrad, '#9ff2cf'));
    if (K.includes('crystal-aeroplane'))  return toURL(svg(plane('#8fbdf7'), crystalGrad, '#c1dcff'));
    if (K.includes('golden-hummer'))      return toURL(svg(car('#efc15a'), goldGrad, '#ffe3a7'));
    if (K.includes('yacht'))              return toURL(svg(yacht('#8fbdf7'), crystalGrad, '#c1dcff'));

    if (K.includes('fiery-phoenix'))      return toURL(svg(phoenix('#ff7a3b'), goldGrad, '#ffd4a8'));
    if (K.includes('racing-unicorn'))     return toURL(svg(unicorn('#b58cff'), crystalGrad, '#e2d3ff'));
    if (K.includes('crystal-castle'))     return toURL(svg(castle('#9bc7ff'), crystalGrad, '#d7e8ff'));
    if (K.includes('pirate-treasure'))    return toURL(svg(treasure('#cf9f3a'), goldGrad, '#ffe2a6'));
    if (K.includes('mansion-in-the-sky')) return toURL(svg(mansion('#9bc7ff'), crystalGrad, '#d7e8ff'));
    if (K.includes('mermaid'))            return toURL(svg(mermaid('#6bdcbf'), crystalGrad, '#b7ffe8'));
    if (K.includes('cupids'))             return toURL(svg(cupids('#ff7aa8'), crystalGrad, '#ffd0e1'));
    if (K.includes('elf-queen'))          return toURL(svg(crown('#c59cff'), crystalGrad, '#efdfff'));
    if (K.includes('golden-private-jet')) return toURL(svg(jet('#efc15a'), goldGrad, '#ffe3a7'));
    if (K.includes('diamond-rolex'))      return toURL(svg(rolex('#9bc7ff'), crystalGrad, '#d7e8ff'));
    if (K.includes('chariots-of-horses')) return toURL(svg(horses('#efc15a'), goldGrad, '#ffe3a7'));

    // fallback mini star
    return toURL(svg(`<path d="M20 10l2.2 6.5 6.8.3-5.5 4 2 6.6-5.5-3.8-5.5 3.8 2-6.6-5.5-4 6.8-.3L20 10Z" fill="#9fb3ff"/>`));
  }
  function toURL(svg) { return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`; }

  // ---------- Gifts catalog ----------
  const GIFTS = [
    {
      group: "Common",
      items: [
        { id:"g1-1",  label:"🥳", price:1 }, { id:"g1-2", label:"🥰", price:1 },
        { id:"g1-3",  label:"😍", price:1 }, { id:"g1-4", label:"😋", price:1 },
        { id:"g1-5",  label:"🤗", price:1 }, { id:"g1-6", label:"🤩", price:1 },
        { id:"g1-7",  label:"🤑", price:1 },
        { id:"g2-1",  label:"🍭", price:2 }, { id:"g2-2", label:"🍬", price:2 }, { id:"g2-3", label:"🍫", price:2 },
        { id:"g5-1",  label:"🍸", price:5 }, { id:"g5-2", label:"🍎", price:5 }, { id:"g5-3", label:"🍺", price:5 },
        { id:"g10-1", label:"🌹", price:10 }, { id:"g10-2", label:"🌸", price:10 }, { id:"g10-3", label:"✨️", price:10 },
        { id:"g20-1", label:"💐", price:20 }, { id:"g20-2", label:"🍻", price:20 }, { id:"g20-3", label:"👏", price:20 }, { id:"g20-4", label:"💋", price:20 },
      ]
    },
    {
      group: "Rare",
      items: [
        { id:"r50-1", label:"🦋", price:50 }, { id:"r50-2", label:"🌩", price:50 }, { id:"r50-3", label:"🌤", price:50 }, { id:"r50-4", label:"🌈", price:50 }, { id:"r50-5", label:"❄️", price:50 },
        { id:"r100-1", label:"🧸", price:100 }, { id:"r100-2", label:"🐇", price:100 }, { id:"r100-3", label:"🍾", price:100 }, { id:"r100-4", label:"👑", price:100 }, { id:"r100-5", label:"🍷", price:100 }, { id:"r100-6", label:"🥂", price:100 },
        { id:"r500-1", label:"Jade Lamborghini", price:500 },
        { id:"r500-2", label:"Crystal Aeroplane", price:500 },
        { id:"r500-3", label:"Golden Hummer Jeep", price:500 },
        { id:"r500-4", label:"Yacht", price:500 },
      ]
    },
    {
      group: "Billionaire",
      items: [
        { id:"b1000-1",  label:"Fiery Phoenix",      price:1000 },
        { id:"b1000-2",  label:"Racing Unicorn",     price:1000 },
        { id:"b1000-3",  label:"Crystal Castle",     price:1000 },
        { id:"b1000-4",  label:"Pirate Treasure",    price:1000 },
        { id:"b5000-1",  label:"Mansion in the Sky", price:5000 },
        { id:"b5000-2",  label:"Mermaid",            price:5000 },
        { id:"b5000-3",  label:"Cupids",             price:5000 },
        { id:"b5000-4",  label:"Elf Queen",          price:5000 },
        { id:"b10000-1", label:"Golden Private Jet", price:10000 },
        { id:"b10000-2", label:"Diamond Rolex",      price:10000 },
        { id:"b10000-3", label:"Chariots of Horses", price:10000 },
      ]
    }
  ];

  // ---------- Render gifts ----------
  function ensureGiftsMounted(){
    const container = document.getElementById("giftsPage");
    if (!container) return;
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

        let media = "";
        if (isEmoji) {
          media = `<div class="gift__emoji">${item.label}</div>`;
        } else {
          // named gifts -> generated icon
          const dataURL = iconDataURL(item.label);
          media = `<img class="gift__icon" alt="" src="${dataURL}">`;
        }

        el.innerHTML = `
          ${media}
          <div class="gift__label">${isEmoji ? "" : item.label}</div>
          <div class="gift__price">${item.price} <span style="opacity:.8">①</span></div>
        `;

        el.addEventListener("click", () => {
          document.querySelectorAll(".gift").forEach(g => g.classList.remove("gift--selected"));
          el.classList.add("gift--selected");
          selectedGiftId = item.id;
        });

        el.addEventListener("pointerdown", (ev) => {
          ev.preventDefault();
          document.querySelectorAll(".gift").forEach(g => g.classList.remove("gift--selected"));
          el.classList.add("gift--selected");
          selectedGiftId = item.id;
          pressTimer = setTimeout(() => {
            sendGift(item);
            pressInterval = setInterval(() => sendGift(item), 220);
          }, 300);
        });
        const clearPress = () => { clearTimeout(pressTimer); pressTimer=null; clearInterval(pressInterval); pressInterval=null; };
        el.addEventListener("pointerup", clearPress);
        el.addEventListener("pointerleave", clearPress);
        el.addEventListener("pointercancel", clearPress);

        grid.appendChild(el);
      });

      root.appendChild(wrap);
    });

    const sendBtn = document.getElementById("sendGiftBtn");
    const multiBtn = document.getElementById("multiGiftBtn");

    sendBtn.addEventListener("click", () => {
      if (!selectedGiftId) return toast("Select a gift first");
      const el = document.querySelector(`.gift[data-id="${selectedGiftId}"]`);
      if (!el) return;
      const price = Number(el.dataset.price);
      sendGift({ id:selectedGiftId, price });
    });

    multiBtn.addEventListener("pointerdown", () => {
      if (!selectedGiftId) return toast("Select a gift first");
      const el = document.querySelector(`.gift[data-id="${selectedGiftId}"]`);
      if (!el) return;
      const price = Number(el.dataset.price);
      pressInterval = setInterval(() => sendGift({ id:selectedGiftId, price }), 220);
    });
    const stopMulti = () => { clearInterval(pressInterval); pressInterval=null; };
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

  // ---------- Initial ----------
  showPage("feedPage");
});