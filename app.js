import { GIFTS } from './gifts.js';

const $ = (q, r = document) => r.querySelector(q);
const $$ = (q, r = document) => Array.from(r.querySelectorAll(q));

/* ================= CONFIG ================ */
const PAYMENTS_ENABLED = true;
const SANDBOX = true;
const SERVER_BASE = location.origin;

/* Buzz→Pi conversion (sandbox test mapping) */
const buzzToPi = (buzz) => Math.max(0.001, +(buzz / 10000).toFixed(3));

/* Level rule: 500 Buzz / level */
const LEVEL_UNIT = 500;

/* ================= STATE ================= */
const state = {
  balance: Number(localStorage.getItem('bp.balance') || 0),
  totalSentBuzz: Number(localStorage.getItem('bp.totalSent') || 0),
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

/* ======== SPRITES & FX (same as before, trimmed) ======== */
function iconSVG(kind, a, b){ /* (…same as in prior message…) */ return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 40'><rect x='6' y='8' width='52' height='24' rx='6' fill='${a}'/></svg>`; }
function toURI(svg){ return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`; }
function spriteFor(g){ /* (…map effects to data URIs as before…) */ return toURI(iconSVG('default', '#cfe0ff', '#9bbcff')); }

function giftEffect(gift) {
  const wrap = document.createElement('div');
  wrap.className = 'fx';
  wrap.innerHTML = `<img class="sprite" alt="" src="${spriteFor(gift)}" width="140" height="140">`;
  document.body.appendChild(wrap);
  wrap.querySelector('.sprite').animate([
    { transform:'translateY(0) scale(1)'},
    { transform:'translateY(-24px) scale(1.08)'},
    { transform:'translateY(-60px) scale(1.0)'},
  ], { duration: 1200, easing:'ease-out' });
  setTimeout(() => wrap.remove(), 5000);
}

/* =============== RENDER ================== */
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
  const dataA = GIFTS.filter(g => state.filterHome==='all'?true:g.cat===state.filterHome);
  const dataB = GIFTS.filter(g => state.filterGifts==='all'?true:g.cat===state.filterGifts);
  const g1 = $('#giftGrid'); g1.innerHTML=''; dataA.forEach(g => g1.appendChild(buildCard(g)));
  const g2 = $('#giftGrid2'); g2.innerHTML=''; dataB.forEach(g => g2.appendChild(buildCard(g)));
}

function selectedGift(gridSel){
  const gEl = $(`${gridSel} .gift.selected`);
  if (!gEl) return null;
  const id = gEl.dataset.id;
  return GIFTS.find(x => x.id === id) || null;
}

/* ======= LEVELS ======= */
function calcLevel(totalBuzz){
  const lvl = Math.min(99, 1 + Math.floor(totalBuzz / LEVEL_UNIT));
  const into = totalBuzz % LEVEL_UNIT;
  return { level: lvl, progress: into / LEVEL_UNIT, into, next: LEVEL_UNIT };
}
function updateLevelUI(){
  const { level, progress, into, next } = calcLevel(state.totalSentBuzz);
  $('#levelLabel').textContent = `Lv ${level}`;
  $('#levelNext').textContent = `${into} / ${next} BuzzCoin`;
  $('#levelBar').style.width = `${Math.round(progress*100)}%`;
}

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

  updateLevelUI();
}

/* ============== PI SDK ==================== */
async function initPi() {
  if (!window.Pi) return null;
  try { await window.Pi.init({ sandbox: SANDBOX }); return window.Pi; }
  catch(e){ console.warn('Pi.init failed', e); return null; }
}
async function signInPi() {
  const Pi = await initPi();
  if (!Pi) { demoUser(); return; }
  try {
    const auth = await Pi.authenticate({ scopes: ['username'] }, onIncompletePayment);
    state.user = { username: auth.user.username };
    localStorage.setItem('bp.user', JSON.stringify(state.user));
    syncUI(); toast(`Hi @${state.user.username}!`);
  } catch(e){ console.error(e); toast('Sign-in failed. Re-enter Sandbox code.'); }
}
function onIncompletePayment(paymentId){ console.log('onIncompletePayment', paymentId); }
function demoUser(){ state.user={username:'demo_user'}; localStorage.setItem('bp.user',JSON.stringify(state.user)); syncUI(); toast('Pi SDK not detected (demo).'); }

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
        // success: effect + level credit (BuzzCoin equivalent)
        state.totalSentBuzz += g.price;
        localStorage.setItem('bp.totalSent', state.totalSentBuzz);
        giftEffect(g); toast(`Sent: ${g.title}`); syncUI();
      },

      onCancel: async (paymentId) => {
        await fetch(`${SERVER_BASE}/api/payments/cancel`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ paymentId })
        });
        toast('Payment cancelled.');
      },

      onError: (err) => { console.error('Pi payment error', err); toast('Payment error.'); }
    });
  } catch (e) {
    console.error('createPayment failed', e);
    toast('Could not start payment.');
  }
}

function sendGiftLocal(g){
  if (g.price > state.balance) { toast('Insufficient BuzzCoin.'); return; }
  state.balance -= g.price;
  state.totalSentBuzz += g.price;
  localStorage.setItem('bp.balance', state.balance);
  localStorage.setItem('bp.totalSent', state.totalSentBuzz);
  syncUI(); giftEffect(g); toast(`Sent: ${g.title}`);
}

/* ============ NAV / EVENTS =============== */
function navTo(page){
  $$('.page').forEach(p => p.classList.remove('visible'));
  $(`#page-${page}`).classList.add('visible');
  $$('.bottom-nav .tab').forEach(t => t.classList.toggle('active', t.dataset.page === page));
  if (page === 'gifts') renderGrids();
}

function wire(){
  // chip bar
  $$('.chip').forEach(c => c.addEventListener('click', () => {
    $$('.chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    const name = c.dataset.chip;
    $('#feedSub').textContent = name.charAt(0).toUpperCase()+name.slice(1) + ' feed placeholder.';
  }));

  // filter pills
  document.querySelectorAll('#page-home .pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('#page-home .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); state.filterHome = p.dataset.cat; renderGrids(); syncUI();
  }));
  document.querySelectorAll('#page-gifts .pill').forEach(p => p.addEventListener('click', () => {
    document.querySelectorAll('#page-gifts .pill').forEach(x => x.classList.remove('active'));
    p.classList.add('active'); state.filterGifts = p.dataset.cat; renderGrids(); syncUI();
  }));

  // tabs
  $$('.bottom-nav .tab').forEach(btn => btn.addEventListener('click', () => navTo(btn.dataset.page)));

  // FAB → gifts
  $('#fabHoney').addEventListener('click', () => {
    const f = $('#fabHoney');
    f.animate([{transform:'translateX(-50%) translateY(-26px) scale(1)'},{transform:'translateX(-50%) translateY(-26px) scale(1.06)'},{transform:'translateX(-50%) translateY(-26px) scale(1)'}], {duration:520});
    navTo('gifts');
  });

  // wallet
  $('#btnDev100').addEventListener('click', () => { state.balance += 100; localStorage.setItem('bp.balance',state.balance); syncUI(); });
  $('#btnResetBal').addEventListener('click', () => { state.balance = 0; localStorage.setItem('bp.balance',state.balance); syncUI(); });
  $('#btnDev100w').addEventListener('click', () => { state.balance += 100; localStorage.setItem('bp.balance',state.balance); syncUI(); });
  $('#btnResetBalw').addEventListener('click', () => { state.balance = 0; localStorage.setItem('bp.balance',state.balance); syncUI(); });

  // sign-in
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