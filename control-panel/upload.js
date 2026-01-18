/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js (FINAL SYNCED VERSION)
 * ✅ Local Save + View + Delete + GitHub Upload + Auto Reset
 *****************************************************/

const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "Anjali_Quiz_Bank";
const GITHUB_BRANCH = "main";
let GITHUB_TOKEN = "";

const DATA_PATH = "data/";
const REQUEST_LIMIT = 60;
let requestCount = parseInt(localStorage.getItem("anjali_request_count") || "0");
let lastReset = Number(localStorage.getItem("anjali_request_reset")) || Date.now();

/************* 🔹 Request Counter System *************/
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
  counter.style.color = "#333";
  counter.style.border = "1px solid #ccc";
  counter.style.borderRadius = "8px";
  counter.style.padding = "8px 12px";
  counter.style.fontSize = "14px";
  counter.textContent = `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
  document.body.appendChild(counter);
}

function updateRequestCounter() {
  requestCount++;
  localStorage.setItem("anjali_request_count", requestCount.toString());
  document.getElementById("requestCounter").textContent =
    `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
}

/************* 🔹 Local Save Function *************/
document.getElementById("saveBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const q = document.getElementById("questionText").value.trim();
  const a = document.getElementById("optA").value.trim();
  const b = document.getElementById("optB").value.trim();
  const c = document.getElementById("optC").value.trim();
  const d = document.getElementById("optD").value.trim();
  const correct = document.getElementById("correctAns").value.trim();
  const exp = document.getElementById("explanation").value.trim();

  if (!subject || !subtopic || !q) {
    alert("⚠️ कृपया विषय, उप-विषय और प्रश्न भरें।");
    return;
  }

  const data = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  if (!data[subject]) data[subject] = {};
  if (!data[subject][subtopic]) data[subject][subtopic] = { mcq: [], one_liner: [] };

  const question = { q, a, b, c, d, correct, exp };
  data[subject][subtopic].mcq.push(question);
  localStorage.setItem("anjaliTempData", JSON.stringify(data, null, 2));
  alert("✅ प्रश्न लोकल स्टोरेज में सेव हुआ!");
});

/************* 🔹 View Questions *************/
document.getElementById("viewBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const qList = document.getElementById("questionList");
  qList.style.display = "block";

  const data = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  const questions = data[subject]?.[subtopic]?.mcq || [];

  if (questions.length === 0) {
    qList.innerHTML = "<i>❌ कोई प्रश्न नहीं मिला।</i>";
    return;
  }

  qList.innerHTML = questions.map((q, i) => `
    <div><b>${i + 1}. ${q.q}</b><br>
    A) ${q.a}<br>B) ${q.b}<br>C) ${q.c}<br>D) ${q.d}<br>
    ✔ ${q.correct}<br><i>${q.exp}</i><hr></div>
  `).join("");
});

/************* 🔹 Delete Selected Questions *************/
document.getElementById("deleteBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  if (!subject || !subtopic) {
    alert("⚠️ कृपया विषय और उप-विषय चुनें।");
    return;
  }

  const confirmBox = document.getElementById("confirmBox");
  document.getElementById("confirmMessage").textContent =
    `"${subject}" → "${subtopic}" के सभी प्रश्न हटाने हैं?`;
  confirmBox.style.display = "flex";

  document.getElementById("confirmYes").onclick = () => {
    confirmBox.style.display = "none";
    const data = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
    if (data[subject] && data[subject][subtopic]) {
      data[subject][subtopic] = { mcq: [], one_liner: [] };
      localStorage.setItem("anjaliTempData", JSON.stringify(data));
      alert("🗑️ प्रश्न हटा दिए गए।");
    }
  };

  document.getElementById("confirmNo").onclick = () => {
    confirmBox.style.display = "none";
  };
});

/************* 🔹 Upload to GitHub *************/
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const localData = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  if (!Object.keys(localData).length) {
    alert("⚠️ कोई लोकल डेटा नहीं मिला!");
    return;
  }

  const fileMap = {
    "General Knowledge": "general_knowledge.json",
    "General Hindi": "general_hindi.json",
    "Numerical & Mental Ability": "numerical_ability.json",
    "Mental Aptitude / Reasoning": "reasoning.json",
  };

  for (const subject in localData) {
    const fileName = fileMap[subject];
    if (!fileName) continue;

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`;
    const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

    const response = await fetch(url, { headers });
    const json = response.status === 404 ? { content: "e30=", sha: null } : await response.json();
    const content = JSON.parse(atob(json.content));
    const updated = { ...content, ...localData[subject] };

    const payload = {
      message: `📤 Updated ${fileName}`,
      content: btoa(JSON.stringify(updated, null, 2)),
      branch: GITHUB_BRANCH,
      sha: json.sha,
    };

    await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}),
      },
      body: JSON.stringify(payload),
    });
  }

  alert("✅ सभी प्रश्न सफलतापूर्वक GitHub पर अपलोड हुए!");
});

document.addEventListener("DOMContentLoaded", initRequestCounter);
