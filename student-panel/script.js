let quizData = {};
let currentIndex = 0;
let currentMode = "";
let selectedSubject = "";
let selectedSubtopic = "";

window.addEventListener("DOMContentLoaded", () => {
  speak("नमस्ते विद्यार्थी! मैं अंजली हूँ, चलिए शुरू करें आपकी ज्ञान यात्रा।");
  loadSubjects();
});

function speak(text) {
  const synth = window.speechSynthesis;
  const voiceCheck = setInterval(() => {
    const voices = synth.getVoices();
    if (voices.length > 0) {
      clearInterval(voiceCheck);
      let femaleVoice = voices.find(v =>
        v.lang.startsWith("hi") || v.name.includes("Google हिन्दी")
      );
      const utter = new SpeechSynthesisUtterance(text);
      utter.pitch = 1.1;
      utter.rate = 0.95;
      utter.voice = femaleVoice || voices[0];
      synth.speak(utter);
    }
  }, 300);
}

function loadSubjects() {
  const subjectDropdown = document.getElementById("subject");
  const subjects = ["General Knowledge", "General Hindi", "Numerical & Mental Ability", "Mental Aptitude / Reasoning"];
  subjects.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub;
    opt.textContent = sub;
    subjectDropdown.appendChild(opt);
  });
}

function loadSubtopics() {
  const subject = document.getElementById("subject").value;
  const subDropdown = document.getElementById("subtopic");
  subDropdown.innerHTML = "<option value=''>-- उप-विषय चुनें --</option>";

  fetch(`../data/${subject.toLowerCase().replace(/ & | /g, "_")}.json`)
    .then(res => res.json())
    .then(data => {
      quizData = data.subtopics;
      Object.keys(quizData).forEach(sub => {
        const opt = document.createElement("option");
        opt.value = sub;
        opt.textContent = sub;
        subDropdown.appendChild(opt);
      });

      document.getElementById("modeBox").querySelectorAll(".modeBtn").forEach(btn => btn.classList.add("hidden"));
      if (subject === "General Knowledge") {
        document.getElementById("studyBtn").classList.remove("hidden");
        document.getElementById("quizBtn").classList.remove("hidden");
      } else {
        document.getElementById("studyBtn").classList.remove("hidden");
      }
    });
}

function startStudy() {
  selectedSubject = document.getElementById("subject").value;
  selectedSubtopic = document.getElementById("subtopic").value;
  currentMode = "study";
  showQuestion();
}

function startQuiz() {
  selectedSubject = document.getElementById("subject").value;
  selectedSubtopic = document.getElementById("subtopic").value;
  currentMode = "quiz";
  showQuestion();
}

function showQuestion() {
  const box = document.getElementById("questionBox");
  box.classList.remove("hidden");
  document.getElementById("optionsBox").classList.add("hidden");
  document.getElementById("explanationText").classList.add("hidden");

  const subData = quizData[selectedSubtopic];
  if (!subData) return;

  if (currentMode === "study") {
    const list = subData.one_liner;
    const item = list[currentIndex];
    if (!item) return speak("अध्ययन समाप्त हुआ, बहुत अच्छा कार्य किया!");
    document.getElementById("questionText").innerText = `📘 ${item.q}`;
    speak(item.q);
  }

  if (currentMode === "quiz") {
    const list = subData.mcq;
    const item = list[currentIndex];
    if (!item) return speak("क्विज समाप्त हुआ! आपने बहुत अच्छा प्रदर्शन किया!");
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

function checkAnswer(selected, correct, exp) {
  if (selected.toUpperCase() === correct.toUpperCase()) {
    speak("आपका उत्तर सही है, बहुत अच्छा!");
  } else {
    speak("मैं सही उत्तर और व्याख्या बता रही हूँ, इसे याद कर लेना।");
  }
  document.getElementById("explanationText").innerText = exp || "";
  document.getElementById("explanationText").classList.remove("hidden");
}

function nextQuestion() {
  currentIndex++;
  showQuestion();
}

function resetPanel() {
  window.location.reload();
          }
