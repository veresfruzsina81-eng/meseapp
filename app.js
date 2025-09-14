// ======= INGYENES MÓD: nincs limit, nincs paywall =======
const STORAGE_KEY = "meseapp_quota"; // csak azért, hogy kiürítsük induláskor

// töröljük az esetleges korábbi limitet
try { localStorage.removeItem(STORAGE_KEY); } catch {}

const form = document.getElementById("story-form");
const btn = document.getElementById("generate");
const storyEl = document.getElementById("story");
const out = document.getElementById("output");
const quotaInfo = document.getElementById("quota-info");

// infócsík: jelezzük, hogy ingyenes mód
if (quotaInfo) quotaInfo.textContent = "Ingyenes mód: korlátlan mesegenerálás ✅";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  btn.disabled = true; 
  btn.textContent = "Generálás…";
  storyEl.textContent = "";
  out.classList.add("hidden");

  try {
    const res = await fetch("/.netlify/functions/generateStory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Hálózati hiba");
    const json = await res.json();

    storyEl.textContent = json.story || "Hoppá, üres válasz érkezett.";
    out.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    storyEl.textContent = "Hiba történt a generálás közben. Nézd meg a Functions logot Netlifyban.";
    out.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "📖 Mesét kérek";
  }
});

// Másolás és mentés gombok
document.getElementById("copy")?.addEventListener("click", async () => {
  if (!storyEl.textContent.trim()) return;
  await navigator.clipboard.writeText(storyEl.textContent);
});

document.getElementById("save")?.addEventListener("click", () => {
  if (!storyEl.textContent.trim()) return;
  const blob = new Blob([storyEl.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "mese.txt"; a.click();
  URL.revokeObjectURL(url);
});
