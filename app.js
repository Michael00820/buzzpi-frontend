/* ===================== BuzzPi app.js ===================== */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

function logToPanel(msg){ try{ const el=$("#consolePanel"); if(el) el.textContent += (el.textContent? "\n":"") + msg; }catch{} console.log(msg); }
function formatAbbrev(n){ const num=Number(n||0);
  if(num>=1_000_000_000) return (num/1_000_000_000).toFixed(num%1_000_000_000?1:0)+"b";
  if(num>=1_000_000)     return (num/1_000_000).toFixed(num%1_000_000?1:0)+"m";
  if(num>=1_000)         return (num/1_000).toFixed(num%1_000?1:0)+"k";
  return String(num);
}

const state={ balance:Number(localStorage.getItem("buzzpi.balance")||0),
              soundOn:localStorage.getItem("buzzpi.soundOn")!=="0",
              user:null };

function updateBalance(){ $("#balanceValue").textContent = formatAbbrev(state.balance); }
function setSound(on){ state.soundOn=!!on; localStorage.setItem("buzzpi.soundOn", on?"1":"0");
  const l=$(".sound-label"); if(l) l.textContent = on?"On":"Off"; }
function showPage(id){ $$(".page").forEach(p=>p.classList.toggle("visible", p.id===id));
  $$(".nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.target===id)); }
function attachNav(){ $$(".nav-btn").forEach(b=>b.addEventListener("click", ()=>showPage(b.dataset.target))); showPage("feedPage"); }

document.addEventListener("click", (e)=>{
  const a=e.target.closest("a[href]"); if(!a) return;
  const href=(a.getAttribute("href")||"").trim().toLowerCase();
  if(href==="window.pi"||href==="http://window.pi"||href==="https://window.pi"){ e.preventDefault(); logToPanel('⚠️ Blocked navigation to "window.pi".'); }
});
const isPiBrowser = ()=> typeof window!=="undefined" && !!window.Pi;

async function onIncompletePaymentFound(payment){ logToPanel("🔎 Incomplete payment: "+JSON.stringify(payment)); }

async function doPiLogin(){
  try{
    if(!isPiBrowser()){ logToPanel("⚠️ Open in Pi Browser (Sandbox)."); return; }
    await Pi.init({ version:"2.0", sandbox:true });
    logToPanel("✅ Pi.init complete.");
    const auth = await Pi.authenticate(["username"], onIncompletePaymentFound);
    state.user = auth?.user || null;
    const line=$("#piUserLine"); if(state.user?.username && line) line.textContent=`Signed in as @${state.user.username}`;
    logToPanel("✅ Auth success: " + (state.user?.username||"(none)"));
  }catch(err){ logToPanel("❌ Auth error: " + (err?.message||err)); console.error(err); }
}

function attachDemoControls(){
  $("#devPlus100")?.addEventListener("click", ()=>{ state.balance+=100; localStorage.setItem("buzzpi.balance", String(state.balance)); updateBalance(); });
  $("#resetBalance")?.addEventListener("click", ()=>{ state.balance=0; localStorage.setItem("buzzpi.balance","0"); updateBalance(); });

  const sound=$("#soundToggle"); if(sound){ sound.checked=!!state.soundOn; setSound(sound.checked); sound.addEventListener("change",()=>setSound(sound.checked)); }
  $("#piLoginBtn")?.addEventListener("click", doPiLogin);

  const fab=$("#honeypotFab");
  fab?.addEventListener("click", ()=>{
    fab.animate([{transform:"scale(1)",filter:"brightness(1)"},{transform:"scale(1.06)",filter:"brightness(1.15)"},{transform:"scale(1)",filter:"brightness(1)"}],{duration:420,easing:"ease-out"});
  });
}

document.addEventListener("DOMContentLoaded", ()=>{
  updateBalance();
  attachNav();
  attachDemoControls();
  $$(".tab").forEach(b=>b.addEventListener("click",()=>{ $$(".tab").forEach(x=>x.classList.remove("active")); b.classList.add("active"); }));
  logToPanel(`Console ready… 🔎 window.Pi present: ${isPiBrowser()}`);
});