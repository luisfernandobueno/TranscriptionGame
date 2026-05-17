const params = new URLSearchParams(window.location.search);
const lang = params.get("lang");
const mode = params.get("mode");

const language = document.getElementById("language");

const display = document.getElementById("textDisplay");
const input = document.getElementById("userInput");
const nextBtn = document.getElementById("next");

/* =========================
   🔥 FIX MOBILE KEYBOARD / VIEWPORT
========================= */

function updateViewportHeight() {
  const height = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  document.documentElement.style.setProperty(
    "--app-height",
    `${height}px`
  );
}

updateViewportHeight();

window.visualViewport?.addEventListener(
  "resize",
  updateViewportHeight
);

window.addEventListener(
  "orientationchange",
  updateViewportHeight
);

/* 🔥 KEEP INPUT VISIBLE */

input.addEventListener("focus", () => {
  setTimeout(() => {
    input.scrollIntoView({
      block: "nearest",
      behavior: "smooth"
    });
  }, 300);
});

let words = [];
let currentWord = 0;
let data = null;
let currentKeyIndex = 0;
let validKeys = [];

/* =========================
   🔒 PREVENT MOBILE KEYBOARD ISSUES
========================= */

input.setAttribute("autocapitalize", "none");
input.setAttribute("autocomplete", "off");
input.setAttribute("autocorrect", "off");
input.setAttribute("spellcheck", "false");

/* =========================
   LANGUAGE LABEL + FLAGS
========================= */

function updateLanguageLabel(activeLang) {
  const map = {
    en: { label: "English", flag: "🇬🇧" },
    pt: { label: "Português", flag: "🇧🇷" },
    it: { label: "Italiano", flag: "🇮🇹" },
    fr: { label: "Français", flag: "🇫🇷" },
    de: { label: "Deutsch", flag: "🇩🇪" },
    math: { label: "Math", flag: "🧮" }
  };

  const langData = map[activeLang];

  language.innerHTML = `
    <hp>${langData ? `${langData.flag} ${langData.label}` : activeLang}</hp>
  `;
}

/* =========================
   🧮 MATH MODE LOGIC
========================= */

let mathAnswer = null;
let mathLevel = 1;

function generateMathProblem() {
  let a, b, op, result;

  if (mathLevel < 4) {
    a = rand(1, 10);
    b = rand(1, 10);
    op = ["+", "-"][rand(0, 1)];
  } else if (mathLevel < 7) {
    a = rand(2, 12);
    b = rand(2, 12);
    op = ["+", "-", "×"][rand(0, 2)];
  } else {
    b = rand(1, 10);
    result = rand(2, 12);
    a = b * result;
    op = "÷";
  }

  switch (op) {
    case "+":
      mathAnswer = a + b;
      break;

    case "-":
      mathAnswer = a - b;
      break;

    case "×":
      mathAnswer = a * b;
      break;

    case "÷":
      mathAnswer = a / b;
      break;
  }

  display.textContent = `${a} ${op} ${b} = ?`;

  input.value = "";
  input.focus();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* =========================
   🧮 MATH INPUT HANDLING
========================= */

function handleMathInput() {
  const value = input.value.trim();

  if (value === "") return;

  if (Number(value) === mathAnswer) {
    display.style.color = "#2ecc71";

    setTimeout(() => {
      display.style.color = "";
      mathLevel++;
      generateMathProblem();
    }, 600);
  }
}

/* =========================
   🎮 TRANSCRIPTION MODE
========================= */

function prepareKeys() {
  const keys = Object.keys(data);

  if (lang === "rm") {
    validKeys = keys;
  } else {
    validKeys = keys.filter(k => data[k][lang]);
  }

  currentKeyIndex = Math.floor(
    Math.random() * validKeys.length
  );
}

function resolveLanguageForKey(key) {
  const availableLangs = Object.keys(data[key]);

  if (lang === "rm") {
    return availableLangs[
      Math.floor(Math.random() * availableLangs.length)
    ];
  }

  return data[key][lang] ? lang : null;
}

function resetInputSafely() {
  input.value = "";

  requestAnimationFrame(() => {
    input.focus();
    input.setSelectionRange(0, 0);
  });
}

/* =========================
   🔥 AUTO-FOLLOW ACTIVE LINE
========================= */

function scrollActiveWordToTop() {
  if (window.innerWidth > 768) return;

  const active = display.querySelector(".word-active");

  if (!active) return;

  const containerTop =
    display.getBoundingClientRect().top;

  const activeTop =
    active.getBoundingClientRect().top;

  const offset = activeTop - containerTop;

  display.scrollBy({
    top: offset,
    behavior: "smooth"
  });
}

function updateActiveWord() {
  [...display.children].forEach((span, index) => {
    span.classList.toggle(
      "word-active",
      index === currentWord
    );
  });

  scrollActiveWordToTop();
}

function startGame() {
  if (!validKeys.length) return;

  const key = validKeys[currentKeyIndex];

  const activeLang =
    resolveLanguageForKey(key);

  if (!activeLang) {
    goNext();
    return;
  }

  updateLanguageLabel(activeLang);

  const text = data[key][activeLang];

  words = text.split(" ");

  currentWord = 0;

  display.innerHTML = "";

  words.forEach(word => {
    const span = document.createElement("span");

    span.textContent = word + " ";

    span.className = "word";

    display.appendChild(span);
  });

  resetInputSafely();

  updateActiveWord();
}

/* =========================
   INPUT ROUTER
========================= */

input.addEventListener("input", () => {

  if (mode === "math") {
    handleMathInput();
    return;
  }

  let typed = input.value;

  const target = words[currentWord];

  const wordSpan =
    display.children[currentWord];

  if (typed.endsWith(" ")) {

    typed = typed.trim();

    input.value = typed;

    if (typed === target) {

      wordSpan.className = "word-flash";

      setTimeout(() => {
        wordSpan.className = "word-correct";
      }, 600);

      currentWord++;

      updateActiveWord();

      resetInputSafely();

      if (currentWord === words.length) {
        finishParagraph();
      }

    } else {

      wordSpan.className = "word-error";

      setTimeout(() => {
        wordSpan.textContent = target + " ";

        wordSpan.className =
          "word word-active";
      }, 800);

      resetInputSafely();
    }

    return;
  }

  wordSpan.innerHTML = "";

  for (let i = 0; i < target.length; i++) {

    const span =
      document.createElement("span");

    span.textContent = target[i];

    if (typed[i] === undefined) {
      span.className = "";
    }
    else if (typed[i] === target[i]) {
      span.className = "correct-letter";
    }
    else {
      span.className = "wrong-letter";
    }

    wordSpan.appendChild(span);
  }

  wordSpan.appendChild(
    document.createTextNode(" ")
  );
});

/* =========================
   PARAGRAPH FINISH
========================= */

function finishParagraph() {

  [...display.children].forEach(w => {
    w.style.color = "green";
  });

  setTimeout(goNext, 1500);
}

function goNext() {

  currentKeyIndex++;

  if (
    currentKeyIndex >= validKeys.length
  ) {
    currentKeyIndex = 0;
  }

  startGame();
}

if (nextBtn) {
  nextBtn.addEventListener(
    "click",
    goNext
  );
}

/* =========================
   INIT
========================= */

if (mode === "math") {

  updateLanguageLabel("math");

  generateMathProblem();

} else {

  fetch("data.json")
    .then(res => res.json())
    .then(json => {

      data = json;

      prepareKeys();

      startGame();
    });
}

/* =========================
   BACK
========================= */

function goBack() {
  window.location.href = "index.html";
}