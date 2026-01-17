let quizData = {};
let currentIndex = 0;
let currentMode = "";
let selectedSubject = "";
let selectedSubtopic = "";

// 🔊 अंजली की आवाज़
function speak(text) {
  if (!text) return;
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
  if (synth.getVoices().length === 0) synth.onvoiceschanged = speakNow;
  else speakNow();
}

// 🔊 “सुनकर पढ़ें” बटन — उपयोगकर्ता की अनुमति से वॉयस चालू
function forceSpeak() {
  speak("नमस्ते विद्यार्थी, अब मैं आपको सुनकर पढ़ाऊंगी। बताइए कौन सा विषय पढ़ना चाहेंगे?");
}

// 🔹 पेज लोड पर
window.addEventListener("DOMContentLoaded", () => {
  speak("नमस्ते विद्यार्थी, मैं अंजली हूँ। बताइए, कौन सा विषय पढ़ना चाहेंगे?");
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

// 🔹 उपविषय लोड करें
function loadSubtopics() {
  const subject = document.getElementById("subject").value;
  if (!subject) return;

  const subDropdown = document.getElementById("subtopic");
  subDropdown.innerHTML = "<option value=''>-- उप-विषय चुनें --</option>";

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

      document.querySelectorAll(".modeBtn").forEach(btn => btn.classList.add("hidden"));
      if (subject === "General Knowledge") {
        document.getElementById("studyBtn").classList.remove("hidden");
        document.getElementById("quizBtn").classList.remove("hidden");
      } else if (subject === "Numerical & Mental Ability" || subject === "Mental Aptitude / Reasoning") {
        document.getElementById("stepBtn").classList.remove("hidden");
      } else {
        document.getElementById("studyBtn").classList.remove("hidden");
      }

      speak(`${subject} विषय चुना गया है। अब कृपया उपविषय चुनें।`);
    })
    .catch(() => alert("⚠️ डेटा लोड करने में समस्या!"));
}

// 🔹 Study Mode
function startStudy() {
  prepareMode("study");
}

// 🔹 Quiz Mode
function startQuiz() {
  prepareMode("quiz");
}

// 🔹 Step Mode
function startStepMode() {
  prepareMode("step");
}

// 🔹 मोड सेटअप
function prepareMode(mode) {
  selectedSubject = document.getElementById("subject").value;
  selectedSubtopic = document.getElementById("subtopic").value;
  if (!selectedSubtopic) return alert("कृपया उपविषय चुनें!");
  currentMode = mode;
  currentIndex = 0;
  showQuestion();
}

// 🔹 प्रश्न दिखाएँ
function showQuestion() {
  const subData = quizData[selectedSubtopic];
  if (!subData) return;

  const qBox = document.getElementById("questionBox");
  const expBox = document.getElementById("explanationText");
  const optBox = document.getElementById("optionsBox");
  qBox.classList.remove("hidden");
  expBox.classList.add("hidden");
  optBox.classList.add("hidden");

  if (currentMode === "step") qBox.classList.add("stepModeActive");
  else qBox.classList.remove("stepModeActive");

  if (currentMode === "study") {
    const list = subData.one_liner;
    const item = list[currentIndex];
    if (!item) return speak("अध्ययन समाप्त हुआ!");
    document.getElementById("questionText").innerText = item.q;
    speak(item.q);
  }

  if (currentMode === "quiz") {
    const list = subData.mcq;
    const item = list[currentIndex];
    if (!item) return speak("क्विज समाप्त हुआ!");
    document.getElementById("questionText").innerText = item.q;
    speak(item.q);

    optBox.classList.remove("hidden");
    optBox.innerHTML = "";
    ["a", "b", "c", "d"].forEach(k => {
      const btn = document.createElement("button");
      btn.textContent = item[k];
      btn.onclick = () => checkAnswer(k, item.correct, item.exp);
      optBox.appendChild(btn);
    });
  }

  if (currentMode === "step") {
    const list = subData.mcq;
    const item = list[currentIndex];
    if (!item) return speak("सत्र समाप्त हुआ। बहुत अच्छा!");
    document.getElementById("questionText").innerText = item.q;
    expBox.innerText = "🧩 चरण 1: प्रश्न को समझें\n🧮 चरण 2: सूत्र लागू करें\n✅ चरण 3: सही उत्तर चुनें।";
    expBox.classList.remove("hidden");
    speak(`चलिये चरणबद्ध समाधान शुरू करें। प्रश्न है ${item.q}`);
  }

  document.getElementById("nextBtn").classList.remove("hidden");
  document.getElementById("backBtn").classList.remove("hidden");
}

// 🔹 उत्तर जाँचें
function checkAnswer(selected, correct, exp) {
  const expBox = document.getElementById("explanationText");
  if (selected.toUpperCase() === correct.toUpperCase()) {
    speak("सही उत्तर! बहुत बढ़िया किया।");
  } else {
    speak(`गलत उत्तर। सही उत्तर है विकल्प ${correct}.`);
  }
  expBox.innerText = exp || "व्याख्या उपलब्ध नहीं।";
  expBox.classList.remove("hidden");
  speak(expBox.innerText);
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
