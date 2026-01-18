/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js (GitHub Fixed Final)
 * ✅ Smart Parsing | ✅ Request Counter Reset | ✅ Selective Delete | ✅ GitHub Upload (Fixed)
 *****************************************************/

const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "Anjali_Quiz_Bank";
const GITHUB_BRANCH = "main";
let GITHUB_TOKEN = "";

const DATA_PATH = "data/";

const REQUEST_LIMIT = 60;
let requestCount = parseInt(localStorage.getItem("anjali_request_count") || "0");
let lastReset = Number(localStorage.getItem("anjali_request_reset")) || Date.now();

/*****************************************************
 * 🔹 Request Counter System
 *****************************************************/
function initRequestCounter() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  if (now - lastReset > oneHour) {
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
  counter.style.border = "1px solid #ccc";
  counter.style.padding = "6px 10px";
  counter.style.borderRadius = "8px";
  counter.style.fontSize = "13px";
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
 * 🔹 Smart Parser
 *****************************************************/
function parseMCQ(text) {
  const questions = [];
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  let q = {};

  lines.forEach(line => {
    if (/^Q[\):]/i.test(line)) q.q = line.replace(/^Q[\):]/i, "").trim();
    else if (line.startsWith("A)")) q.a = line.slice(2).trim();
    else if (line.startsWith("B)")) q.b = line.slice(2).trim();
    else if (line.startsWith("C)")) q.c = line.slice(2).trim();
    else if (line.startsWith("D)")) q.d = line.slice(2).trim();
    else if (/^Ans(wer)?[\):]/i.test(line)) q.correct = line.replace(/^Ans(wer)?[\):]/i, "").trim();
    else if (/^Exp(lanation)?[\):]/i.test(line)) {
      q.exp = line.replace(/^Exp(lanation)?[\):]/i, "").trim();
      questions.push(q);
      q = {};
    }
  });

  return questions;
}

/*****************************************************
 * 🔹 Local Data Handling
 *****************************************************/
async function getLocalData() {
  const data = localStorage.getItem("anjaliTempData");
  return data ? JSON.parse(data) : {};
}

function saveLocalData(data) {
  localStorage.setItem("anjaliTempData", JSON.stringify(data));
}

/*****************************************************
 * 🔹 Save Questions
 *****************************************************/
document.getElementById("saveBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const type = document.getElementById("type").value;
  const text = document.getElementById("questionData").value.trim();

  if (!subject || !subtopic || !text) return alert("⚠️ सभी फ़ील्ड भरें!");

  const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  saved[subject] = saved[subject] || {};
  saved[subject][subtopic] = saved[subject][subtopic] || { mcq: [], one_liner: [] };

  if (type === "mcq") {
    const parsed = parseMCQ(text);
    saved[subject][subtopic].mcq.push(...parsed);
  } else {
    const lines = text.split("\n").filter(l => l.trim());
    lines.forEach(line => saved[subject][subtopic].one_liner.push({ q: line.trim() }));
  }

  saveLocalData(saved);
  alert("✅ प्रश्न लोकल रूप से सेव किए गए!");
  document.getElementById("questionData").value = "";
});

/*****************************************************
 * 🔹 View Questions (Selectable)
 *****************************************************/
document.getElementById("viewBtn").addEventListener("click", async () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const qList = document.getElementById("questionList");
  const saved = await getLocalData();

  if (!subject || !subtopic)
    return alert("⚠️ कृपया विषय और उपविषय चुनें।");

  const data = saved[subject]?.[subtopic];
  if (!data || (!data.mcq.length && !data.one_liner.length)) {
    qList.innerHTML = "<i>❌ कोई प्रश्न सेव नहीं हैं।</i>";
    return;
  }

  let html = "";
  if (data.mcq.length) {
    html += `<b>📘 MCQ (${data.mcq.length})</b><hr>`;
    data.mcq.forEach((q, i) => {
      html += `<div class="qitem">
        <input type="checkbox" class="qcheck" data-type="mcq" data-index="${i}">
        <b>${i + 1}. ${q.q || "(प्रश्न अनुपलब्ध)"}</b><br>
        A) ${q.a || ""}<br>B) ${q.b || ""}<br>C) ${q.c || ""}<br>D) ${q.d || ""}<br>
        ✔ ${q.correct || ""}<br><i>${q.exp || ""}</i><hr>
      </div>`;
    });
  }

  if (data.one_liner.length) {
    html += `<b>📌 One-Liner (${data.one_liner.length})</b><hr>`;
    data.one_liner.forEach((q, i) => {
      html += `<div class="qitem">
        <input type="checkbox" class="qcheck" data-type="one_liner" data-index="${i}">
        ${i + 1}. ${q.q}<hr>
      </div>`;
    });
  }

  qList.innerHTML = html;
  qList.classList.remove("hidden");
});

/*****************************************************
 * 🔹 Selective Delete
 *****************************************************/
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const saved = await getLocalData();

  if (!subject || !subtopic)
    return alert("⚠️ कृपया पहले विषय और उपविषय चुनें।");

  const checks = Array.from(document.querySelectorAll(".qcheck:checked"));
  if (checks.length === 0) {
    if (confirm("❓ कोई प्रश्न चयनित नहीं है। क्या आप सभी हटाना चाहते हैं?")) {
      saved[subject][subtopic] = { mcq: [], one_liner: [] };
      saveLocalData(saved);
      alert("🗑️ सभी प्रश्न हटा दिए गए!");
    }
    return;
  }

  checks.forEach(c => {
    const type = c.dataset.type;
    const index = parseInt(c.dataset.index);
    if (saved[subject]?.[subtopic]?.[type]) {
      saved[subject][subtopic][type].splice(index, 1);
    }
  });

  saveLocalData(saved);
  alert(`🗑️ ${checks.length} चयनित प्रश्न हटा दिए गए!`);
  document.getElementById("viewBtn").click();
});

/*****************************************************
 * 🔹 Subject Name Map Helper
 *****************************************************/
function subjectNameFromMap(fileName) {
  const map = {
    "general_knowledge.json": "General Knowledge",
    "general_hindi.json": "General Hindi",
    "numerical_ability.json": "Numerical & Mental Ability",
    "reasoning.json": "Mental Aptitude / Reasoning"
  };
  return map[fileName] || fileName;
}

/*****************************************************
 * 🔹 Upload to GitHub
 *****************************************************/
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const data = await getLocalData();
  if (!Object.keys(data).length) return alert("⚠️ कोई डेटा सेव नहीं है!");

  const fileMap = {
    "General Knowledge": "general_knowledge.json",
    "General Hindi": "general_hindi.json",
    "Numerical & Mental Ability": "numerical_ability.json",
    "Mental Aptitude / Reasoning": "reasoning.json"
  };

  for (const subject in data) {
    const file = fileMap[subject];
    if (!file) continue;
    await uploadToGitHub(file, data[subject]);
  }

  alert("✅ सभी प्रश्न GitHub पर सफलतापूर्वक अपलोड किए गए!");
});

/*****************************************************
 * 🔹 Upload to GitHub Core Function
 *****************************************************/
async function uploadToGitHub(fileName, content) {
  updateRequestCounter();
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/${fileName}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `token ${GITHUB_TOKEN}`
  };

  const response = await fetch(url, { headers });
  const resJson = response.ok ? await response.json() : {};
  const sha = resJson.sha || null;

  const subjectName = subjectNameFromMap(fileName);
  const payload = {
    message: `📤 Updated ${fileName} from Anjali Control Panel`,
    content: btoa(JSON.stringify({ subject: subjectName, subtopics: content }, null, 2)),
    branch: GITHUB_BRANCH,
    sha
  };

  const putRes = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload)
  });

  if (!putRes.ok) {
    const text = await putRes.text();
    alert(`❌ Upload Failed: ${fileName}\n${text}`);
    throw new Error(text);
  }

  console.log(`✅ ${fileName} uploaded successfully.`);
}

/*****************************************************
 * 🔹 Token Box
 *****************************************************/
document.getElementById("tokenBox").addEventListener("change", e => {
  GITHUB_TOKEN = e.target.value.trim();
  if (GITHUB_TOKEN) alert("✅ Token सेट कर दिया गया!");
});

/*****************************************************
 * 🔹 Initialize
 *****************************************************/
window.addEventListener("DOMContentLoaded", initRequestCounter);
