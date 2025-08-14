import { GIFTS } from './gifts.js';

const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));

/* ================= CONFIG ================ */
const PAYMENTS_ENABLED = true;            // toggle if you want local-only testing
const SANDBOX = true;                     // Pi Browser sandbox
const SERVER_BASE = location.origin;      // same domain (Vercel)

/* Price mapping (BuzzCoin -> Pi amount) */
const buzzToPi = (buzz) => Math.max(0.001, +(buzz / 10000).toFixed(3));

/* ================= STATE ================= */
const state = {
  balance: Number(localStorage.getItem('bp.balance') || 0),
  selectedGiftId: null,
  filterHome: 'all',
  filterGifts: 'all',
  user: JSON.parse(localStorage.getItem('bp.user') || 'null') // {username}
};

/* =============== UTILITIES =============== */
const fmt = n => {
  if (n >= 1e9) return (n/1e9).toFixed(n%1e9?1:0) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(n%1e6?1:0) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(n%1e3?1:0) + 'k';
  return String(n);
};

function toast(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);background:#222;border:1px solid #333;color:#fff;padding:10px 14px;border-radius:10px;z-index:9999';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2100);
}

/* ======== SPRITE (SVG data URIs) ========= */
function iconSVG(kind, colorA, colorB){
  // very light, symbolic icons so UI never breaks
  switch(kind){
    case 'car': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <rect x='6' y='16' rx='6' ry='6' width='52' height='14' fill='${colorA}'/>
      <rect x='14' y='8' rx='3' ry='3' width='28' height='10' fill='${colorB}'/>
      <circle cx='20' cy='33' r='4' fill='#111'/><circle cx='44' cy='33' r='4' fill='#111'/>
    </svg>`;
    case 'plane': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <path d='M4 22L58 20 60 24 4 22z' fill='${colorA}'/>
      <path d='M20 10l24 10-24 10z' fill='${colorB}'/>
    </svg>`;
    case 'yacht': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <path d='M6 28h52c-4 6-16 8-26 8S12 34 6 28z' fill='${colorA}'/>
      <path d='M18 10l16 12H18z' fill='${colorB}'/>
    </svg>`;
    case 'phoenix': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
      <circle cx='32' cy='32' r='12' fill='${colorA}'/>
      <path d='M10 44c8-8 12-8 22 0 10-8 14-8 22 0-8 2-16 6-22 12-6-6-14-10-22-12z' fill='${colorB}'/>
    </svg>`;
    case 'unicorn': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <rect x='12' y='18' width='28' height='12' rx='6' fill='${colorA}'/>
      <circle cx='44' cy='24' r='6' fill='${colorB}'/>
      <path d='M50 10l8 6-10 2z' fill='${colorB}'/>
    </svg>`;
    case 'castle': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <rect x='8' y='18' width='48' height='16' fill='${colorA}'/>
      <rect x='16' y='8' width='8' height='10' fill='${colorB}'/>
      <rect x='40' y='8' width='8' height='10' fill='${colorB}'/>
    </svg>`;
    case 'treasure': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <rect x='12' y='16' width='40' height='20' rx='4' fill='${colorA}'/>
      <rect x='12' y='12' width='40' height='8' rx='4' fill='${colorB}'/>
    </svg>`;
    case 'mansion': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <rect x='10' y='16' width='44' height='18' fill='${colorA}'/>
      <polygon points='32,6 12,18 52,18' fill='${colorB}'/>
    </svg>`;
    case 'mermaid': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <circle cx='22' cy='18' r='6' fill='${colorA}'/>
      <path d='M28 20c10 6 14 10 22 16-12-2-20-6-30-14z' fill='${colorB}'/>
    </svg>`;
    case 'queen': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <rect x='16' y='18' width='32' height='14' fill='${colorA}'/>
      <polygon points='16,18 24,8 32,18' fill='${colorB}'/>
      <polygon points='32,18 40,8 48,18' fill='${colorB}'/>
    </svg>`;
    case 'jet': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <path d='M4 24l40-4 16 6-16 2z' fill='${colorA}'/>
      <rect x='20' y='14' width='10' height='6' fill='${colorB}'/>
    </svg>`;
    case 'rolex': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
      <circle cx='32' cy='32' r='18' fill='${colorA}' stroke='${colorB}' stroke-width='4'/>
      <rect x='28' y='10' width='8' height='8' fill='${colorB}'/>
      <rect x='28' y='46' width='8' height='8' fill='${colorB}'/>
    </svg>`;
    case 'horses': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <path d='M6 30h52c-10-10-18-10-26 0-8-10-16-10-26 0z' fill='${colorA}'/>
      <circle cx='16' cy='22' r='4' fill='${colorB}'/>
      <circle cx='48' cy='22' r='4' fill='${colorB}'/>
    </svg>`;
    case 'party': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <polygon points='8,32 26,6 36,24' fill='${colorA}'/>
      <circle cx='44' cy='14' r='6' fill='${colorB}'/>
    </svg>`;
    case 'lick': return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'>
      <circle cx='24' cy='20' r='10' fill='${colorA}'/>
      <path d='M20 26c12 2 18 2 24-2-2 8-10 12-20 8z' fill='${colorB}'/>
    </svg>`;
    default: return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'><rect x='6' y='8' width='52' height='24' rx='6' fill='${colorA}'/></svg>`;
  }
}
function toURI(svg){ return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`; }
function spriteFor(g){
  const id = g.effect||'';
  const gold='#efb24b', amber='#f8d07a', blue='#8fbfff', teal='#74e0c9', rose='#ff9ab2';
  if (id==='car') return toURI(iconSVG('car', gold, amber));
  if (id==='plane') return toURI(iconSVG('plane', blue, amber));
  if (id==='yacht') return toURI(iconSVG('yacht', blue, '#d1e6ff'));
  if (id==='phoenix') return toURI(iconSVG('phoenix', '#ff6b3d', gold));
  if (id==='unicorn') return toURI(iconSVG('unicorn', '#b58cff', '#ffe6f7'));
  if (id==='castle') return toURI(iconSVG('castle', '#a6c8ff', '#d7e7ff'));
  if (id==='treasure') return toURI(iconSVG('treasure', gold, '#ffd77a'));
  if (id==='mansion') return toURI(iconSVG('mansion', '#c6d9ff', '#8fb1ff'));
  if (id==='mermaid') return toURI(iconSVG('mermaid', '#6bd9ff', '#aaf4ff'));
  if (id==='queen') return toURI(iconSVG('queen', '#ffd5f4', '#ff96dc'));
  if (id==='jet') return toURI(iconSVG('jet', gold, amber));
  if (id==='rolex') return toURI(iconSVG('rolex', gold, '#8b6d28'));
  if (id==='horses') return toURI(iconSVG('horses', gold, amber));
  if (id==='party') return toURI(iconSVG('party', '#ff7aa2', '#ffe06d'));
  if (id==='lick') return toURI(iconSVG('lick', '#ffd1a8', '#ff8aa2'));
  return toURI(iconSVG('default', '#cfe0ff', '#9bbcff'));
}

/* =============== RENDER ================== */
function syncUI() {
  $('#balanceLbl').textContent = fmt(state.balance);
  const u = state.user;
  $('#profileBox').innerHTML = u ? `Signed in as <b>@${u.username}</b>` : `<span class="muted">Not signed in.</span>`;
  $('#profileBox2').innerHTML = $('#profileBox').innerHTML;
  $('#accountRow').textContent = u ? `Signed in: @${u.username}` : `Not signed in.`;

  const g1 = selectedGift('#giftGrid');
  const g2 = selectedGift('#giftGrid2');
  $('#btnSend').disabled  = !g1 || (PAYMENTS_ENABLED ? false : g1.price > state.balance);
  $('#btnSend2').disabled = !g2 || (PAYMENTS_ENABLED ? false : g2.price > state.balance);
}

function buildCard(g){
  const el = document.createElement('button');
  el.className='gift';
  el.dataset.id = g.id;
  const sprite = spriteFor(g);
  el.innerHTML = `
    <div class="pic"><img width="40" height="40" alt="" src="${sprite}"></div>
    <div class="title">${g.title}</div>
    <div class="price"><span class="coin-sml"></span>${fmt(g.price)}</div>
  `;
  el.addEventListener('click', () => {
    el.closest('.gift-grid').querySelectorAll('.gift').forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
    syncUI();
    el.animate([{transform:'scale(1)'},{transform:'scale(1.07)'},{transform:'scale(1)'}], {duration:500, easing:'ease-in-out'});
  });
  return el;
}

function renderGrids(){
  const filterA = state.filterHome, filterB = state.filterGifts;
  const dataA = GIFTS.filter(g => filterA==='all'?true:g.cat===filterA);
  const dataB = GIFTS.filter(g => filterB==='all'?true:g.cat===filterB);

  const g1 = $('#giftGrid'); g1.innerHTML=''; dataA.forEach(g => g1.appendChild(buildCard(g)));
  const g2 = $('#giftGrid2'); g2.innerHTML=''; dataB.forEach(g => g2.appendChild(buildCard(g)));
}

function selectedGift(gridSel){
  const gEl = $(`${gridSel} .gift.selected`);
  if (!gEl) return null;
  const id = gEl.dataset.id;
  return GIFTS.find(x => x.id === id) || null;
}

/* ================ FX ====================== */
function giftEffect(gift) {
  const wrap = document.createElement('div');
  wrap.className = 'fx';
  wrap.innerHTML = `<img class="sprite" alt="" src="${spriteFor(gift)}" width="140" height="140">`;
  document.body.appendChild(wrap);
  // simple motion
  wrap.querySelector('.sprite').animate([
    { transform:'translateY(0) scale(1)'   , offset:0 },
    { transform:'translateY(-24px) scale(1.08)', offset:.35 },
    { transform:'translateY(-48px) scale(1.0)', offset:.7  },
    { transform:'translateY(-60px) scale(.98)', offset:1  },
  ], { duration: 1200, easing:'ease-out' });
  setTimeout(() => wrap.remove(), 5000);
}

/* ============== PI SDK ==================== */
async function initPi() {
  if (!window.Pi) return null;
  try {
    await window.Pi.init({ sandbox: SANDBOX });
    return window.Pi;
  } catch (e) {
    console.warn('Pi.init failed', e);
    return null;
  }
}

async function signInPi() {
  const Pi = await initPi();
  if (!Pi) { demoUser(); return; }
  try {
    const auth = await Pi.authenticate({ scopes: ['username'] }, onIncompletePayment);
    state.user = { username: auth.user.username };
    localStorage.setItem('bp.user', JSON.stringify(state.user));
    syncUI();
    toast(`Hi @${state.user.username}!`);
  } catch (e) {
    console.error('authenticate error', e);
    toast('Sign-in failed. Re-enter Sandbox code and retry.');
  }
}
function demoUser(){
  state.user = { username:'demo_user' };
  localStorage.setItem('bp.user', JSON.stringify(state.user));
  syncUI();
  toast('Pi SDK not detected (demo user).');
}

function onIncompletePayment(paymentId) {
  console.log('onIncompletePayment', paymentId);
}

/* ============== PAYMENTS ================== */
async function sendGiftPi(g) {
  const Pi = await initPi();
  if (!Pi) { toast('Pi SDK not available here.'); return; }
  if (!state.user) { toast('Please sign in with Pi first.'); return; }

  const amount = buzzToPi(g.price);
  const memo = `BuzzPi • ${g.title}`;
  const metadata = { giftId: g.id, priceBuzz: g.price };

  try {
    await Pi.createPayment({
      amount, memo, metadata,

      onReadyForServerApproval: async (paymentId) => {
        await fetch(`${SERVER_BASE}/api/payments/approve`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ paymentId })
        });
      },

      onReadyForServerCompletion: async (paymentId, txid) => {
        await fetch(`${SERVER_BASE}/api/payments/complete`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ paymentId, txid })
        });
        giftEffect(g);
        toast(`Sent: ${g.title}`);
      },

      onCancel: async (paymentId) => {
        await fetch(`${SERVER_BASE}/api/payments/cancel`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ paymentId })
        });
        toast('Payment cancelled.');
      },

      onError: (err) => {
        console.error('Pi payment error', err);
        toast('Payment error.');
      }
    });
  } catch (e) {
    console.error('createPayment failed', e);
    toast('Could not start payment.');
  }
}

function sendGiftLocal(g){
  if (g.price > state.balance) { toast('Insufficient BuzzCoin.'); return; }
  state.balance -= g.price;
  localStorage.setItem('bp.balance', state.balance);
  syncUI();
  giftEffect(g);
  toast(`Sent: ${g.title}`);
}

/* ============ NAV / EVENTS =============== */
function navTo(page){
  $$('.page').forEach(p => p.classList.remove('visible'));
  $(`#page-${page}`).classList.add('visible');
  $$('.bottom-nav .tab').forEach(t => t.classList.toggle('active', t.dataset.page === page));
  if (page === 'gifts') {
    // ensure separate grid reflects its filter
    renderGrids();
  }
}

function wire(){
  // chip bar
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    const name = c.dataset.chip;
    $('#feedSub').textContent = name.charAt(0).toUpperCase()+name.slice(1) + ' feed placeholder.';
  }));

  // filter pills (both pages)
  document.querySelectorAll('#page-home .pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('#page-home .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    state.filterHome = p.dataset.cat;
    renderGrids(); syncUI();
  }));
  document.querySelectorAll('#page-gifts .pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('#page-gifts .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active');
    state.filterGifts = p.dataset.cat;
    renderGrids(); syncUI();
  }));

  // tabs
  $$('.bottom-nav .tab').forEach(btn => btn.addEventListener('click', () => navTo(btn.dataset.page)));

  // FAB → gifts
  $('#fabHoney').addEventListener('click', () => {
    const f = $('#fabHoney');
    f.animate([{transform:'translateX(-50%) translateY(-26px) scale(1)'},{transform:'translateX(-50%) translateY(-26px) scale(1.06)'},{transform:'translateX(-50%) translateY(-26px) scale(1)'}], {duration:520});
    navTo('gifts');
  });

  // wallet buttons
  $('#btnDev100').addEventListener('click', () => { state.balance += 100; localStorage.setItem('bp.balance',state.balance); syncUI(); });
  $('#btnResetBal').addEventListener('click', () => { state.balance = 0; localStorage.setItem('bp.balance',state.balance); syncUI(); });
  $('#btnDev100w').addEventListener('click', () => { state.balance += 100; localStorage.setItem('bp.balance',state.balance); syncUI(); });
  $('#btnResetBalw').addEventListener('click', () => { state.balance = 0; localStorage.setItem('bp.balance',state.balance); syncUI(); });

  // sign-in buttons
  $('#btnPi').addEventListener('click', signInPi);
  $('#btnPi2').addEventListener('click', signInPi);

  // send
  const doSend = (gridSel) => {
    const g = selectedGift(gridSel);
    if (!g) return;
    if (PAYMENTS_ENABLED) sendGiftPi(g);
    else sendGiftLocal(g);
  };
  $('#btnSend').addEventListener('click', () => doSend('#giftGrid'));
  $('#btnSend2').addEventListener('click', () => doSend('#giftGrid2'));
}

/* ================= BOOT =================== */
renderGrids();
wire();
syncUI();