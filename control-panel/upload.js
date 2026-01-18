/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js (Final Synced + Auto-Refresh)
 *****************************************************/

const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "Anjali_Quiz_Bank";
const GITHUB_BRANCH = "main";
let GITHUB_TOKEN = "";

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

  // ✅ Auto Refresh Trigger for Student Panel
  localStorage.setItem("anjali_refresh_flag", Date.now().toString());

  alert("✅ सभी प्रश्न GitHub पर सफलतापूर्वक अपलोड किए गए!");
});

/*****************************************************
 * 🔹 Upload Function
 *****************************************************/
async function uploadToGitHub(fileName, content) {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/data/${fileName}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `token ${GITHUB_TOKEN}`
  };

  const getRes = await fetch(url, { headers });
  const getJson = getRes.ok ? await getRes.json() : {};
  const sha = getJson.sha || null;

  const payload = {
    message: `📤 Updated ${fileName} from Anjali Control Panel`,
    content: btoa(JSON.stringify(content, null, 2)), // ✅ Correct format
    branch: GITHUB_BRANCH,
    sha
  };

  const putRes = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload) });
  if (!putRes.ok) throw new Error(await putRes.text());
  console.log(`✅ ${fileName} uploaded.`);
}

/*****************************************************
 * 🔹 Token Input
 *****************************************************/
document.getElementById("tokenBox").addEventListener("change", e => {
  GITHUB_TOKEN = e.target.value.trim();
  if (GITHUB_TOKEN) alert("✅ Token सेट कर दिया गया!");
});

window.addEventListener("DOMContentLoaded", initRequestCounter);
