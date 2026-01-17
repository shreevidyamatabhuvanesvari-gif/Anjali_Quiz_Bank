let quizData = {};
let currentIndex = 0;
let currentMode = "";
let selectedSubject = "";
let selectedSubtopic = "";

// 🔹 अंजली की वाणी
function speak(text) {
  const synth = window.speechSynthesis;
  const speakNow = () => {
    const voices = synth.getVoices();
    const female = voices.find(v => v.lang.startsWith("hi") || v.name.includes("Google हिन्दी"));
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = female || voices[0];
    utter.rate = 0.9;
    utter.pitch = 1.1;
    synth.speak(utter);
  };
  if (synth.getVoices().length === 0) {
    synth.onvoiceschanged = speakNow;
  } else speakNow();
}

// 🔹 पेज लोड पर
window.addEventListener("DOMContentLoaded", () => {
  speak("नमस्ते विद्यार्थी, मैं अंजली हूँ। बताइए, कौन सा विषय पढ़ना चाहते हैं?");
  loadSubjects();
});

// 🔹 विषय लोड करें
function loadSubjects() {
  const subjectDropdown = document.getElementById("subject");
  const subjects = [
    "General Knowledge",
    "General Hindi",
    "Numerical & Mental Ability",
    "Mental Aptitude / Reasoning"
  ];
  subjects.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subjectDropdown.appendChild(opt);
  });
}

// 🔹 उप-विषय लोड करें
function loadSubtopics() {
  const subject = document.getElementById("subject").value;
  if (!subject) return;

  const subDropdown = document.getElementById("subtopic");
  subDropdown.innerHTML = "<option value=''>-- उप-विषय चुनें --</option>";

  // ✅ JSON path fix
  let fileName = "";
  if (subject === "General Knowledge") fileName = "general_knowledge.json";
  else if (subject === "General Hindi") fileName = "general_hindi.json";
  else if (subject === "Numerical & Mental Ability") fileName = "numerical_ability.json";
  else if (subject === "Mental Aptitude / Reasoning") fileName = "reasoning.json";

  fetch(`../data/${fileName}`)
    .then(res => res.json())
    .then(data => {
      quizData = data.subtopics;
      Object.keys(quizData).forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subDropdown.appendChild(opt);
      });

      document.getElementById("studyBtn").classList.add("hidden");
      document.getElementById("quizBtn").classList.add("hidden");

      if (subject === "General Knowledge") {
        document.getElementById("studyBtn").classList.remove("hidden");
        document.getElementById("quizBtn").classList.remove("hidden");
      } else {
        document.getElementById("studyBtn").classList.remove("hidden");
      }

      speak(`${subject} विषय चुना गया है, अब कृपया उपविषय चुनें।`);
    })
    .catch(() => alert("⚠️ डेटा लोड करने में समस्या!"));
}

// 🔹 Study Mode शुरू करें
function startStudy() {
  selectedSubject = document.getElementById("subject").value;
  selectedSubtopic = document.getElementById("subtopic").value;
  if (!selectedSubtopic) return alert("कृपया उपविषय चुनें!");
  currentMode = "study";
  currentIndex = 0;
  showQuestion();
}

// 🔹 Quiz Mode शुरू करें
function startQuiz() {
  selectedSubject = document.getElementById("subject").value;
  selectedSubtopic = document.getElementById("subtopic").value;
  if (!selectedSubtopic) return alert("कृपया उपविषय चुनें!");
  currentMode = "quiz";
  currentIndex = 0;
  showQuestion();
}

// 🔹 प्रश्न दिखाएँ
function showQuestion() {
  const subData = quizData[selectedSubtopic];
  if (!subData) return;

  const qBox = document.getElementById("questionBox");
  qBox.classList.remove("hidden");

  if (currentMode === "study") {
    const list = subData.one_liner;
    const item = list[currentIndex];
    if (!item) {
      speak("अध्ययन समाप्त हुआ, बहुत अच्छा किया!");
      return;
    }
    document.getElementById("questionText").innerText = item.q;
    speak(item.q);
  }

  if (currentMode === "quiz") {
    const list = subData.mcq;
    const item = list[currentIndex];
    if (!item) {
      speak("क्विज़ समाप्त हुआ! बहुत अच्छा प्रदर्शन किया।");
      return;
    }

    document.getElementById("questionText").innerText = item.q;
    speak(item.q);

    const optBox = document.getElementById("optionsBox");
    optBox.classList.remove("hidden");
    optBox.innerHTML = "";
    ["a", "b", "c", "d"].forEach(k => {
      const btn = document.createElement("button");
      btn.textContent = item[k];
      btn.onclick = () => checkAnswer(k, item.correct, item.exp);
      optBox.appendChild(btn);
    });
  }

  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("backBtn").classList.remove("hidden");
}

// 🔹 उत्तर जाँचें
function checkAnswer(selected, correct, exp) {
  const expBox = document.getElementById("explanationText");
  if (selected.toUpperCase() === correct.toUpperCase()) {
    speak("आपका उत्तर सही है, बहुत अच्छा!");
  } else {
    speak("यह उत्तर गलत है, ध्यान दें:");
  }
  expBox.innerText = exp || "व्याख्या उपलब्ध नहीं।";
  expBox.classList.remove("hidden");
}

// 🔹 अगला प्रश्न
function nextQuestion() {
  currentIndex++;
  showQuestion();
}

// 🔹 पैनल रीसेट
function resetPanel() {
  window.location.reload();
          }
