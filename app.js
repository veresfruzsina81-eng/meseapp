const DAILY_FREE = 2;
const STORAGE_KEY = "meseapp_quota";

function todayStr(){ return new Date().toISOString().slice(0,10); }

function loadQuota(){
  let q = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  if(q.date !== todayStr()) q = { date: todayStr(), used: 0, unlocked: "none" };
  return q;
}
function saveQuota(q){ localStorage.setItem(STORAGE_KEY, JSON.stringify(q)); }

function quotaText(q){
  if(q.unlocked === "unlimited") return `Korlátlan hozzáférés aktív.`;
  return `Mai mesék: ${q.used}/${DAILY_FREE}`;
}

const form = document.getElementById("story-form");
const btn = document.getElementById("generate");
const storyEl = document.getElementById("story");
const out = document.getElementById("output");
const quotaInfo = document.getElementById("quota-info");
const paywall = document.getElementById("paywall");

let quota = loadQuota();
quotaInfo.textContent = quotaText(quota);

function shouldPaywall(){ return quota.unlocked !== "unlimited" && quota.used >= DAILY_FREE; }
function openPaywall(){ paywall.classList.remove("hidden"); }
function closePaywall(){ paywall.classList.add("hidden"); }

document.addEventListener("click",(e)=>{
  if(e.target.id==="close-paywall" || e.target.dataset.close==="overlay"){ closePaywall(); }
});

document.querySelectorAll("[data-pack]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const pack=btn.dataset.pack;
    quota.unlocked=pack;
    saveQuota(quota);
    quotaInfo.textContent=quotaText(quota);
    alert(`Demo: sikeres vásárlás – csomag: ${pack}`);
    closePaywall();
  });
});

form.addEventListener("submit",async(e)=>{
  e.preventDefault();
  quota=loadQuota();
  if(shouldPaywall()){ openPaywall(); return; }

  const data=Object.fromEntries(new FormData(form).entries());
  btn.disabled=true; btn.textContent="Generálás…";
  storyEl.textContent=""; out.classList.add("hidden");

  try{
    const res=await fetch("/.netlify/functions/generateStory",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify(data)
    });
    const json=await res.json();
    storyEl.textContent=json.story;
    out.classList.remove("hidden");
    if(quota.unlocked!=="unlimited"){ quota.used++; saveQuota(quota); quotaInfo.textContent=quotaText(quota); }
  }catch(err){
    storyEl.textContent="Hiba történt.";
    console.error(err);
  }finally{
    btn.disabled=false; btn.textContent="📖 Mesét kérek";
  }
});

document.getElementById("copy").addEventListener("click",()=>{
  navigator.clipboard.writeText(storyEl.textContent);
});
document.getElementById("save").addEventListener("click",()=>{
  const blob=new Blob([storyEl.textContent],{type:"text/plain"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="mese.txt"; a.click();
  URL.revokeObjectURL(url);
});
