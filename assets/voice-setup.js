/*****************************************************
 * 🎙️ Anjali Voice Engine – Common Voice Setup
 * कार्य: सभी Panels में Voice System को एक समान रखना
 *****************************************************/

const AnjaliVoice = {
  speak(text, pitch = 1.1, rate = 0.95) {
    if (!("speechSynthesis" in window)) {
      console.warn("❌ Speech Synthesis समर्थित नहीं।");
      return;
    }
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    let voice = voices.find(v => v.lang.startsWith("hi") || v.name.includes("Google हिन्दी"));
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voice || voices[0];
    utter.pitch = pitch;
    utter.rate = rate;
    utter.volume = 1;
    synth.cancel();
    synth.speak(utter);
  },

  welcomeMessage() {
    const msg = "नमस्ते, मैं अंजली हूँ — आपका स्वागत है Anjali Quiz Bank में। सीखना शुरू करें और सफलता को अपनी आदत बनाएं।";
    this.speak(msg);
  },

  motivate() {
    const quotes = [
      "मन के हारे हार है, मन के जीते जीत।",
      "हर कठिनाई में एक अवसर छिपा होता है।",
      "सीखना बंद मत करो, क्योंकि जीवन परीक्षा है।"
    ];
    const msg = quotes[Math.floor(Math.random() * quotes.length)];
    this.speak(msg);
  }
};

// ✅ जब पेज लोड हो, तो वॉइस इनिशियलाइज़ करें
window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window.location.pathname.includes("student-panel")) {
      AnjaliVoice.speak("कौन सा विषय पढ़ना चाहेंगे?");
    } else if (window.location.pathname.includes("control-panel")) {
      AnjaliVoice.speak("कंट्रोल पैनल सक्रिय है। प्रश्न जोड़ने के लिए तैयार हैं।");
    } else {
      AnjaliVoice.welcomeMessage();
    }
  }, 800);
});
