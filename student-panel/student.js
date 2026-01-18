/*****************************************************
 * 🎓 Student Panel – Voice Quiz Mode + Math Solver
 * ✅ Voice Enabled | ✅ GK/One-Liner | ✅ Step-by-Step Mode
 *****************************************************/

let allData = {};
let currentQuestions = [];
let currentIndex = 0;
let quizMode = "mcq";

/*****************************************************
 * 🔹 Load Subject Data
 *****************************************************/
async function loadSubjects() {
  const files = [
    "../data/general_knowledge.json",
    "../data/general_hindi.json",
    "../data/numerical_ability.json",
    "../data/reasoning.json"
  ];
  for (let f of files) {
    try {
      const res = await fetch(f);
      const json = await res.json();
      allData[json.subject] = json.subtopics;
    } catch (e) {
      console.warn("⚠️ लोड त्रुटि:", f, e);
    }
  }
  populateSubjects();
}
function populateSubjects() {
  const subject = document.getElementById("subject");
  subject.innerHTML = `<option value="">-- विषय चुनें --</option>`;
  Object.keys(allData).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    subject.appendChild(opt);
  });
}
document.getElementById("subject").addEventListener("change", () => {
  const subs = allData[document.getElementById("subject").value] || {};
  const subSelect = document.getElementById("subtopic");
  subSelect.innerHTML = `<option value="">-- उप-विषय चुनें --</option>`;
  Object.keys(subs).forEach(st => {
    const opt = document.createElement("option");
    opt.value = st;
    opt.textContent = st;
    subSelect.appendChild(opt);
  });
});

/*****************************************************
 * 🔹 Start Quiz / Study
 *****************************************************/
document.getElementById("startQuiz").addEventListener("click", () => {
  const subject = document.getElementById("subject").value;
  const subtopic = document.getElementById("subtopic").value;
  if (!subject || !subtopic) return alert("⚠️ कृपया विषय और उपविषय चुनें।");

  const data = allData[subject]?.[subtopic];
  if (!data || (!data.mcq.length && !data.one_liner.length))
    return alert("❌ कोई प्रश्न उपलब्ध नहीं।");

  quizMode = data.mcq.length ? "mcq" : "one_liner";
  currentQuestions = data[quizMode];
  currentIndex = 0;

  document.querySelector(".selectors").classList.add("hidden");
  document.getElementById("quizBox").classList.remove("hidden");
  showQuestion();
});

/*****************************************************
 * 🔹 Show Question
 *****************************************************/
function showQuestion() {
  const qData = currentQuestions[currentIndex];
  const qBox = document.getElementById("questionText");
  const optBox = document.getElementById("options");
  const solBox = document.getElementById("solutionBox");

  qBox.textContent = `${currentIndex + 1}. ${qData.q}`;
  optBox.innerHTML = "";
  solBox.classList.add("hidden");

  if (quizMode === "mcq") {
    ["a", "b", "c", "d"].forEach(opt => {
      if (qData[opt]) {
        const div = document.createElement("div");
        div.textContent = `${opt.toUpperCase()}) ${qData[opt]}`;
        div.onclick = () => checkAnswer(opt, qData.correct);
        optBox.appendChild(div);
      }
    });
  } else {
    solBox.textContent = qData.q;
    solBox.classList.remove("hidden");
  }

  speakText(qData.q);
}
function checkAnswer(sel, correct) {
  const solBox = document.getElementById("solutionBox");
  solBox.classList.remove("hidden");
  solBox.textContent = sel.toUpperCase() === correct.toUpperCase()
    ? "✅ सही उत्तर!"
    : `❌ गलत! सही उत्तर: ${correct}`;
  speakText(solBox.textContent);
}
document.getElementById("nextBtn").addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < currentQuestions.length) showQuestion();
  else {
    alert("🎉 क्विज समाप्त!");
    window.location.reload();
  }
});

/*****************************************************
 * 🔹 Voice System
 *****************************************************/
function speakText(text) {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const female = voices.find(v => v.lang.startsWith("hi") || v.name.toLowerCase().includes("female")) || voices[0];
  const utter = new SpeechSynthesisUtterance(text);
  utter.voice = female;
  utter.pitch = 1;
  utter.rate = 0.9;
  synth.cancel();
  synth.speak(utter);
}
document.getElementById("readMode").addEventListener("click", () => {
  speakText("आपने सुनकर पढ़ें मोड चुना है। चलिए शुरू करते हैं।");
});

/*****************************************************
 * 🔹 Initialize
 *****************************************************/
window.addEventListener("DOMContentLoaded", loadSubjects);
