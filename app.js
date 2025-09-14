// ======= Korlátlan mód + illusztráció + TTS + Könyvtár =======

// ----- Elek -----
const form = document.getElementById("story-form");
const btn = document.getElementById("generate");
const storyEl = document.getElementById("story");
const out = document.getElementById("output");
const copyBtn = document.getElementById("copy");
const saveBtn = document.getElementById("save");
const saveLibBtn = document.getElementById("save-lib");
const withImg = document.getElementById("with-image");
const artWrap = document.getElementById("artwrap");
const artEl = document.getElementById("art");
const artCap = document.getElementById("artcap");
const libList = document.getElementById("lib-list");

// ----- Könyvtár (localStorage) -----
const LIB_KEY = "meseapp_library";
function loadLib(){ try { return JSON.parse(localStorage.getItem(LIB_KEY) || "[]"); } catch { return []; } }
function saveLib(arr){ localStorage.setItem(LIB_KEY, JSON.stringify(arr)); }
function renderLib(){
  const items = loadLib();
  libList.innerHTML = items.length ? "" : `<p class="muted small">Még nincs mentett mese.</p>`;
  for(const it of items){
    const div = document.createElement("div");
    div.className = "card-sm";
    div.innerHTML = `
      ${it.image ? `<img src="${it.image}" alt="Illusztráció">` : ""}
      <h3>${it.title || "Címtelen mese"}</h3>
      <p class="muted small">${new Date(it.date).toLocaleString()}</p>
      <div class="row">
        <button data-id="${it.id}" class="icon-btn" title="Megnyitás">📖</button>
        <button data-del="${it.id}" class="icon-btn" title="Törlés">🗑️</button>
      </div>
    `;
    libList.appendChild(div);
  }
}
renderLib();

libList.addEventListener("click", (e)=>{
  const id = e.target.dataset.id || e.target.getAttribute("data-id");
  const del = e.target.dataset.del || e.target.getAttribute("data-del");
  const items = loadLib();
  if(id){
    const it = items.find(x=>x.id===id);
    if(it){
      storyEl.textContent = it.text;
      out.classList.remove("hidden");
      if(it.image){
        artEl.src = it.image;
        artCap.textContent = it.caption || "";
        artWrap.classList.remove("hidden");
      } else {
        artWrap.classList.add("hidden");
      }
      window.scrollTo({top:0, behavior:"smooth"});
    }
  }
  if(del){
    const next = items.filter(x=>x.id!==del);
    saveLib(next); renderLib();
  }
});

// ----- TTS (Web Speech API) -----
let utterance = null;
function ensureUtterance(text){
  if(!utterance){ utterance = new SpeechSynthesisUtterance(); }
  utterance.text = text;
  utterance.lang = "hu-HU";   // magyar
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
}
document.getElementById("tts-play").addEventListener("click", ()=>{
  const t = storyEl.textContent.trim();
  if(!t) return;
  ensureUtterance(t);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
});
document.getElementById("tts-pause").addEventListener("click", ()=>{
  if(window.speechSynthesis.speaking){ window.speechSynthesis.paused ? window.speechSynthesis.resume() : window.speechSynthesis.pause(); }
});
document.getElementById("tts-stop").addEventListener("click", ()=>{
  window.speechSynthesis.cancel();
});

// ----- Generálás -----
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  btn.disabled = true; btn.textContent = "Generálás…";
  storyEl.textContent = ""; out.classList.add("hidden");
  artWrap.classList.add("hidden"); artEl.removeAttribute("src"); artCap.textContent = "";

  try{
    // 1) Mese
    const r = await fetch("/.netlify/functions/generateStory", {
      method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(data)
    });
    if(!r.ok) throw new Error("Hálózati hiba (story)");
    const j = await r.json();
    const story = j.story || "Hoppá, üres válasz érkezett.";
    storyEl.textContent = story;
    out.classList.remove("hidden");

    // 2) Kép (opcionális)
    if(withImg.checked){
      const prompt = `Meséhez illusztráció: ${data.childName} és a ${data.favoriteAnimal} (${data.theme||"varázslatos erdő"}), gyerekbarát rajz, lágy fények.`;
      artCap.textContent = prompt;
      const ir = await fetch("/.netlify/functions/generateImage", {
        method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ prompt })
      });
      if(ir.ok){
        const ij = await ir.json();
        if(ij.image){
          artEl.src = ij.image;
          artWrap.classList.remove("hidden");
        }
      }
    }
  }catch(err){
    storyEl.textContent = "Hiba történt a generálás közben. Nézd meg a Functions logot Netlifyban.";
    console.error(err);
    out.classList.remove("hidden");
  }finally{
    btn.disabled = false; btn.textContent = "📖 Mesét kérek";
  }
});

// ----- Másolás / Mentés .txt -----
copyBtn.addEventListener("click", async ()=>{
  const t = storyEl.textContent.trim(); if(!t) return;
  await navigator.clipboard.writeText(t);
});
saveBtn.addEventListener("click", ()=>{
  const t = storyEl.textContent.trim(); if(!t) return;
  const blob = new Blob([t],{type:"text/plain"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "mese.txt"; a.click();
  URL.revokeObjectURL(url);
});

// ----- Mentés könyvtárba -----
saveLibBtn.addEventListener("click", ()=>{
  const text = storyEl.textContent.trim(); if(!text) return;
  const firstLine = text.split("\n").find(x=>x.trim()) || "Mese";
  const title = firstLine.replace(/\*/g,"").trim();
  const item = {
    id: crypto.randomUUID(),
    title,
    text,
    date: Date.now(),
    image: artEl?.src || "",
    caption: artCap?.textContent || ""
  };
  const arr = loadLib(); arr.unshift(item); saveLib(arr); renderLib();
});
