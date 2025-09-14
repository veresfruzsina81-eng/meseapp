const DAILY_FREE = 2;
const STORAGE_KEY = "mese_quota";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadQuota() {
  let q = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  if (q.date !== today()) q = { date: today(), used: 0 };
  return q;
}

function saveQuota(q) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
}

let quota = loadQuota();
const quotaInfo = document.getElementById("quota-info");
quotaInfo.textContent = `Mai mesék: ${quota.used}/${DAILY_FREE}`;

const form = document.getElementById("story-form");
const storyEl = document.getElementById("story");
const output = document.getElementById("output");
const paywall = document.getElementById("paywall");
const closePW = document.getElementById("close-paywall");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  quota = loadQuota();

  if (quota.used >= DAILY_FREE) {
    paywall.classList.remove("hidden");
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  storyEl.textContent = "Generálás folyamatban...";
  output.classList.remove("hidden");

  try {
    const res = await fetch("/.netlify/functions/generateStory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    storyEl.textContent = json.story;
    quota.used++;
    saveQuota(quota);
    quotaInfo.textContent = `Mai mesék: ${quota.used}/${DAILY_FREE}`;
  } catch (err) {
    storyEl.textContent = "Hiba történt!";
  }
});

document.getElementById("copy").addEventListener("click", () => {
  navigator.clipboard.writeText(storyEl.textContent);
});

closePW.addEventListener("click", () => {
  paywall.classList.add("hidden");
});
