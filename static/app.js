/* ── app.js ── AI Interview Platform ──────────────────────────────────────── */

const CAT_COLORS = {
  "Technical Skills": { color: "#6c63ff", bg: "rgba(108,99,255,0.15)" },
  "Behavioral":       { color: "#00e5a0", bg: "rgba(0,229,160,0.15)" },
  "System Design":    { color: "#ffd166", bg: "rgba(255,209,102,0.15)" },
  "Problem Solving":  { color: "#ff4d6d", bg: "rgba(255,77,109,0.15)" },
  "Cultural Fit":     { color: "#ff8c42", bg: "rgba(255,140,66,0.15)" },
  "Leadership":       { color: "#4cc9f0", bg: "rgba(76,201,240,0.15)" },
};
const DIFF_COLORS = {
  Easy:   { color: "#00e5a0", bg: "rgba(0,229,160,0.12)" },
  Medium: { color: "#ffd166", bg: "rgba(255,209,102,0.12)" },
  Hard:   { color: "#ff4d6d", bg: "rgba(255,77,109,0.12)" },
};

let allQuestions = [];
let currentFilter = "all";

// ── DOM refs ─────────────────────────────────────────────────────────────────
const form          = document.getElementById("mainForm");
const submitBtn     = document.getElementById("submitBtn");
const errorBox      = document.getElementById("errorBox");
const errorMsg      = document.getElementById("errorMsg");
const loadingSection= document.getElementById("loadingSection");
const resultsSection= document.getElementById("resultsSection");
const questionList  = document.getElementById("questionList");
const statsRow      = document.getElementById("statsRow");
const resultsMeta   = document.getElementById("resultsMeta");

// ── Tabs ─────────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    const group = btn.dataset.group;
    const tab   = btn.dataset.tab;
    document.querySelectorAll(`.tab[data-group="${group}"]`).forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(`[id^="${group}-"]`).forEach(p => p.classList.remove("active"));
    const panel = document.getElementById(`${group}-${tab}`);
    if (panel) panel.classList.add("active");
  });
});

// ── Dropzone ─────────────────────────────────────────────────────────────────
const dropzone    = document.getElementById("dropzone");
const fileInput   = document.getElementById("resume_file");
const fileLabel   = document.getElementById("fileLabel");

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) {
    fileLabel.textContent = "✓ " + fileInput.files[0].name;
    dropzone.classList.add("has-file");
  }
});
dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("drag-over"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
dropzone.addEventListener("drop", e => {
  e.preventDefault(); dropzone.classList.remove("drag-over");
  const f = e.dataTransfer.files[0];
  if (f && f.type === "application/pdf") {
    const dt = new DataTransfer(); dt.items.add(f); fileInput.files = dt.files;
    fileLabel.textContent = "✓ " + f.name;
    dropzone.classList.add("has-file");
  }
});

// ── Number control ────────────────────────────────────────────────────────────
const numInput = document.getElementById("num_questions");
document.getElementById("numMinus").addEventListener("click", () => {
  numInput.value = Math.max(5, parseInt(numInput.value) - 5);
});
document.getElementById("numPlus").addEventListener("click", () => {
  numInput.value = Math.min(40, parseInt(numInput.value) + 5);
});

// ── Loading animation ─────────────────────────────────────────────────────────
function animateLoadingSteps() {
  const steps = ["ls1","ls2","ls3","ls4"];
  let i = 0;
  document.querySelectorAll(".ls").forEach(el => el.className = "ls");
  document.getElementById(steps[0]).classList.add("ls-active");
  return setInterval(() => {
    document.getElementById(steps[i]).className = "ls ls-done";
    i++;
    if (i < steps.length) document.getElementById(steps[i]).classList.add("ls-active");
  }, 1800);
}

// ── Form submit ───────────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Reset UI
  errorBox.classList.add("hidden");
  resultsSection.classList.add("hidden");
  loadingSection.classList.remove("hidden");
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="white" stroke-width="2" stroke-dasharray="30" stroke-dashoffset="10"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></circle></svg> Generating…`;

  const timer = animateLoadingSteps();
  const data  = new FormData(form);

  try {
    const res  = await fetch("/api/generate", { method: "POST", body: data });
    const json = await res.json();

    clearInterval(timer);
    loadingSection.classList.add("hidden");

    if (!res.ok || json.error) {
      showError(json.error || "Something went wrong.");
    } else {
      allQuestions = json.questions;
      renderResults(allQuestions);
    }
  } catch (err) {
    clearInterval(timer);
    loadingSection.classList.add("hidden");
    showError("Network error: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Generate Questions`;
  }
});

// ── Error helper ──────────────────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.classList.remove("hidden");
}

// ── Render results ────────────────────────────────────────────────────────────
function renderResults(questions) {
  resultsSection.classList.remove("hidden");
  resultsMeta.textContent = `${questions.length} questions generated`;

  // Stats
  const byCat  = {};
  const byDiff = { Easy: 0, Medium: 0, Hard: 0 };
  questions.forEach(q => {
    byCat[q.category] = (byCat[q.category] || 0) + 1;
    byDiff[q.difficulty] = (byDiff[q.difficulty] || 0) + 1;
  });

  statsRow.innerHTML = [
    { num: questions.length, lbl: "Total Questions", color: "#6c63ff" },
    { num: byDiff.Hard,      lbl: "Hard Questions",  color: "#ff4d6d" },
    { num: byDiff.Medium,    lbl: "Medium Questions", color: "#ffd166" },
    { num: byDiff.Easy,      lbl: "Easy Questions",   color: "#00e5a0" },
    { num: Object.keys(byCat).length, lbl: "Categories", color: "#4cc9f0" },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-num" style="color:${s.color}">${s.num}</div>
      <div class="stat-lbl">${s.lbl}</div>
    </div>
  `).join("");

  renderQuestionList(questions);
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderQuestionList(questions) {
  questionList.innerHTML = questions.map((q, i) => {
    const cat  = q.category  || "Technical Skills";
    const diff = q.difficulty || "Medium";
    const cc   = CAT_COLORS[cat]  || { color: "#6c63ff", bg: "rgba(108,99,255,0.15)" };
    const dc   = DIFF_COLORS[diff] || DIFF_COLORS.Medium;
    const tags = (q.tags || []).map(t => `<span class="q-tag">${t}</span>`).join("");

    return `
    <div class="q-card" data-category="${cat}" data-index="${i}" onclick="toggleCard(${i})">
      <div class="q-top">
        <div class="q-num" style="background:${cc.bg};color:${cc.color};border:1px solid ${cc.color}33">
          ${String(i+1).padStart(2,"0")}
        </div>
        <div style="flex:1">
          <div class="q-meta">
            <span class="q-badge" style="color:${cc.color};background:${cc.bg}">${cat}</span>
            <span class="q-badge" style="color:${dc.color};background:${dc.bg}">${diff}</span>
          </div>
          <div class="q-text">${escHtml(q.question)}</div>
          ${tags ? `<div class="q-tags">${tags}</div>` : ""}
        </div>
      </div>
      <div class="q-hint">
        <div class="q-hint-label">💡 What they're looking for</div>
        <div class="q-hint-text">${escHtml(q.hint || "")}</div>
      </div>
      <div class="q-followup">
        <button class="q-followup-btn" onclick="event.stopPropagation();loadFollowups(${i},this)">
          + Generate follow-up questions
        </button>
        <div class="q-followup-list" id="fu-${i}"></div>
      </div>
    </div>
    `;
  }).join("");
}

window.toggleCard = function(i) {
  const card = document.querySelector(`.q-card[data-index="${i}"]`);
  if (card) card.classList.toggle("open");
};

window.loadFollowups = async function(i, btn) {
  const q   = allQuestions[i];
  const div = document.getElementById(`fu-${i}`);
  btn.disabled = true;
  btn.textContent = "Loading…";

  try {
    const res  = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q.question, context: q.hint }),
    });
    const json = await res.json();
    if (json.follow_ups) {
      div.innerHTML = json.follow_ups.map(f =>
        `<div class="q-followup-item">↳ ${escHtml(f)}</div>`
      ).join("");
      btn.style.display = "none";
    }
  } catch(e) {
    btn.textContent = "Error — try again";
    btn.disabled = false;
  }
};

// ── Filter bar ────────────────────────────────────────────────────────────────
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    const filtered = currentFilter === "all"
      ? allQuestions
      : allQuestions.filter(q => q.category === currentFilter);
    renderQuestionList(filtered);
  });
});

// ── Copy all ──────────────────────────────────────────────────────────────────
document.getElementById("copyAllBtn").addEventListener("click", () => {
  const text = allQuestions.map((q,i) =>
    `${i+1}. [${q.category} | ${q.difficulty}]\n${q.question}\nHint: ${q.hint || ""}\n`
  ).join("\n");
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copyAllBtn");
    btn.textContent = "✓ Copied!";
    setTimeout(() => btn.innerHTML = `<svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/></svg> Copy All`, 2000);
  });
});

// ── Reset ─────────────────────────────────────────────────────────────────────
document.getElementById("resetBtn").addEventListener("click", () => {
  resultsSection.classList.add("hidden");
  allQuestions = [];
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Utils ─────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
