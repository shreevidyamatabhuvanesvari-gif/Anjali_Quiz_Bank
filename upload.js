/*****************************************************
 * 📘 Anjali Quiz Bank – upload.js
 * Control Panel → GitHub JSON Auto Merge System
 * ✅ बिना Token भी कार्यरत (Token वैकल्पिक)
 *****************************************************/

// 🔹 अपनी जानकारी यहाँ डालें
const GITHUB_USERNAME = "YOUR_GITHUB_USERNAME";   // अपना GitHub यूज़रनेम
const GITHUB_REPO = "Anjali_Quiz_Bank";           // Repo का नाम
const GITHUB_BRANCH = "main";                     // Branch
const GITHUB_TOKEN = ""; // 🔒 वैकल्पिक — Token लिखें (optional)

/*****************************************************
 * 🔹 Repo में JSON का Base Path
 *****************************************************/
const DATA_PATH = "data/";

/*****************************************************
 * 🔹 लोकल डेटा लोड करना (Control Panel से)
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
 * 🔹 GitHub से JSON फाइल fetch करना (Token optional)
 *****************************************************/
async function fetchFromGitHub(fileName) {
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

    // Merge MCQ
    updated.subtopics[sub].mcq.push(...subData.mcq);
    // Merge One-Liners
    updated.subtopics[sub].one_liner.push(...subData.one_liner);
  }

  return updated;
}

/*****************************************************
 * 🔹 अपडेटेड JSON GitHub पर वापस अपलोड करना
 *****************************************************/
async function uploadToGitHub(fileName, data, sha = null) {
  const url = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${DATA_PATH}${fileName}`;
  const headers = {
    "Content-Type": "application/json",
  };
  if (GITHUB_TOKEN) headers["Authorization"] = `token ${GITHUB_TOKEN}`;

  const message = `📤 Updated ${fileName} from Anjali Control Panel`;
  const content = btoa(JSON.stringify(data, null, 2));

  const payload = {
    message,
    content,
    branch: GITHUB_BRANCH,
    sha: sha,
  };

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
 * 🔹 मुख्य Function – सबकुछ संभालेगा
 *****************************************************/
async function uploadAll() {
  const localData = await getLocalData();
  if (!localData) return;

  const fileMap = {
    "General Knowledge": "general_knowledge.json",
    "General Hindi": "general_hindi.json",
    "Numerical & Mental Ability": "numerical_ability.json",
    "Mental Aptitude / Reasoning": "reasoning.json",
  };

  for (const subjectName in localData) {
    const fileName = fileMap[subjectName];
    if (!fileName) continue;

    console.log(`📥 Fetching: ${fileName}`);
    const { content: remoteContent, sha } = await fetchFromGitHub(fileName);

    const merged = mergeData(remoteContent, localData, subjectName);

    console.log(`📤 Uploading: ${fileName}`);
    await uploadToGitHub(fileName, merged, sha);
  }

  alert("✅ सभी प्रश्न GitHub पर सफलतापूर्वक अपलोड किए गए!");
  localStorage.removeItem("anjaliTempData");
}

/*****************************************************
 * 🔹 Control Panel से Trigger बटन
 *****************************************************/
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.createElement("button");
  btn.textContent = "⬆️ Upload to GitHub";
  btn.style.background = "#2d6a4f";
  btn.style.color = "white";
  btn.style.fontWeight = "bold";
  btn.style.marginTop = "12px";
  btn.onclick = uploadAll;
  document.querySelector(".container").appendChild(btn);

  // Token लिखने का विकल्प (Optional Field)
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
});
