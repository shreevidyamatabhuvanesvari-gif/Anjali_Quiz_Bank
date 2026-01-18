/*****************************************************
 * 🎓 Anjali Quiz Bank – Student Panel (Final Synced Version)
 * ✅ Subject–Subtopic Loader | ✅ Voice Reader
 * ✅ GK, Hindi, Maths, Reasoning Support
 * ✅ Step-by-Step Solver | ✅ One-Liner Mode
 *****************************************************/

// 🔹 आवश्यक HTML Elements
const subjectSelect = document.getElementById("subject");
const subtopicSelect = document.getElementById("subtopic");
const quizBox = document.getElementById("quizBox");
const nextBtn = document.getElementById("nextBtn");
const modeSelect = document.getElementById("modeSelect");

let allData = {};
let currentQuestions = [];
let currentIndex = 0;

// 🔹 सभी JSON डेटा फाइलें
const dataFiles = [
  "../data/general_knowledge.json",
  "../data/general_hindi.json",
  "../data/numerical_ability.json",
  "../data/reasoning.json"
];

/*****************************************************
 * 🔹 सभी विषय लोड करना
 *****************************************************/
async function loadAllSubjects() {
  for (let file of dataFiles) {
    try {
      const res = await fetch(file);
      const json = await res.json();
      allData[json.subject] = json.subtopics;
    } catch (err) {
      console.warn("⚠️ लोड त्रुटि:", file, err);
    }
  }
  populateSubjects();
}

/*****************************************************
 * 🔹 विषय Dropdown भरना
 *****************************************************/
function populateSubjects() {
  subjectSelect.innerHTML = `<option value="">-- विषय चुनें --</option>`;
  Object.keys(allData).forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subjectSelect.appendChild(opt);
  });
}

/*****************************************************
 * 🔹 उपविषय Dropdown भरना
 *****************************************************/
function populateSubtopics(subject) {
  const subs = allData[subject] || {};
  subtopicSelect.innerHTML = `<option value="">-- उप-विषय चुनें --</option>`;
  Object.keys(subs).forEach(st => {
    const opt = document.createElement("option");
    opt.value = st;
    opt.textContent = st;
    subtopicSelect.appendChild(opt);
  });
}

// विषय बदलने पर उपविषय दिखाएं
subjectSelect.addEventListener("change", () => {
  populateSubtopics(subjectSelect.value);
});

/*****************************************************
 * 🔹 क्विज मोड प्रारंभ करना
 *****************************************************/
function startQuiz() {
  const subject = subjectSelect.value;
  const subtopic = subtopicSelect.value;

  if (!subject || !subtopic) return alert("⚠️ पहले विषय और उपविषय चुनें!");

  const data = allData[subject]?.[subtopic];
  if (!data) return alert("❌ इस उपविषय में कोई डेटा नहीं है।");

  // Mode के अनुसार प्रश्न चुनें
  if (modeSelect.value === "mcq") currentQuestions = data.mcq || [];
  else if (modeSelect.value === "one_liner") currentQuestions = data.one_liner || [];
  else if (modeSelect.value === "step") currentQuestions = data.mcq || [];

  if (!currentQuestions.length) return alert("📭 अभी कोई प्रश्न उपलब्ध नहीं है।");

  currentIndex = 0;
  showQuestion();
}

/*****************************************************
 * 🔹 प्रश्न दिखाना
 *****************************************************/
function showQuestion() {
  const q = currentQuestions[currentIndex];
  if (!q) {
    quizBox.innerHTML = "<b>🎉 क्विज समाप्त! बहुत अच्छा प्रयास!</b>";
    nextBtn.style.display = "none";
    AnjaliVoice.motivate();
    return;
  }

  // MCQ / Step-by-Step Mode
  if (modeSelect.value === "mcq" || modeSelect.value === "step") {
    quizBox.innerHTML = `
      <b>Q${currentIndex + 1}. ${q.q}</b><br>
      A) ${q.a}<br>B) ${q.b}<br>C) ${q.c}<br>D) ${q.d}<br>
      <i>✔ उत्तर:</i> ${q.correct}<br>
      <small><i>${q.exp || ""}</i></small>
    `;
    AnjaliVoice.speak(`प्रश्न ${currentIndex + 1}. ${q.q}.`);
  }

  // One-Liner Mode
  else if (modeSelect.value === "one_liner") {
    quizBox.innerHTML = `<b>${currentIndex + 1}. ${q.q}</b>`;
    AnjaliVoice.speak(q.q);
  }

  nextBtn.style.display = "block";
}

/*****************************************************
 * 🔹 Step-by-Step Math Solver
 *****************************************************/
function showStepByStep() {
  const q = currentQuestions[currentIndex];
  if (!q) return;

  quizBox.innerHTML = `
    <b>Q${currentIndex + 1}. ${q.q}</b><br>
    <div class="step-box">
      <i>🔹 समाधान क्रमबद्ध रूप में:</i><br>
      <p>1️⃣ प्रश्न पढ़ें और दिए गए डेटा को पहचानें।</p>
      <p>2️⃣ उपयुक्त सूत्र लगाएँ।</p>
      <p>3️⃣ आवश्यक गणना करें।</p>
      <p>4️⃣ उत्तर सत्यापित करें: ${q.correct}</p>
      <p><i>${q.exp}</i></p>
    </div>
  `;
  AnjaliVoice.speak(`आइए इस प्रश्न का क्रमबद्ध हल देखते हैं।`);
}

/*****************************************************
 * 🔹 अगला प्रश्न
 *****************************************************/
nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (modeSelect.value === "step") showStepByStep();
  else showQuestion();
});

/*****************************************************
 * 🔹 प्रारंभिक कॉल
 *****************************************************/
window.addEventListener("DOMContentLoaded", () => {
  loadAllSubjects();
  AnjaliVoice.welcomeMessage();
});
