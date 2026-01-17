/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js
 * Control Panel → GitHub JSON Auto Merge System
 * ✅ बिना Token भी कार्यरत + Token वैकल्पिक + Request Counter + Selective Delete + View Questions (Fixed Undefined Issue)
 *****************************************************/

// 🔹 अपनी जानकारी यहाँ डालें
const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";   // अपना GitHub यूज़रनेम
const GITHUB_REPO = "Anjali_Quiz_Bank";           // Repo का नाम
const GITHUB_BRANCH = "main";                     // Branch
let GITHUB_TOKEN = ""; // 🔒 वैकल्पिक — Token लिखें (optional)

// 🔹 Repo में JSON का Base Path
const DATA_PATH = "../data/";

/*****************************************************
 * 🔹 Request Counter System
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

  if (requestCount >= REQUEST_LIMIT) {
    alert("⚠️ GitHub API की 60 अनुरोध सीमा पूरी हो गई है। कृपया 1 घंटे बाद पुनः प्रयास करें।");
  } else if (requestCount >= REQUEST_LIMIT * 0.8) {
    console.warn("⚠️ आप सीमा के करीब पहुँच रहे हैं!");
  }
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
 * 🔹 GitHub से JSON फाइल fetch करना
 *****************************************************/
async function fetchFromGitHub(fileName) {
  updateRequestCounter();

  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`;
  const headers = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

  const response = await fetch(url, { headers });

  if (response.status === 404) {
    console.warn(`⚠️ नई फाइल बनाई जाएगी: ${fileName}`);
    return { content: {}, sha: null };
  }

  if (!response.ok) {
    alert(`❌ GitHub Fetch Error: ${response.statusText}`);
    throw new Error(response.statusText);
  }

  const json = await response.json();
  const decoded = atob(json.content);
  return { content: JSON.parse(decoded), sha: json.sha };
}

/*****************************************************
 * 🔹 लोकल और रिमोट JSON को Merge करना
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
 * 🔹 अपडेटेड JSON GitHub पर वापस अपलोड करना
 *****************************************************/
async function uploadToGitHub(fileName, data, sha = null) {
  updateRequestCounter();

  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`;
  const headers = { "Content-Type": "application/json" };
  if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

  const message = `📤 Updated ${fileName} from Anjali Control Panel`;
  const content = btoa(JSON.stringify(data, null, 2));

  const payload = { message, content, branch: GITHUB_BRANCH, sha: sha };

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    alert(`❌ अपलोड विफल (${fileName}): ${text}`);
    throw new Error(text);
  }

  console.log(`✅ ${fileName} सफलतापूर्वक अपलोड हुआ!`);
}

/*****************************************************
 * 🔹 View Questions Logic (Fixed Undefined Issue)
 *****************************************************/
function viewQuestions() {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  const qList = document.getElementById("questionList");

  if (!subject || !subtopic) {
    alert("⚠️ कृपया पहले विषय और उपविषय चुनें।");
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
        const question = q.q || q.question || "❓ (प्रश्न नहीं मिला)";
        const a = q.a || q.options?.A || "-";
        const b = q.b || q.options?.B || "-";
        const c = q.c || q.options?.C || "-";
        const d = q.d || q.options?.D || "-";
        const correct = q.correct || q.answer || "-";
        const exp = q.exp || q.explanation || "(कोई व्याख्या नहीं)";
        html += `<b>${i + 1}. ${question}</b><br>
        A) ${a}<br>B) ${b}<br>C) ${c}<br>D) ${d}<br>
        ✔ ${correct}<br><i>${exp}</i><hr>`;
      });
    }
    if (data.one_liner.length) {
      html += `<b>📌 One-Liner (${data.one_liner.length})</b><hr>`;
      data.one_liner.forEach((q, i) => {
        html += `${i + 1}. ${q.q || q.question || "❓ (डेटा अनुपलब्ध)"}<hr>`;
      });
    }
    qList.innerHTML = html;
  }

  qList.classList.toggle("hidden");
}

/*****************************************************
 * 🔹 Delete Selected Questions Logic
 *****************************************************/
function deleteSelectedQuestions() {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;

  if (!subject || !subtopic) {
    alert("⚠️ कृपया विषय और उपविषय चुनें जिनके प्रश्न हटाने हैं।");
    return;
  }

  const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  const topicData = saved?.[subject]?.[subtopic];

  if (!topicData || (!topicData.mcq.length && !topicData.one_liner.length)) {
    alert("⚠️ कोई प्रश्न उपलब्ध नहीं हैं।");
    return;
  }

  // View Questions Popup
  let html = `<h3>❓ प्रश्न चुनें जिन्हें हटाना है:</h3>`;
  html += `<div style="max-height:300px; overflow-y:auto; text-align:left;">`;

  topicData.mcq.forEach((q, i) => {
    const question = q.q || q.question || `MCQ ${i + 1}`;
    html += `<label style="display:block; margin:6px;">
      <input type="checkbox" name="delQ" value="mcq-${i}"> ${question}
    </label>`;
  });

  topicData.one_liner.forEach((q, i) => {
    const question = q.q || q.question || `One-Liner ${i + 1}`;
    html += `<label style="display:block; margin:6px;">
      <input type="checkbox" name="delQ" value="one-${i}"> ${question}
    </label>`;
  });

  html += `</div><br><button id="confirmDelBtn">🗑️ चयनित प्रश्न हटाएँ</button>`;
  const box = document.createElement("div");
  box.innerHTML = html;
  box.style.position = "fixed";
  box.style.left = "50%";
  box.style.top = "50%";
  box.style.transform = "translate(-50%, -50%)";
  box.style.background = "#fff";
  box.style.border = "2px solid #8b2d2d";
  box.style.borderRadius = "10px";
  box.style.padding = "20px";
  box.style.zIndex = "9999";
  box.style.width = "400px";
  box.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  document.body.appendChild(box);

  document.getElementById("confirmDelBtn").onclick = () => {
    const checked = Array.from(document.querySelectorAll('input[name="delQ"]:checked'));
    if (checked.length === 0) {
      alert("⚠️ कृपया कम से कम एक प्रश्न चुनें!");
      return;
    }

    checked.forEach(c => {
      const [type, index] = c.value.split("-");
      if (type === "mcq") topicData.mcq.splice(index, 1);
      else topicData.one_liner.splice(index, 1);
    });

    localStorage.setItem("anjaliTempData", JSON.stringify(saved));
    alert("✅ चयनित प्रश्न हटा दिए गए!");
    box.remove();
  };
}

/*****************************************************
 * 🔹 Control Panel Initialization
 *****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  initRequestCounter();

  const btn = document.createElement("button");
  btn.textContent = "⬆️ Upload to GitHub";
  btn.style.background = "#2d6a4f";
  btn.style.color = "white";
  btn.style.fontWeight = "bold";
  btn.style.marginTop = "12px";
  btn.onclick = uploadAll;
  document.querySelector(".container").appendChild(btn);

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
