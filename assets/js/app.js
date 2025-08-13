
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function formatBuzz(n){
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n/1_000_000).toFixed(a>=10_000_000?0:1)+'m';
  if (a >= 1_000)     return (n/1_000).toFixed(a>=10_000?0:1)+'k';
  return String(n);
}

const state = { balance: 0, tab: 'following', sound: true };

function render(){
  const b = $('#balance'); if (b) b.textContent = formatBuzz(state.balance);
  $$('.tab').forEach(el => el.classList.toggle('active', el.dataset.tab === state.tab));
}

$$('.tab').forEach(btn => btn.addEventListener('click', () => {
  state.tab = btn.dataset.tab;
  $('#content').innerHTML = `<h1>${btn.textContent}</h1><p>${btn.textContent} feed placeholder.</p>`;
  render();
}));

$$('.navbtn').forEach(btn => btn.addEventListener('click', () => {
  const scr = btn.dataset.screen;
  if (scr === 'wallet') {
    $('#content').innerHTML = `
      <section class="panel"><h2>Wallet</h2>
      <p>This demo wallet only tracks local BuzzCoin for testing gifts.</p>
      <div style="display:flex;gap:12px;margin-top:12px">
        <button id="devPlus" class="tab">Dev +100</button>
        <button id="resetBal" class="tab">Reset balance</button>
      </div></section>`;
    $('#devPlus').onclick = () => { state.balance += 100; render(); };
    $('#resetBal').onclick = () => { state.balance = 0; render(); };
  } else if (scr === 'gifts') {
    $('#content').innerHTML = `
      <section class="panel"><h2>Gifts</h2>
      <p>Gift gallery placeholder. (Animations will go here.)</p>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="tab" id="add1">Send 1</button>
        <button class="tab" id="add10">Send 10</button>
      </div></section>`;
    $('#add1').onclick  = () => { state.balance = Math.max(0, state.balance-1); render(); };
    $('#add10').onclick = () => { state.balance = Math.max(0, state.balance-10); render(); };
  } else if (scr === 'profile') {
    $('#content').innerHTML = `<section class="panel"><h2>Profile</h2><p>Profile placeholder.</p></section>`;
  } else {
    $('#content').innerHTML = `<h1>Feed</h1><p>Following feed placeholder.</p>`;
  }
}));

const soundBtn = $('#soundToggle');
if (soundBtn){
  soundBtn.addEventListener('click', () => {
    state.sound = !state.sound;
    soundBtn.setAttribute('aria-pressed', String(state.sound));
    soundBtn.textContent = state.sound ? '🔈 On' : '🔇 Off';
  });
}

const liveBtn = $('#honeypot');
if (liveBtn){
  liveBtn.addEventListener('click', () => alert('Go Live: coming soon'));
}

render();
