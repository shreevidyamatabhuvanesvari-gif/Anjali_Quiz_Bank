/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js
 * Control Panel → GitHub JSON Auto Merge System
 * ✅ बिना Token भी कार्यरत + Token वैकल्पिक + Request Counter + Selective Delete + View Questions (Smart Fix)
 *****************************************************/

// 🔹 अपनी जानकारी यहाँ डालें
const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";
const GITHUB_REPO = "Anjali_Quiz_Bank";
const GITHUB_BRANCH = "main";
let GITHUB_TOKEN = ""; // वैकल्पिक

const DATA_PATH = "data/";

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
  counter.style.border = "1px solid #ccc";
  counter.style.padding = "6px 10px";
  counter.style.borderRadius = "8px";
  counter.textContent = `🔄 Requests Used: ${requestCount}/${REQUEST_LIMIT}`;
  document.body.appendChild(counter);
}

/*****************************************************
 * 🔹 Delete Selected Questions (SMART)
 *****************************************************/
function deleteSelectedQuestions() {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;

  if (!subject || !subtopic) {
    alert("⚠️ कृपया विषय और उप-विषय चुनें।");
    return;
  }

  const saved = JSON.parse(localStorage.getItem("anjaliTempData") || "{}");
  const topicData = saved?.[subject]?.[subtopic];

  if (!topicData || (!topicData.mcq.length && !topicData.one_liner.length)) {
    alert("⚠️ कोई प्रश्न उपलब्ध नहीं हैं।");
    return;
  }

  // ✅ Popup बनाओ
  let html = `<h3>🗑️ हटाने के लिए प्रश्न चुनें:</h3>
  <div style="max-height:300px; overflow-y:auto; text-align:left;">`;

  topicData.mcq.forEach((q, i) => {
    const question = q.q || q.question || `MCQ ${i + 1}`;
    html += `<label><input type="checkbox" name="delQ" value="mcq-${i}"> ${question}</label><br>`;
  });

  topicData.one_liner.forEach((q, i) => {
    const question = q.q || q.question || `One-liner ${i + 1}`;
    html += `<label><input type="checkbox" name="delQ" value="one-${i}"> ${question}</label><br>`;
  });

  html += `</div><br><button id="confirmDelBtn">✅ चयनित हटाएँ</button>`;

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
  box.style.width = "400px";
  box.style.zIndex = "9999";
  box.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  document.body.appendChild(box);

  document.getElementById("confirmDelBtn").onclick = () => {
    const checked = Array.from(document.querySelectorAll('input[name="delQ"]:checked'));
    if (checked.length === 0) {
      alert("⚠️ कृपया कम से कम एक प्रश्न चुनें!");
      return;
    }

    checked.forEach((c) => {
      const [type, idx] = c.value.split("-");
      if (type === "mcq") topicData.mcq.splice(idx, 1);
      else topicData.one_liner.splice(idx, 1);
    });

    localStorage.setItem("anjaliTempData", JSON.stringify(saved));
    alert("✅ चयनित प्रश्न हटा दिए गए!");
    box.remove();
  };
}

/*****************************************************
 * 🔹 View Questions (SMART UNDEFINED FIX)
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
        const question = q.q || q.question || "(❓ प्रश्न अनुपलब्ध)";
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
        html += `${i + 1}. ${q.q || q.question || "(डेटा अनुपलब्ध)"}<hr>`;
      });
    }
    qList.innerHTML = html;
  }

  qList.classList.toggle("hidden");
}

/*****************************************************
 * 🔹 Initialization
 *****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  initRequestCounter();

  const delBtn = document.getElementById("deleteBtn");
  if (delBtn) delBtn.addEventListener("click", deleteSelectedQuestions);

  const viewBtn = document.getElementById("viewBtn");
  if (viewBtn) viewBtn.addEventListener("click", viewQuestions);
});
