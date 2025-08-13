/* =============== helpers =============== */
const $  = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>[...root.querySelectorAll(sel)];
const safe = (fn)=>{ try{ return fn() }catch(e){ console.debug(e); return null } };

const toastEl = $('#toast');
function toast(msg='Saved', ms=1500){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(()=>toastEl.classList.remove('show'), ms);
}

/* =============== state =============== */
window.buzzBalance = 300;  // demo starting balance
const balanceText = $('#balanceText');
const balancePill = $('#balancePill');

/* compact balance formatting: 1k, 1.1k, 12k, 1.2M ... */
function formatCoinsCompact(n){
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) < 1000) return String(n);
  const units = [
    { sym: 'T', val: 1e12 },
    { sym: 'B', val: 1e9  },
    { sym: 'M', val: 1e6  },
    { sym: 'k', val: 1e3  },
  ];
  for (const u of units){
    if (Math.abs(n) >= u.val){
      const raw = n / u.val;
      const decimals = Math.abs(raw) < 10 ? 1 : 0;
      const factor = decimals ? 10 : 1;
      const floored = (Math.trunc(raw * factor) / factor).toFixed(decimals);
      const clean = decimals ? String(parseFloat(floored)) : floored;
      return clean + u.sym;
    }
  }
  return String(n);
}
let __lastBalanceForPulse = window.buzzBalance;
function renderBalance(){
  if (balanceText){
    balanceText.textContent = formatCoinsCompact(window.buzzBalance || 0);
  }
  if (balancePill){
    balancePill.setAttribute('aria-label', `BuzzCoin balance: ${window.buzzBalance} coins (${formatCoinsCompact(window.buzzBalance)})`);
  }
}
function renderBalanceWithPulse(newVal){
  window.buzzBalance = newVal;
  renderBalance();
  if (balancePill && newVal > __lastBalanceForPulse){
    balancePill.classList.remove('pulse'); void balancePill.offsetWidth; balancePill.classList.add('pulse');
  }
  __lastBalanceForPulse = newVal;
}
renderBalance();

/* =============== top tabs =============== */
const tabs = $('#tabs');
if (tabs){
  tabs.addEventListener('click', (e)=>{
    const chip = e.target.closest('.chip');
    if(!chip) return;
    $$('.chip', tabs).forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');
    toast(chip.textContent.trim(), 900);
  });
}

/* =============== nav / routes =============== */
const content = $('#content');
const navRow = $('#navRow');
if (navRow){
  navRow.addEventListener('click', (e)=>{
    const btn = e.target.closest('.navBtn'); if(!btn) return;
    $$('.navBtn', navRow).forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    route(btn.dataset.view);
  });
}
function route(view='home'){
  if(!content) return;

  if (view==='wallet'){
    content.innerHTML = `
      <section class="card">
        <h2 class="h2">Wallet</h2>
        <p class="subtitle">Demo wallet (BuzzCoin only) for testing gifts.</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px">
          <button class="chip" id="devAdd50">Dev +50</button>
          <button class="chip" id="devUp">Dev +100</button>
          <button class="chip" id="reset">Reset balance</button>
        </div>
      </section>
      <section class="card">
        <h3 class="h2" style="margin:0 0 6px">Earn by watching ads</h3>
        <p class="subtitle">Earn 1 BuzzCoin per ad • Max 5 ads/day • 5s cooldown</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px">
          <button class="chip" id="watchAd">Watch ad (+1)</button>
          <div id="adMeta" class="subtitle"></div>
        </div>
      </section>
    `;
    bindWallet();
  } else if (view==='gifts'){
    content.innerHTML = `
      <section class="card">
        <h2 class="h2">Gifts</h2>
        <p class="subtitle">Tap to send • Long-press for rapid combo • Billionaire gifts have longer, cinematic effects.</p>
        <div class="gift-tabs" id="giftTabs">
          <button class="chip active" data-cat="common">Common</button>
          <button class="chip" data-cat="rare">Rare</button>
          <button class="chip" data-cat="billion">Billionaire</button>
        </div>
        <div class="gift-grid" id="giftGrid"></div>
      </section>
      <section class="card">
        <h3 class="h2">Console</h3>
        <pre id="log" class="subtitle" style="white-space:pre-wrap">Ready.</pre>
      </section>
      <div class="fx-layer" id="fx"></div>
    `;
    renderGifts('common');
  } else if (view==='profile'){
    content.innerHTML = `
      <section class="card">
        <h2 class="h2">Profile</h2>
        <p class="subtitle">Placeholder — will wire to real accounts later.</p>
      </section>`;
  } else {
    content.innerHTML = `
      <section class="card">
        <h2 class="h2">Feed</h2>
        <p class="subtitle">Following feed placeholder.</p>
      </section>`;
  }
  window.scrollTo({top:0,behavior:'smooth'});
}

/* =============== honeypot (mock) =============== */
safe(()=>$('#honeypot').addEventListener('click', ()=> toast('Start Live (demo)')));

/* =============== sound toggle (auto-hide) =============== */
const soundBtn = $('#soundBtn'); let soundOn = true;
function refreshSoundBtn(){ if (soundBtn) soundBtn.textContent = soundOn ? '🔊 On' : '🔈 Off'; }
if (soundBtn){
  soundBtn.addEventListener('click', ()=>{ soundOn = !soundOn; refreshSoundBtn(); toast(soundOn?'Sound on':'Sound off'); });
  setTimeout(()=>soundBtn.classList.remove('hide'), 300);
  setTimeout(()=>soundBtn.classList.add('hide'), 3500);
  ['pointermove','pointerdown','keydown','visibilitychange'].forEach(evt=>{
    window.addEventListener(evt, ()=>{ soundBtn.classList.remove('hide'); clearTimeout(soundBtn._h); soundBtn._h=setTimeout(()=>soundBtn.classList.add('hide'), 2200); });
  });
}
refreshSoundBtn();

/* =============== SFX micro-engine =============== */
const SFX = (() => {
  let enabled = true;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
  function resume(){ if (ctx.state==='suspended') ctx.resume(); }
  window.addEventListener('pointerdown', ()=>resume(), {once:true});
  function chain(g=0.22){ const k=ctx.createGain(); k.gain.value=g; k.connect(master); return k; }
  function tone(f,d,type='sine',g=0.22){ if(!enabled) return; resume(); const t=ctx.currentTime,o=ctx.createOscillator(),gn=chain(g); o.type=type;o.frequency.setValueAtTime(f,t);o.connect(gn);o.start(t);o.stop(t+d); }
  function noise(d,kind='white',g=0.22,bp=null){
    if(!enabled) return; resume();
    const len=ctx.sampleRate*d, b=ctx.createBuffer(1,len,ctx.sampleRate), a=b.getChannelData(0);
    for(let i=0;i<len;i++){ const r=Math.random()*2-1; a[i]= kind==='brown'?((a[i-1]||0)+0.02*r)/1.02 : kind==='pink'?((a[i-1]||0)*0.98+0.02*r) : r; }
    const src=ctx.createBufferSource(); src.buffer=b; const out=chain(g);
    if(bp){ const f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=bp; src.connect(f).connect(out); } else src.connect(out);
    src.start(); src.stop(ctx.currentTime+d);
  }
  return {
    enable(v){ enabled = !!v },
    pop(){ tone(520,0.05); tone(260,0.07,'sine',0.16); },
    sparkle(){ [1800,2200,2600].forEach((f,i)=>setTimeout(()=>tone(f,0.08,'sine',0.18),i*80)); },
    coins(){ [1200,1500,1800].forEach((f,i)=>setTimeout(()=>tone(f/2,0.12,'triangle',0.25), i*60)); },
    whoosh(){ noise(0.5,'white',0.35,800); },
    impact(){ tone(80,0.12,'sine',0.45); noise(0.14,'brown',0.3,160); },
    choir(){ [440,554,659].forEach((f,i)=>setTimeout(()=>tone(f,0.6,'sine',0.12), i*80)); },
    rumble(ms=800){ noise(ms/1000,'brown',0.25,90); },
    jet(){ noise(0.9,'pink',0.35,400); },
    engineRev(){ tone(120,0.4,'sawtooth',0.22); noise(0.3,'brown',0.25,120); },
    twinkle(){ [1800,2200,2600].forEach((f,i)=>setTimeout(()=>tone(f,0.08,'sine',0.18), i*80)); },
    chime(){ [1200,1800,2400].forEach((f,i)=>setTimeout(()=>tone(f,0.18,'triangle',0.22), i*90)); },
    cheers(){ [1800,2400].forEach((f,i)=>setTimeout(()=>tone(f,0.10,'triangle',0.26), i*90)); },
    pour(){ noise(0.55,'pink',0.14,900); },
    fizz(){ noise(0.55,'white',0.18,2200); },
    thunder(){ noise(1.2,'brown',0.35,70); tone(60,0.35,'sine',0.22); },
    wind(){ noise(0.8,'pink',0.16,400); },
    kiss(){ tone(1500,0.12,'sine',0.22); noise(0.10,'white',0.08,2800); },
    clap2(){ for(let i=0;i<3;i++) setTimeout(()=>noise(0.07,'white',0.35,1200), i*120); },
    cheers2(){ [1400,1700,2000].forEach((f,i)=>setTimeout(()=>tone(f,0.08,'triangle',0.2), i*70)); }
  };
})();

/* =============== Gifts catalog (ALL items) =============== */
const CATALOG = {
  common: [
    {id:'party', emo:'🥳', name:'Party', price:1},
    {id:'hearts', emo:'🥰', name:'Hearts', price:1},
    {id:'love', emo:'😍', name:'Love', price:1},
    {id:'yum', emo:'😋', name:'Yum', price:1},
    {id:'hug', emo:'🤗', name:'Hug', price:1},
    {id:'starry', emo:'🤩', name:'Starry', price:1},
    {id:'rich', emo:'🤑', name:'Making it', price:1},
    {id:'lolly', emo:'🍭', name:'Lolly', price:2},
    {id:'candy', emo:'🍬', name:'Candy', price:2},
    {id:'choc', emo:'🍫', name:'Choco', price:2},
    {id:'martini', emo:'🍸', name:'Martini', price:5},
    {id:'apple', emo:'🍎', name:'Apple', price:5},
    {id:'beer', emo:'🍺', name:'Beer', price:5},
    {id:'rose', emo:'🌹', name:'Rose', price:10},
    {id:'sakura', emo:'🌸', name:'Sakura', price:10},
    {id:'sparkle', emo:'✨️', name:'Sparkles', price:10},
    {id:'bouquet', emo:'💐', name:'Bouquet', price:20},
    {id:'cheers', emo:'🍻', name:'Cheers', price:20},
    {id:'clap', emo:'👏', name:'Clap', price:20},
    {id:'kiss', emo:'💋', name:'Kiss', price:20},
  ],
  rare: [
    {id:'butterfly', emo:'🦋', name:'Butterfly', price:50},
    {id:'storm', emo:'🌩', name:'Storm', price:50},
    {id:'sun', emo:'🌤', name:'Sunbeam', price:50},
    {id:'rainbow', emo:'🌈', name:'Rainbow', price:50},
    {id:'snow', emo:'❄️', name:'Snow', price:50},
    {id:'teddy', emo:'🧸', name:'Teddy', price:100},
    {id:'bunny', emo:'🐇', name:'Bunny', price:100},
    {id:'champ', emo:'🍾', name:'Champagne', price:100},
    {id:'crown', emo:'👑', name:'Crown', price:100},
    {id:'wine', emo:'🍷', name:'Wine', price:100},
    {id:'flutes', emo:'🥂', name:'Flutes', price:100},
    {id:'jadeLambo', emo:'🚗', name:'Jade Lamborghini', price:500},
    {id:'crystalPlane', emo:'✈️', name:'Crystal Aeroplane', price:500},
    {id:'goldHummer', emo:'🚙', name:'Golden Hummer', price:500},
    {id:'yacht', emo:'🛥️', name:'Yacht', price:500},
  ],
  billion: [
    {id:'phoenix', emo:'🔥', name:'Fiery Phoenix', price:1000},
    {id:'unicorn', emo:'🦄', name:'Racing Unicorn', price:1000},
    {id:'castle', emo:'🏰', name:'Crystal Castle', price:1000},
    {id:'treasure', emo:'💰', name:'Pirate Chest', price:1000},
    {id:'skyMansion', emo:'🏙️', name:'Mansion in the Sky', price:5000},
    {id:'mermaid', emo:'🧜‍♀️', name:'Mermaid', price:5000},
    {id:'cupids', emo:'💘', name:'Cupids', price:5000},
    {id:'elfQueen', emo:'🧝‍♀️', name:'Elf Queen', price:5000},
    {id:'goldJet', emo:'🛩️', name:'Golden Private Jet', price:10000},
    {id:'rolex', emo:'⌚', name:'Diamond Rolex', price:10000},
    {id:'chariots', emo:'🐎', name:'Chariots of Horses', price:10000}
  ]
};

/* =============== Gift rendering + interactions =============== */
function renderGifts(cat='common'){
  const grid = $('#giftGrid'); if(!grid) return;
  const tabs = $('#giftTabs');
  if (tabs){
    tabs.addEventListener('click', (e)=>{
      const chip = e.target.closest('.chip'); if(!chip) return;
      $$('.chip', tabs).forEach(c=>c.classList.remove('active'));
      chip.classList.add('active'); renderGifts(chip.dataset.cat);
    }, {once:true});
  }

  const list = CATALOG[cat];
  grid.innerHTML = list.map(g=>`
    <div class="gift" data-id="${g.id}" data-price="${g.price}" data-cat="${cat}">
      <div class="emo">${g.emo}</div>
      <div class="name">${g.name}</div>
      <div class="price">${g.price}</div>
    </div>`).join('');

  // interactions: tap + long-press combo
  $$('.gift', grid).forEach(d=>{
    let pressT, holdT;
    d.addEventListener('click', ()=>{
      $$('.gift', grid).forEach(x=>x.classList.remove('selected'));
      d.classList.add('selected');
      const id = d.dataset.id;
      const g = [...CATALOG.common, ...CATALOG.rare, ...CATALOG.billion].find(x=>x.id===id);
      sendGift(g);
    });
    d.addEventListener('pointerdown', ()=>{
      pressT=setTimeout(()=>{ holdT=setInterval(()=>{
        const id = d.dataset.id;
        const g = [...CATALOG.common, ...CATALOG.rare, ...CATALOG.billion].find(x=>x.id===id);
        sendGift(g,true);
      }, 280); }, 350);
    });
    const stopHold=()=>{ clearTimeout(pressT); if(holdT){ clearInterval(holdT); holdT=null; } };
    d.addEventListener('pointerup',stopHold); d.addEventListener('pointerleave',stopHold); d.addEventListener('pointercancel',stopHold);
  });
}

/* =============== Wallet panel: dev + ads earn =============== */
function todayKey(){ const d=new Date(); return `ad-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function loadAdState(){ const k=todayKey(); return JSON.parse(localStorage.getItem(k)||'{"count":0,"last":0}'); }
function saveAdState(st){ const k=todayKey(); localStorage.setItem(k, JSON.stringify(st)); }
function bindWallet(){
  safe(()=>$('#devAdd50').addEventListener('click', ()=> renderBalanceWithPulse(window.buzzBalance + 50)));
  safe(()=>$('#devUp').addEventListener('click', ()=> renderBalanceWithPulse(window.buzzBalance + 100)));
  safe(()=>$('#reset').addEventListener('click', ()=>{ window.buzzBalance = 0; renderBalance(); toast('Balance reset'); }));

  const adBtn = $('#watchAd'); const meta = $('#adMeta');
  if (adBtn){
    let st = loadAdState();
    const redraw=()=> meta && (meta.textContent = `Used ${st.count}/5 today`);
    redraw();
    adBtn.addEventListener('click', ()=>{
      const now = Date.now()/1000;
      if (st.count>=5){ toast("Daily ad limit reached (5).", 1400); return; }
      if (now - st.last < 5){ toast(`Please wait ${Math.ceil(5-(now-st.last))}s…`, 1200); return; }
      toast("Playing ad… (+1)", 1000);
      st.last = now; st.count++; saveAdState(st); redraw();
      setTimeout(()=> renderBalanceWithPulse(window.buzzBalance + 1), 450);
    });
  }
}

/* =============== Spend / Send =============== */
function spend(n){
  if (window.buzzBalance < n){ toast('Not enough BuzzCoin'); return false; }
  renderBalanceWithPulse(window.buzzBalance - n);
  return true;
}
function logLine(...a){ const L=$('#log'); if(L){ L.textContent = a.join(' '); L.scrollTop=L.scrollHeight; } }
function sendGift(g, combo=false){
  if (!g) return;
  if (!spend(g.price)) return;
  animateGift(g, combo);
  logLine(`Sent ${g.name} (−${g.price}). Balance ${window.buzzBalance}.`);
  // brief re-show sound button
  if (soundBtn){ soundBtn.classList.remove('hide'); clearTimeout(soundBtn._h); soundBtn._h=setTimeout(()=>soundBtn.classList.add('hide'), 1800); }
}

/* =============== FX primitives =============== */
function ensureFx(){ let f=$('#fx'); if(!f){ f=document.createElement('div'); f.id='fx'; f.className='fx-layer'; document.body.appendChild(f); } return f; }
function addFx(html, opts={}){
  const fx = ensureFx();
  const n=document.createElement('div'); n.className='fx-item'; n.innerHTML=html;
  if(opts.style) Object.assign(n.style, opts.style);
  fx.appendChild(n);
  setTimeout(()=>n.remove(), (opts.ms??5000));
  return n;
}
function lensTint(color='rgba(255,180,80,.25)', ms=800){
  const fx = ensureFx();
  const n=document.createElement('div'); n.style.cssText=`position:absolute;inset:0;background:${color};mix-blend-mode:screen;opacity:.0`;
  fx.appendChild(n);
  n.animate([{opacity:0},{opacity:1},{opacity:0}], {duration:ms, easing:'ease-in-out'}).onfinish=()=>n.remove();
}
function confetti(ms=1200){
  const fx = ensureFx();
  for(let i=0;i<30;i++){
    const s=document.createElement('div'); s.style.cssText=`position:absolute;left:${Math.random()*100}%;top:-10vh;width:6px;height:10px;background:hsl(${Math.random()*360} 90% 60%);animation:confettiFall ${ms}ms linear forwards;`;
    fx.appendChild(s); setTimeout(()=>s.remove(), ms+200);
  }
}

/* =============== Phoenix loader + interpreter =============== */
const VERSION = 2;
const EFFECT_CACHE = {};
async function loadEffectJson(name){
  if (EFFECT_CACHE[name]) return EFFECT_CACHE[name];
  try{
    const r = await fetch(`/public/effects/${name}.json?v=${VERSION}`);
    if(!r.ok) throw 0;
    const j = await r.json(); EFFECT_CACHE[name]=j; return j;
  }catch(e){
    const tag = document.getElementById('phoenix-config');
    return tag ? JSON.parse(tag.textContent) : null;
  }
}
function runPhoenix(script){
  if (!script) return;
  const beats = script.beats || []; const timers=[];
  const at=(ms,fn)=>timers.push(setTimeout(fn,ms));
  function doActions(list){
    list.forEach(a=>{
      if (a.startsWith('sfx:')){
        const k=a.slice(4);
        if (k==='whoosh_in') SFX.whoosh();
        else if (k==='impact') SFX.impact();
        else if (k==='choir_hit') SFX.choir();
        else if (k==='rumble_in') SFX.rumble(900);
        return;
      }
      if (a==='ignite_sigil') lensTint('rgba(255,150,80,.20)', 700);
      else if (a==='particles:sparks_burst'){
        for(let i=0;i<40;i++){
          const s=addFx(`<div style="width:7px;height:7px;border-radius:50%;background:radial-gradient(circle,#ffd,#f80)"></div>`,{ms:900});
          s.animate([{transform:'translate(0,0)',opacity:1},{transform:`translate(${(Math.random()*2-1)*180}px,${(Math.random()*-1)*140}px)`,opacity:0}],{duration:900});
        }
      }
      else if (a.startsWith('phoenix:') && a.includes('enter')){
        const p=addFx(`<div style="font-size:120px;filter:drop-shadow(0 20px 30px rgba(0,0,0,.5))">🦅</div>`, {ms:script.duration});
        p.animate([{transform:'translate(-60vw,30vh) scale(.8) rotate(-8deg)'},
                   {transform:'translate(0,0) scale(1) rotate(0deg)'},
                   {transform:'translate(60vw,-20vh) scale(1.05) rotate(6deg)'}],
                  {duration:4200,easing:'ease-in-out'});
      }
      else if (a==='phoenix:crown_form'){
        const crown=addFx(`<div style="font-size:72px">👑</div>`, {ms:1500});
        crown.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-90%) scale(1.2)',opacity:1},{opacity:0}],{duration:1400});
      }
      else if (a==='embers:tail'){
        for(let i=0;i<30;i++){
          const e=addFx(`<div style="width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#ffb,#f60)"></div>`, {ms:1200});
          e.animate([{transform:'translate(0,0)',opacity:.9},{transform:`translate(${(Math.random()*2-1)*140}px, ${40+Math.random()*120}px)`,opacity:0}],{duration:1100,delay:i*20});
        }
      }
    });
  }
  beats.forEach(b=>at(b.t,()=>doActions(b.actions||[])));
  at(script.duration||8000, ()=>timers.forEach(clearTimeout));
}

/* =============== SFX mapping (common/rare) =============== */
function sfxForGift(g){
  const e = g.emo, p = g.price || 1;
  if (p === 1){ if (e==='🥳') return SFX.pop(); if (e==='😋') return (SFX.pop(),SFX.sparkle()); if (e==='🥰'||e==='😍') return SFX.sparkle(); if (e==='🤗') return SFX.pop(); if (e==='🤩') return SFX.sparkle(); if (e==='🤑') return SFX.coins(); return SFX.pop(); }
  if (p === 2){ if (['🍭','🍬','🍫'].includes(e)) return (SFX.pop(),SFX.chime()); return SFX.pop(); }
  if (p === 5){ if (e==='🍸') return (SFX.pour(),SFX.chime()); if (e==='🍺') return SFX.pour(); if (e==='🍎') return SFX.pop(); return SFX.pop(); }
  if (p === 10){ if (['🌹','🌸','✨️','✨'].includes(e)) return (SFX.chime(),SFX.sparkle()); return SFX.chime(); }
  if (p === 20){ if (e==='💐') return (SFX.chime(),SFX.sparkle()); if (e==='🍻') return (SFX.cheers(),SFX.fizz()); if (e==='👏') return SFX.clap2(); if (e==='💋') return SFX.kiss(); return SFX.chime(); }
  if (p === 50){ if (e==='🦋') return SFX.twinkle(); if (e==='🌩') return SFX.thunder(); if (e==='🌤') return SFX.wind(); if (e==='🌈') return SFX.twinkle(); if (e==='❄️') return SFX.snow?.() ?? SFX.twinkle(); return SFX.twinkle(); }
  if (p === 100){ if (e==='🧸') return SFX.pop(); if (e==='🐇') return SFX.whoosh(); if (e==='🍾') return (SFX.impact(),SFX.fizz()); if (e==='👑') return SFX.chime(); if (e==='🍷'||e==='🥂') return (SFX.pour(),SFX.cheers()); return SFX.chime(); }
  if (p === 500){ if (g.id?.includes('Hummer')||e==='🚙') return SFX.engineRev(); if (g.id?.includes('Lambo')||e==='🚗') return SFX.engineRev(); if (g.id?.includes('Plane')||e==='✈️') return SFX.jet(); if (g.id?.includes('yacht')||e==='🛥️') return (SFX.wind(),SFX.whoosh()); return SFX.whoosh(); }
}

/* =============== All animations (including billionaire set) =============== */
function animateGift(g, combo){
  if ((g.price||1) < 1000) sfxForGift(g); // subtle SFX for smaller gifts

  const dur =
    g.price >= 10000 ? 9000 :
    g.price >= 5000  ? 8500 :
    g.price >= 1000  ? 8000 :
    g.price >= 500   ? 6000 : 5000;

  const heavy = g.price >= 1000;

  switch(g.id){
    /* ------ Common ------ */
    case 'party': {
      confetti(1600);
      const face = addFx(`<div style="font-size:72px">🥳</div>`, {ms:1600});
      face.animate(
        [{transform:'translate(-50%,-50%) scale(1)'},
         {transform:'translate(-50%,-48%) scale(1.15)'},
         {transform:'translate(-50%,-50%) scale(1)'}],
        {duration:1400,easing:'ease-in-out'}
      ); break;
    }
    case 'hearts':
    case 'love':
    case 'hug':
    case 'starry':
    case 'rich':
    case 'lolly':
    case 'candy':
    case 'choc':
    case 'martini':
    case 'apple':
    case 'beer':
    case 'rose':
    case 'sakura':
    case 'sparkle':
    case 'bouquet':
    case 'cheers':
    case 'clap':
    case 'kiss': {
      const n=addFx(`<div style="font-size:${heavy?96:64}px">${g.emo}</div>`, {ms:dur});
      n.animate([{transform:'translate(-50%,-40%) scale(.9)'},
                 {transform:'translate(-50%,-50%) scale(1.2)'},
                 {transform:'translate(-50%,-55%) scale(1)'}],
                {duration:1400,easing:'ease-in-out'});
      break;
    }
    case 'yum': {
      const n=addFx(`<div style="font-size:84px">😋</div>`, {ms:1500});
      n.animate(
        [{transform:'translate(-50%,-50%)'},
         {transform:'translate(-50%,-53%)'},
         {transform:'translate(-50%,-50%)'}],
        {duration:1200,easing:'ease-in-out'}
      ); break;
    }

    /* ------ Rare ------ */
    case 'butterfly': {
      const n=addFx(`<div style="font-size:70px">🦋</div>`, {ms:dur});
      n.style.animation='flutter 5200ms ease-in-out forwards';
      const glow=addFx(`<div style="width:220px;height:220px;border-radius:50%;box-shadow:0 0 60px 10px rgba(147,197,253,.35) inset"></div>`, {ms:1200,style:{opacity:.6}});
      glow.animate(
        [{opacity:0,transform:'translate(-50%,-50%) scale(.6)'},
         {opacity:.6,transform:'translate(-50%,-50%) scale(1)'},
         {opacity:0,transform:'translate(-50%,-50%) scale(1.2)'}],
        {duration:1200}
      ); break;
    }
    case 'storm': {
      lensTint('rgba(120,140,255,.1)', 1000); SFX.thunder();
      break;
    }
    case 'sun': { lensTint('rgba(255,245,200,.15)', 1000); SFX.wind(); break; }
    case 'rainbow': { SFX.twinkle(); break; }
    case 'snow': { SFX.twinkle(); break; }
    case 'teddy': { SFX.pop(); break; }
    case 'bunny': { SFX.whoosh(); break; }
    case 'champ': { SFX.impact(); SFX.fizz(); break; }
    case 'crown': { SFX.chime(); break; }
    case 'wine':
    case 'flutes': { SFX.pour(); SFX.cheers(); break; }
    case 'jadeLambo': {
      const car=addFx(`<div style="font-size:72px">🚗</div>`, {ms:dur,style:{bottom:'12%',left:'-10%'}});
      car.style.top='auto'; car.style.transform='translate(0,0)'; SFX.engineRev();
      car.animate(
        [{transform:'translate(-10vw,0) rotate(-8deg)'},
         {transform:'translate(40vw,-2vh) rotate(2deg)'},
         {transform:'translate(110vw,1.5vh) rotate(3deg)'}],
        {duration:5200,easing:'cubic-bezier(.25,.8,.2,1)'}
      );
      break;
    }
    case 'crystalPlane': {
      const p=addFx(`<div style="font-size:72px">✈️</div>`, {ms:dur,style:{left:'-10%'}});
      SFX.jet();
      p.animate([{transform:'translate(-10vw,0)'},{transform:'translate(120vw,-12vh)'}],{duration:4800});
      break;
    }
    case 'goldHummer': {
      const car=addFx(`<div style="font-size:72px">🚙</div>`, {ms:dur,style:{bottom:'12%',left:'-10%'}});
      car.style.top='auto'; SFX.engineRev();
      car.animate(
        [{transform:'translate(-10vw,0) rotate(-8deg)'},
         {transform:'translate(40vw,-2vh) rotate(2deg)'},
         {transform:'translate(120vw,2vh) rotate(3deg)'}],
        {duration:5200}
      ); break;
    }
    case 'yacht': {
      const y=addFx(`<div style="font-size:80px">🛥️</div>`, {ms:dur,style:{left:'-10%'}});
      SFX.wind(); y.animate([{transform:'translate(-10vw,0)'},{transform:'translate(120vw,-4vh)'}],{duration:5600}); break;
    }

    /* ------ Billionaire ------ */
    case 'phoenix': { loadEffectJson('phoenix_rebirth').then(runPhoenix); break; }

    case 'unicorn': {
      lensTint('rgba(255,255,255,.18)', 1600);
      const n=addFx(`<div style="font-size:100px">🦄</div>`, {ms:dur});
      SFX.whoosh(); SFX.twinkle();
      n.animate(
        [{transform:'translate(-60vw,30vh) scale(1.2) rotate(-12deg)'},
         {transform:'translate(0,0) scale(1) rotate(0deg)'},
         {transform:'translate(60vw,-20vh) scale(1.1) rotate(6deg)'}],
        {duration:6200,easing:'ease-in-out'}
      );
      for(let i=0;i<40;i++){
        const s=addFx(`<div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.9)"></div>`, {ms:2000});
        s.animate(
          [{transform:`translate(${-300+Math.random()*100}px, ${120-Math.random()*40}px)`,opacity:0},
           {transform:'translate(0,0)',opacity:1},
           {transform:`translate(${200+Math.random()*120}px, ${-120+Math.random()*40}px)`,opacity:0}],
          {duration:1800,delay:i*40}
        );
      } break;
    }

    case 'castle': {
      lensTint('rgba(120,160,255,.18)', 1200);
      const mist=addFx(`<div style="width:120vw;height:30vh;background:radial-gradient(60% 40% at 50% 50%, rgba(180,200,255,.25), transparent 70%);"></div>`,
                       {ms:2200,style:{bottom:'-6%',left:'50%'}});
      mist.style.top='auto';
      const c=addFx(`<div style="font-size:110px">🏰</div>`, {ms:dur});
      c.animate([{transform:'translate(-50%,30vh) scale(.85)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:1600,easing:'ease-out'});
      setTimeout(()=>SFX.choir(), 1600);
      for(let i=0;i<20;i++){
        const g=addFx(`<div style="width:8px;height:8px;border-radius:2px;background:linear-gradient(45deg,#fff,#9cf)"></div>`,{ms:1400});
        g.animate([{transform:`translate(${(Math.random()*2-1)*60}px, ${(Math.random()*2-1)*60}px) scale(.6)`,opacity:.0},
                   {transform:`translate(${(Math.random()*2-1)*30}px, ${(Math.random()*2-1)*30}px) scale(1.2)`,opacity:1},
                   {opacity:0}],{duration:1200,delay:i*60});
      } break;
    }

    case 'treasure': {
      const chest=addFx(`<div style="width:180px;height:110px;border-radius:12px;background:linear-gradient(#6d3b10,#3c2309);border:3px solid #d2a04d;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0 0 auto 0;height:60px;background:linear-gradient(#8a4e12,#5a310c);border-bottom:3px solid #d2a04d;transform-origin:bottom center"></div>
      </div>`, {ms:dur});
      const lid = chest.firstElementChild;
      setTimeout(()=>SFX.impact(), 500);
      lid.animate([{transform:'rotate(0deg)'},{transform:'rotate(-75deg)'}],{duration:700,delay:600,easing:'cubic-bezier(.2,.9,.2,1)'});
      setTimeout(()=>{
        SFX.coins();
        for(let i=0;i<80;i++){
          const coin=addFx(`<div style="width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#fff,#ffd166 60%,#c88a00);"></div>`,{ms:1600});
          coin.animate(
            [{transform:'translate(0,0) scale(.8)',opacity:1},
             {transform:`translate(${(Math.random()*2-1)*200}px, ${-80-Math.random()*120}px) scale(1.1)`,opacity:.9},
             {transform:`translate(${(Math.random()*2-1)*240}px, ${120+Math.random()*80}px) scale(1.1)`,opacity:0}],
            {duration:1500,delay:i*12}
          );
        }
        lensTint('rgba(255,220,120,.28)',800);
      },800); break;
    }

    case 'skyMansion': {
      for(let i=0;i<6;i++){
        const size=180+Math.random()*160, y=20+Math.random()*40, t=5000+Math.random()*2000;
        const cloud=addFx(`<div style="width:${size}px;height:${size*0.55}px;border-radius:9999px;background:radial-gradient(60% 60% at 40% 40%, #fff, #dfe7ff);filter:blur(1px)"></div>`,
                          {ms:dur,style:{top:`${y}%`,left:`${-20 - Math.random()*20}%`,opacity:.85}});
        cloud.animate([{transform:'translateX(0)'},{transform:'translateX(140vw)'}],{duration:t,easing:'linear'});
      }
      for(let i=0;i<5;i++){
        const beam=addFx(`<div style="width:14px;height:60vh;background:linear-gradient(#ffd166 20%, transparent);opacity:.25"></div>`,
                          {ms:2400,style:{top:'-10%',left:`${30+i*8}%`}});
        beam.animate([{opacity:0},{opacity:.35},{opacity:0}],{duration:2400,delay:i*180});
      }
      const m=addFx(`<div style="font-size:100px">🏙️</div>`, {ms:dur});
      m.animate([{transform:'translate(-50%,40vh) scale(.9)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:1800,easing:'ease-out'});
      break;
    }

    case 'mermaid': {
      const mer=addFx(`<div style="font-size:100px">🧜‍♀️</div>`, {ms:dur});
      mer.animate(
        [{transform:'translate(-80vw,10vh) rotate(-6deg)'},
         {transform:'translate(0,0) rotate(0deg)'},
         {transform:'translate(70vw,-6vh) rotate(6deg)'}],
        {duration:6200,easing:'ease-in-out'}
      );
      for(let i=0;i<40;i++){
        const b=addFx(`<div style="width:10px;height:10px;border:1px solid #aef; border-radius:50%"></div>`, {ms:1800});
        b.animate(
          [{transform:`translate(${(Math.random()*2-1)*140}px, ${60+Math.random()*40}px)`,opacity:.0},
           {transform:'translate(0,0)',opacity:.9},
           {transform:`translate(${(Math.random()*2-1)*80}px, ${-120+Math.random()*60}px)`,opacity:0}],
          {duration:1800,delay:i*60}
        );
      } break;
    }

    case 'cupids': {
      SFX.twinkle();
      for(let i=0;i<50;i++){
        const h=addFx(`<div style="font-size:28px">💘</div>`, {ms:2200});
        h.animate([{transform:`translate(${ -60 + Math.random()*120 }vw,-60vh) rotate(-20deg)`,opacity:.0},
                   {transform:`translate(${ -20 + Math.random()*40 }vw,20vh) rotate(0deg)`,opacity:1},
                   {transform:`translate(${ 60 + Math.random()*40 }vw,60vh) rotate(15deg)`,opacity:0}],
                  {duration:2000,delay:i*40,easing:'linear'});
      } break;
    }

    case 'elfQueen': {
      lensTint('rgba(180,140,255,.20)', 1200);
      const q=addFx(`<div style="font-size:100px">🧝‍♀️</div>`, {ms:dur});
      q.animate([{transform:'translate(-50%,30vh) scale(.9)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:1400,easing:'ease-out'});
      const crown=addFx(`<div style="font-size:64px">👑</div>`, {ms:2000,style:{top:'40%'}});
      SFX.chime();
      crown.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-90%) scale(1.2)',opacity:1},{transform:'translate(-50%,-110%) scale(1)',opacity:0}],{duration:1800});
      for(let i=0;i<30;i++){
        const s=addFx(`<div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>`,{ms:1600});
        s.animate([{transform:`translate(${(Math.random()*2-1)*120}px, ${(Math.random()*2-1)*120}px) scale(.6)`,opacity:0},
                   {transform:'translate(0,0) scale(1.4)',opacity:1},
                   {opacity:0}],{duration:1500,delay:i*40});
      } break;
    }

    case 'goldJet': {
      const jet=addFx(`<div style="font-size:96px">🛩️</div>`, {ms:dur,style:{left:'-20%'}});
      SFX.jet();
      jet.animate([{transform:'translate(-10vw,0) scale(.9)'},
                   {transform:'translate(40vw,-10vh) scale(1)'},
                   {transform:'translate(120vw,-18vh) scale(1.05)'}],
                  {duration:4200,easing:'cubic-bezier(.4,.8,.2,1)'});
      setTimeout(()=>{
        const ring=addFx(`<div style="width:12px;height:12px;border:4px solid rgba(255,255,255,.7);border-radius:9999px"></div>`, {ms:900});
        ring.animate([{transform:'translate(-50%,-50%) scale(.2)',opacity:1},{transform:'translate(-50%,-50%) scale(10)',opacity:0}],{duration:900});
      },900);
      lensTint('rgba(255,220,120,.2)', 900);
      break;
    }

    case 'rolex': {
      const w=addFx(`<div style="font-size:110px">⌚</div>`, {ms:dur});
      w.animate([{transform:'translate(-50%,-50%) rotate(0deg)'},
                 {transform:'translate(-50%,-50%) rotate(360deg)'}],
                {duration:2600,easing:'linear',iterations:3});
      for(let i=0;i<3;i++){
        const g=addFx(`<div style="width:220px;height:40px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent);transform:skewY(-20deg)"></div>`,{ms:1200});
        g.animate([{transform:'translate(-70%,-50%)'},{transform:'translate(20%,-50%)'}],{duration:1200,delay:i*600});
      }
      for(let i=0;i<24;i++){
        const sp=addFx(`<div style="width:6px;height:6px;border-radius:50%;background:#fff"></div>`,{ms:1200});
        const a=i*(360/24), r=80;
        sp.animate([{transform:`translate(${r*Math.cos(a*Math.PI/180)}px, ${r*Math.sin(a*Math.PI/180)}px) scale(.6)`,opacity:0},
                    {transform:'translate(0,0) scale(1.4)',opacity:1},
                    {opacity:0}],{duration:1000,delay:i*40});
      } break;
    }

    case 'chariots': {
      const herd = ['🐎','🐎','🐎','🐎']; SFX.gallop?.();
      herd.forEach((h,i)=>{
        const horse=addFx(`<div style="font-size:${i<2?84:72}px">${h}</div>`, {ms:dur,style:{left:'-10%'}});
        horse.animate([{transform:`translate(${-120 - i*20}vw, ${i%2?6:-6}vh)`},
                       {transform:`translate(60vw, ${i%2?-2:2}vh)`},
                       {transform:`translate(130vw, ${i%2?0:4}vh)`}],
                      {duration:5200 + i*200,easing:'cubic-bezier(.4,.8,.2,1)'});
      });
      for(let i=0;i<30;i++){
        const d=addFx(`<div style="width:20px;height:20px;border-radius:50%;background:radial-gradient(circle,#fff5,transparent 60%)"></div>`,{ms:1400,style:{bottom:'8%'}});
        d.style.top='auto';
        d.animate([{transform:`translate(${Math.random()*80-40}px,0)`,opacity:.7},{transform:`translate(${Math.random()*120-60}px,-40px)`,opacity:0}],{duration:1200,delay:i*60});
      } break;
    }

    default: {
      const n=addFx(`<div style="font-size:${heavy?96:g.price>=500?84:64}px">${g.emo}</div>`, {ms:dur});
      n.animate([{transform:'translate(-50%,-40%) scale(.9)'},
                 {transform:'translate(-50%,-50%) scale(1.2)'},
                 {transform:'translate(-50%,-55%) scale(1)'}],
                {duration:1400,easing:'ease-in-out'});
      for(let i=0;i<10;i++){
        const star=addFx(`<div style="width:8px;height:8px;border-radius:50%;background:#fff"></div>`, {ms:1200});
        star.animate([{transform:`translate(${(Math.random()*2-1)*80}px, ${(Math.random()*2-1)*60}px)`,opacity:1},
                      {transform:`translate(${(Math.random()*2-1)*140}px, ${(Math.random()*2-1)*120}px)`,opacity:0}],
                     {duration:1000,delay:i*60});
      }
    }
  }
}

/* =============== Start: default route =============== */
route('home');