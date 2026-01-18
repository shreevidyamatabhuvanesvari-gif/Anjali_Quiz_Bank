/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js (FINAL ✅)
 * Local Save + View + Delete + GitHub Upload + Request Counter Reset
 *****************************************************/

const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "Anjali_Quiz_Bank";
const GITHUB_BRANCH = "main";
let GITHUB_TOKEN = ""; // वैकल्पिक

const DATA_PATH = "data/";
const REQUEST_LIMIT = 60;
let requestCount = parseInt(localStorage.getItem("anjali_request_count") || "0");
let lastReset = Number(localStorage.getItem("anjali_request_reset")) || Date.now();

/**************** 🔹 Request Counter ****************/
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
  counter.style.padding = "8px 12px";
  counter.style.border = "1px solid #ccc";
  counter.style.borderRadius = "8px";
  counter.style.fontSize = "14px";
  counter.textContent = `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
  document.body.appendChild(counter);
}

function updateRequestCounter() {
  requestCount++;
  localStorage.setItem("anjali_request_count", requestCount.toString());
  const c = document.getElementById("requestCounter");
  if (c) c.textContent = `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
}

/**************** 🔹 Local Save ****************/
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
    alert("⚠️ कृपया विषय, उप-विषय और प्रश्न लिखें।");
    return;
  }

  const data = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  if (!data[subject]) data[subject] = {};
  if (!data[subject][subtopic]) data[subject][subtopic] = { mcq: [], one_liner: [] };

  data[subject][subtopic].mcq.push({ q, a, b, c, d, correct, exp });
  localStorage.setItem("anjaliTempData", JSON.stringify(data, null, 2));
  alert("✅ प्रश्न सेव हो गया!");
});

/**************** 🔹 View Questions ****************/
document.getElementById("viewBtn").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const qList = document.getElementById("questionList");
  qList.style.display = "block";

  const data = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  const list = data[subject]?.[subtopic]?.mcq || [];

  if (!list.length) {
    qList.innerHTML = "<i>❌ कोई प्रश्न नहीं मिला।</i>";
    return;
  }

  qList.innerHTML = list.map((q, i) => `
    <b>${i + 1}. ${q.q || "(प्रश्न अनुपलब्ध)"}</b><br>
    A) ${q.a || "-"}<br>B) ${q.b || "-"}<br>C) ${q.c || "-"}<br>D) ${q.d || "-"}<br>
    ✔ ${q.correct || "-"}<br><i>${q.exp || ""}</i><hr>`).join("");
});

/**************** 🔹 Delete Questions ****************/
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
  document.getElementById("confirmNo").onclick = () => (confirmBox.style.display = "none");
});

/**************** 🔹 Upload to GitHub (Fixed) ****************/
document.getElementById("uploadBtn").addEventListener("click", async () => {
  const localData = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  if (!Object.keys(localData).length) return alert("⚠️ कोई लोकल डेटा नहीं मिला!");

  const fileMap = {
    "General Knowledge": "general_knowledge.json",
    "General Hindi": "general_hindi.json",
    "Numerical & Mental Ability": "numerical_ability.json",
    "Mental Aptitude / Reasoning": "reasoning.json",
  };

  for (const subject in localData) {
    const fileName = fileMap[subject];
    if (!fileName) continue;
    updateRequestCounter();

    const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`;
    const headers = { "Accept": "application/vnd.github+json" };
    if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

    const res = await fetch(url, { headers });
    const json = res.status === 404 ? { content: btoa(JSON.stringify({
      subject, subtopics: {}
    })), sha: null } : await res.json();

    const remote = JSON.parse(atob(json.content));
    const updated = { subject, subtopics: { ...remote.subtopics, ...localData[subject] } };

    const payload = {
      message: `📤 Updated ${fileName}`,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(updated, null, 2)))),
      branch: GITHUB_BRANCH,
      sha: json.sha,
    };

    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });

    if (!uploadRes.ok) {
      alert(`❌ Upload Failed: ${fileName}`);
      console.error(await uploadRes.text());
      return;
    }
  }

  alert("✅ सभी प्रश्न सफलतापूर्वक GitHub पर अपलोड हुए!");
});

document.addEventListener("DOMContentLoaded", initRequestCounter);
