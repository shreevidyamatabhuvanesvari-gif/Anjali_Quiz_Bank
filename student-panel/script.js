/*******************************************************
 * 🎤 Anjali Quiz Bank – Student Voice Mode
 * Data Source: GitHub JSON
 * Features: Speak Question, Listen Answer, React
 *******************************************************/

const dataFiles = [
  "../data/general_knowledge.json",
  "../data/general_hindi.json",
  "../data/numerical_ability.json",
  "../data/reasoning.json"
];

let allQuestions = [];
let currentQuestion = 0;
let synth = window.speechSynthesis;
let recognition;
let voices = [];

/*********************
 * 🔹 आवाज़ Initialization
 *********************/
function initVoice() {
  voices = synth.getVoices();
  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = () => {
      voices = synth.getVoices();
    };
  }
}

/*********************
 * 🔹 अंजली बोले
 *********************/
function anjaliSpeak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "hi-IN";
  utter.pitch = 1.1;
  utter.rate = 0.95;
  utter.volume = 1;
  const femaleVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.lang.startsWith("hi"));
  utter.voice = femaleVoice || voices[0];
  synth.speak(utter);
}

/*********************
 * 🔹 GitHub से JSON लोड करें
 *********************/
async function loadQuestions() {
  for (const file of dataFiles) {
    try {
      const res = await fetch(file);
      const json = await res.json();
      Object.values(json.subtopics).forEach(sub => {
        if (sub.mcq && sub.mcq.length) allQuestions.push(...sub.mcq);
      });
    } catch (err) {
      console.warn("⚠️ डेटा लोड त्रुटि:", file, err);
    }
  }
  startQuiz();
}

/*********************
 * 🔹 Quiz शुरू करें
 *********************/
function startQuiz() {
  if (allQuestions.length === 0) {
    document.getElementById("questionBox").textContent = "❌ कोई प्रश्न उपलब्ध नहीं है।";
    return;
  }
  currentQuestion = 0;
  askQuestion();
}

/*********************
 * 🔹 प्रश्न पूछें
 *********************/
function askQuestion() {
  const q = allQuestions[currentQuestion];
  const qBox = document.getElementById("questionBox");
  const oBox = document.getElementById("optionsBox");
  const responseBox = document.getElementById("anjaliResponse");

  qBox.textContent = `Q${currentQuestion + 1}) ${q.q}`;
  oBox.innerHTML = `
    <button onclick="checkAnswer('A')">A) ${q.a}</button>
    <button onclick="checkAnswer('B')">B) ${q.b}</button>
    <button onclick="checkAnswer('C')">C) ${q.c}</button>
    <button onclick="checkAnswer('D')">D) ${q.d}</button>
  `;
  responseBox.textContent = "";

  anjaliSpeak(`प्रश्न ${currentQuestion + 1}. ${q.q}. विकल्प हैं — A) ${q.a}, B) ${q.b}, C) ${q.c}, D) ${q.d}`);
}

/*********************
 * 🔹 उत्तर जांचें
 *********************/
function checkAnswer(selected) {
  const q = allQuestions[currentQuestion];
  const responseBox = document.getElementById("anjaliResponse");

  if (selected === q.correct.trim().toUpperCase()) {
    responseBox.textContent = "✅ आपका उत्तर सही है! बहुत अच्छा!";
    anjaliSpeak("आपका उत्तर सही है, बहुत अच्छा!");
  } else {
    responseBox.textContent = `❌ सही उत्तर है ${q.correct}. ${q.exp}`;
    anjaliSpeak(`गलत उत्तर। सही उत्तर है ${q.correct}. ${q.exp}`);
  }

  setTimeout(() => {
    currentQuestion++;
    if (currentQuestion < allQuestions.length) askQuestion();
    else {
      responseBox.textContent = "🎉 सभी प्रश्न समाप्त! बहुत बढ़िया प्रयास!";
      anjaliSpeak("सभी प्रश्न समाप्त हुए, बहुत अच्छा प्रयास!");
    }
  }, 7000);
}

/*********************
 * 🔹 आवाज़ से उत्तर लें
 *********************/
function startListening() {
  if (!('webkitSpeechRecognition' in window)) {
    alert("❌ आपका ब्राउज़र वॉयस रिकग्निशन सपोर्ट नहीं करता।");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();
  anjaliSpeak("आपका उत्तर सुन रही हूँ...");

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    if (transcript.includes("ए") || transcript.includes("option a")) checkAnswer("A");
    else if (transcript.includes("बी") || transcript.includes("option b")) checkAnswer("B");
    else if (transcript.includes("सी") || transcript.includes("option c")) checkAnswer("C");
    else if (transcript.includes("डी") || transcript.includes("option d")) checkAnswer("D");
    else anjaliSpeak("उत्तर स्पष्ट नहीं था, कृपया दोबारा कहें।");
  };

  recognition.onerror = () => {
    anjaliSpeak("कुछ समस्या हुई, कृपया फिर प्रयास करें।");
  };
}

/*********************
 * 🔹 Initialize
 *********************/
window.addEventListener("DOMContentLoaded", () => {
  initVoice();
  loadQuestions();

  document.getElementById("micBtn").addEventListener("click", startListening);

  setTimeout(() => {
    anjaliSpeak("नमस्ते! चलिए शुरू करते हैं आज का वॉयस क्विज़। ध्यान से सुनिए और उत्तर दीजिए।");
  }, 1500);
});
