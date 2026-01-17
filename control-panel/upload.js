/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js (Final Tested Version)
 * ✅ Smart Parser + Request Counter Reset + Working Delete/View
 *****************************************************/

// 🔹 अपनी जानकारी यहाँ डालें
const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "Anjali_Quiz_Bank";
const GITHUB_BRANCH = "main";
let GITHUB_TOKEN = ""; // वैकल्पिक

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

  if (now - lastReset > oneHour) {
    requestCount = 0;
    lastReset = now;
    localStorage.setItem("anjali_request_count", "0");
    localStorage.setItem("anjali_request_reset", now);
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
  localStorage.setItem("anjali_request_count", requestCount.toString());
  const counter = document.getElementById("requestCounter");
  if (counter)
    counter.textContent = `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
}

/*****************************************************
 * 🔹 लोकल डेटा लोड करना
 *****************************************************/
async function getLocalData() {
  const data = localStorage.getItem("anjaliTempData");
  if (!data) {
    alert("⚠️ कोई नया प्रश्न डेटा नहीं मिला!");
    return null;
  }
  return JSON.parse(data);
}

/*****************************************************
 * 🔹 Smart Parser (MCQ Input)
 *****************************************************/
function parseMCQInput(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const questions = [];
  let q = {};

  lines.forEach(line => {
    if (line.match(/^Q[\):]/i)) {
      q.q = line.replace(/^Q[\):]/i, "").trim();
    } else if (line.match(/^A[\):]/i)) {
      q.a = line.replace(/^A[\):]/i, "").trim();
    } else if (line.match(/^B[\):]/i)) {
      q.b = line.replace(/^B[\):]/i, "").trim();
    } else if (line.match(/^C[\):]/i)) {
      q.c = line.replace(/^C[\):]/i, "").trim();
    } else if (line.match(/^D[\):]/i)) {
      q.d = line.replace(/^D[\):]/i, "").trim();
    } else if (line.match(/^Answer[\):]/i) || line.match(/^Ans[\):]/i)) {
      q.correct = line.replace(/^Answer[\):]/i, "").replace(/^Ans[\):]/i, "").trim();
    } else if (line.match(/^Exp[\):]/i) || line.match(/^Explanation[\):]/i)) {
      q.exp = line.replace(/^Exp[\):]/i, "").replace(/^Explanation[\):]/i, "").trim();
      questions.push(q);
      q = {};
    }
  });

  return questions;
}

/*****************************************************
 * 🔹 Fetch from GitHub
 *****************************************************/
async function fetchFromGitHub(fileName) {
  updateRequestCounter();

  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`;
  const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

  const res = await fetch(url, { headers });
  if (res.status === 404) return { content: {}, sha: null };
  const json = await res.json();
  const decoded = atob(json.content);
  return { content: JSON.parse(decoded), sha: json.sha };
}

/*****************************************************
 * 🔹 Merge Local + Remote
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

/*****************************************************
 * 🔹 Upload to GitHub
 *****************************************************/
async function uploadToGitHub(fileName, data, sha = null) {
  updateRequestCounter();

  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`;
  const headers = { "Content-Type": "application/json" };
  if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

  const message = `📤 Updated ${fileName} from Anjali Control Panel`;
  const content = btoa(JSON.stringify(data, null, 2));
  const payload = { message, content, branch: GITHUB_BRANCH, sha };

  const res = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  console.log(`✅ ${fileName} सफलतापूर्वक अपलोड हुआ!`);
}

/*****************************************************
 * 🔹 Upload All
 *****************************************************/
async function uploadAll() {
  const localData = await getLocalData();
  if (!localData) return;

  const fileMap = {
    "General Knowledge": "general_knowledge.json",
    "General Hindi": "general_hindi.json",
    "Numerical & Mental Ability": "numerical_ability.json",
    "Mental Aptitude / Reasoning": "reasoning.json",
  };

  for (const subjectName in localData) {
    const fileName = fileMap[subjectName];
    if (!fileName) continue;

    const { content, sha } = await fetchFromGitHub(fileName);
    const merged = mergeData(content, localData, subjectName);
    await uploadToGitHub(fileName, merged, sha);
  }

  alert("✅ सभी प्रश्न GitHub पर सफलतापूर्वक अपलोड किए गए!");
  localStorage.removeItem("anjaliTempData");
}

/*****************************************************
 * 🔹 Delete Logic
 *****************************************************/
function deleteSelectedQuestions() {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;

  if (!subject || !subtopic) return alert("⚠️ कृपया विषय और उप-विषय चुनें।");

  if (confirm(`"${subject}" → "${subtopic}" के सभी प्रश्न हटाने हैं?`)) {
    const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
    if (saved[subject]?.[subtopic]) {
      saved[subject][subtopic] = { mcq: [], one_liner: [] };
      localStorage.setItem("anjaliTempData", JSON.stringify(saved));
      alert(`🗑️ "${subject}" → "${subtopic}" के प्रश्न हटा दिए गए हैं।`);
    } else {
      alert("⚠️ कोई प्रश्न नहीं मिला।");
    }
  }
}

/*****************************************************
 * 🔹 View Questions
 *****************************************************/
function viewQuestions() {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const qList = document.getElementById("questionList");

  if (!subject || !subtopic) return alert("⚠️ कृपया पहले विषय और उपविषय चुनें।");

  const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  const data = saved[subject]?.[subtopic];

  if (!data || (!data.mcq.length && !data.one_liner.length)) {
    qList.innerHTML = "<i>❌ कोई प्रश्न सेव नहीं हैं।</i>";
    return;
  }

  let html = "";
  if (data.mcq.length) {
    html += `<b>📘 MCQ (${data.mcq.length})</b><hr>`;
    data.mcq.forEach((q, i) => {
      html += `<b>${i + 1}. ${q.q || "(प्रश्न अनुपलब्ध)"}</b><br>
      A) ${q.a || "-"}<br>B) ${q.b || "-"}<br>C) ${q.c || "-"}<br>D) ${q.d || "-"}<br>
      ✔ उत्तर: ${q.correct || "(उत्तर अनुपलब्ध)"}<br><i>${q.exp || ""}</i><hr>`;
    });
  }

  if (data.one_liner.length) {
    html += `<b>📌 One-Liner (${data.one_liner.length})</b><hr>`;
    data.one_liner.forEach((q, i) => {
      html += `${i + 1}. ${q.q || "(प्रश्न अनुपलब्ध)"}<hr>`;
    });
  }

  qList.innerHTML = html;
  qList.classList.toggle("hidden");
}

/*****************************************************
 * 🔹 Initialization
 *****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  initRequestCounter();

  const uploadBtn = document.createElement("button");
  uploadBtn.textContent = "⬆️ Upload to GitHub";
  uploadBtn.style.background = "#2d6a4f";
  uploadBtn.style.color = "white";
  uploadBtn.style.fontWeight = "bold";
  uploadBtn.style.marginTop = "12px";
  uploadBtn.onclick = uploadAll;
  document.querySelector(".container").appendChild(uploadBtn);

  const tokenBox = document.createElement("input");
  tokenBox.type = "password";
  tokenBox.placeholder = "🔑 यदि Token है, यहाँ लिखें (optional)";
  tokenBox.style.width = "100%";
  tokenBox.style.padding = "8px";
  tokenBox.style.marginTop = "10px";
  tokenBox.style.border = "1px solid #ccc";
  tokenBox.style.borderRadius = "6px";
  tokenBox.onchange = () => {
    GITHUB_TOKEN = tokenBox.value.trim();
    if (GITHUB_TOKEN) alert("✅ Token सेट कर दिया गया!");
  };
  document.querySelector(".container").appendChild(tokenBox);

  const delBtn = document.getElementById("deleteBtn");
  if (delBtn) delBtn.addEventListener("click", deleteSelectedQuestions);

  const viewBtn = document.getElementById("viewBtn");
  if (viewBtn) viewBtn.addEventListener("click", viewQuestions);
});
