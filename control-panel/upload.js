/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js (Final Integrated Version)
 * ✅ Smart Parser + Request Counter Fix + View/Delete Synced
 *****************************************************/

// 🔹 अपनी जानकारी यहाँ डालें
const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "Anjali_Quiz_Bank";
const GITHUB_BRANCH = "main";
let GITHUB_TOKEN = "";

// 🔹 Repo JSON Base Path
const DATA_PATH = "data/";

/*****************************************************
 * 🔹 Request Counter (Auto Reset every hour)
 *****************************************************/
const REQUEST_LIMIT = 60;
let requestCount = parseInt(localStorage.getItem("anjali_request_count") || "0");
let lastReset = Number(localStorage.getItem("anjali_request_reset")) || Date.now();

function initRequestCounter() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Auto-reset logic
  if (now - lastReset >= oneHour) {
    requestCount = 0;
    lastReset = now;
    localStorage.setItem("anjali_request_count", "0");
    localStorage.setItem("anjali_request_reset", now.toString());
  }

  const counter = document.createElement("div");
  counter.id = "requestCounter";
  counter.style.position = "fixed";
  counter.style.bottom = "10px";
  counter.style.right = "10px";
  counter.style.background = "#eef6ff";
  counter.style.color = "#2d3436";
  counter.style.border = "1px solid #ccc";
  counter.style.borderRadius = "8px";
  counter.style.padding = "8px 12px";
  counter.style.fontSize = "14px";
  counter.style.boxShadow = "0 0 6px rgba(0,0,0,0.1)";
  counter.textContent = `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
  document.body.appendChild(counter);
}

function updateRequestCounter() {
  requestCount++;
  if (requestCount > REQUEST_LIMIT) requestCount = REQUEST_LIMIT;
  localStorage.setItem("anjali_request_count", requestCount.toString());
  const counter = document.getElementById("requestCounter");
  if (counter)
    counter.textContent = `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
}

/*****************************************************
 * 🔹 Smart Parser for MCQ / One-Liner
 *****************************************************/
function parseMCQInput(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const questions = [];
  let q = {};

  lines.forEach(line => {
    if (/^Q[\):]/i.test(line)) q.q = line.replace(/^Q[\):]/i, "").trim();
    else if (/^A[\):]/i.test(line)) q.a = line.replace(/^A[\):]/i, "").trim();
    else if (/^B[\):]/i.test(line)) q.b = line.replace(/^B[\):]/i, "").trim();
    else if (/^C[\):]/i.test(line)) q.c = line.replace(/^C[\):]/i, "").trim();
    else if (/^D[\):]/i.test(line)) q.d = line.replace(/^D[\):]/i, "").trim();
    else if (/^Answer[\):]/i.test(line) || /^Ans[\):]/i.test(line))
      q.correct = line.replace(/^Answer[\):]/i, "").replace(/^Ans[\):]/i, "").trim();
    else if (/^Exp[\):]/i.test(line) || /^Explanation[\):]/i.test(line)) {
      q.exp = line.replace(/^Exp[\):]/i, "").replace(/^Explanation[\):]/i, "").trim();
      questions.push({ ...q });
      q = {};
    }
  });
  return questions;
}

/*****************************************************
 * 🔹 लोकल डेटा सेव
 *****************************************************/
document.getElementById("saveBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const type = document.getElementById("type").value;
  const text = document.getElementById("questionData").value.trim();

  if (!subject || !subtopic || !text) {
    alert("⚠️ कृपया सभी फ़ील्ड भरें!");
    return;
  }

  const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  saved[subject] = saved[subject] || {};
  saved[subject][subtopic] = saved[subject][subtopic] || { mcq: [], one_liner: [] };

  if (type === "mcq") {
    const parsed = parseMCQInput(text);
    saved[subject][subtopic].mcq.push(...parsed);
  } else {
    const lines = text.split("\n").filter(Boolean);
    lines.forEach(line => saved[subject][subtopic].one_liner.push({ q: line }));
  }

  localStorage.setItem("anjaliTempData", JSON.stringify(saved));
  alert("✅ प्रश्न लोकल रूप से सेव किए गए!");
  document.getElementById("questionData").value = "";
});

/*****************************************************
 * 🔹 View Questions
 *****************************************************/
document.getElementById("viewBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const qList = document.getElementById("questionList");

  if (!subject || !subtopic) {
    alert("⚠️ कृपया विषय और उपविषय चुनें।");
    return;
  }

  const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  const data = saved[subject]?.[subtopic];

  if (!data || (!data.mcq.length && !data.one_liner.length)) {
    qList.innerHTML = "<i>❌ कोई प्रश्न सेव नहीं हैं।</i>";
  } else {
    let html = "";
    if (data.mcq.length) {
      html += `<b>📘 MCQ (${data.mcq.length})</b><hr>`;
      data.mcq.forEach((q, i) => {
        html += `<b>${i + 1}. ${q.q || "(प्रश्न अनुपलब्ध)"}</b><br>
        A) ${q.a || "-"}<br>B) ${q.b || "-"}<br>C) ${q.c || "-"}<br>D) ${q.d || "-"}<br>
        ✔ ${q.correct || "(उत्तर अनुपलब्ध)"}<br><i>${q.exp || ""}</i><hr>`;
      });
    }
    if (data.one_liner.length) {
      html += `<b>📌 One-Liner (${data.one_liner.length})</b><hr>`;
      data.one_liner.forEach((q, i) => html += `${i + 1}. ${q.q}<hr>`);
    }
    qList.innerHTML = html;
  }
  qList.classList.toggle("hidden");
});

/*****************************************************
 * 🔹 Delete Selected Questions
 *****************************************************/
document.getElementById("deleteBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;

  if (!subject || !subtopic) {
    alert("⚠️ कृपया विषय और उप-विषय चुनें।");
    return;
  }

  const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  const data = saved[subject]?.[subtopic];

  if (!data) return alert("❌ कोई प्रश्न नहीं मिला।");

  const mcqCount = data.mcq.length;
  const oneCount = data.one_liner.length;
  if (!mcqCount && !oneCount) return alert("❌ कोई प्रश्न नहीं हैं।");

  if (confirm(`"${subject}" → "${subtopic}" के सभी प्रश्न हटाने हैं?`)) {
    saved[subject][subtopic] = { mcq: [], one_liner: [] };
    localStorage.setItem("anjaliTempData", JSON.stringify(saved));
    alert(`🗑️ "${subject}" → "${subtopic}" के प्रश्न हटा दिए गए हैं।`);
  }
});

/*****************************************************
 * 🔹 Upload to GitHub (Single Button)
 *****************************************************/
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const localData = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  if (!Object.keys(localData).length) return alert("⚠️ कोई नया डेटा नहीं मिला।");

  const fileMap = {
    "General Knowledge": "general_knowledge.json",
    "General Hindi": "general_hindi.json",
    "Numerical & Mental Ability": "numerical_ability.json",
    "Mental Aptitude / Reasoning": "reasoning.json",
  };

  for (const subject in localData) {
    const fileName = fileMap[subject];
    if (!fileName) continue;

    const res = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`);
    const json = res.status === 404 ? { content: "e30=", sha: null } : await res.json();
    const existing = JSON.parse(atob(json.content));
    const merged = mergeData(existing, localData, subject);

    await uploadToGitHub(fileName, merged, json.sha);
  }

  alert("✅ सभी प्रश्न सफलतापूर्वक GitHub पर अपलोड हुए!");
  localStorage.removeItem("anjaliTempData");
});

/*****************************************************
 * 🔹 Token Box
 *****************************************************/
document.getElementById("tokenBox").addEventListener("change", e => {
  GITHUB_TOKEN = e.target.value.trim();
  if (GITHUB_TOKEN) alert("✅ Token सेट कर दिया गया!");
});

/*****************************************************
 * 🔹 Initialization
 *****************************************************/
window.addEventListener("DOMContentLoaded", initRequestCounter);

/*****************************************************
 * 🔹 Helper: Merge Data
 *****************************************************/
function mergeData(remoteData, localData, subjectName) {
  const updated = remoteData || { subject: subjectName, subtopics: {} };
  for (const sub in localData[subjectName]) {
    const subData = localData[subjectName][sub];
    if (!updated.subtopics[sub]) updated.subtopics[sub] = { mcq: [], one_liner: [] };
    updated.subtopics[sub].mcq.push(...subData.mcq);
    updated.subtopics[sub].one_liner.push(...subData.one_liner);
  }
  return updated;
        }
