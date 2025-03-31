// 🌌 Load random background image
fetch('./scenicImages.json')
  .then(res => res.json())
  .then(images => {
    const random = images[Math.floor(Math.random() * images.length)];
    document.getElementById("bg").style.backgroundImage = `url('./assets/${random}')`;
  });

// 🎯 DOM Elements
const goalInput = document.getElementById('goalInput');
const goalList = document.getElementById('goalList');
const greetingEl = document.getElementById('greeting');
const promptEl = document.getElementById('prompt');
const nameInput = document.getElementById("nameInput");
const nameEntry = document.getElementById("nameEntry");
const mainApp = document.getElementById("mainApp");
const menuBtn = document.getElementById('menuBtn');
const dropdown = document.getElementById('dropdown');
const todoContainer = document.getElementById("todoContainer");
const cursor = document.querySelector(".blinking-cursor");

// ⏰ Update the time display
function updateTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  document.getElementById('time').textContent = `${hours}:${minutes}`;
}

// 👋 Time-based greeting
function greetingTime(name) {
  const hour = new Date().getHours();
  const period = hour >= 5 && hour < 12 ? "morning"
               : hour >= 12 && hour < 18 ? "afternoon"
               : hour >= 18 ? "evening"
               : "early_morning";

  fetch('./greetPrompts.json')
    .then(res => res.json())
    .then(data => {
      const msg = data[period][Math.floor(Math.random() * data[period].length)];
      greetingEl.innerHTML = `${msg}, <span id="name">${name}</span>.`;

      document.getElementById('name').addEventListener('dblclick', () => {
        const newName = prompt("Change your name:");
        if (newName) {
          const trimmed = newName.trim();
          localStorage.setItem("username", trimmed);
          document.getElementById("name").textContent = trimmed;
        }
      });
    });
}

// 🧠 LocalStorage helpers
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getActiveGoals() {
  return JSON.parse(localStorage.getItem("activeGoals") || "[]");
}

function saveActiveGoal(text) {
  const goals = getActiveGoals();
  goals.push(text);
  localStorage.setItem("activeGoals", JSON.stringify(goals));
}

function removeActiveGoal(text) {
  const goals = getActiveGoals().filter(goal => goal !== text);
  localStorage.setItem("activeGoals", JSON.stringify(goals));
}

function logCompletedGoal(text) {
  const key = getTodayKey();
  const goals = JSON.parse(localStorage.getItem(key) || "[]");
  goals.push(text);
  localStorage.setItem(key, JSON.stringify(goals));
  renderCompletedGoal(text);
}

function removeGoalFromStorage(text) {
  const key = getTodayKey();
  const goals = JSON.parse(localStorage.getItem(key) || "[]").filter(goal => goal !== text);
  localStorage.setItem(key, JSON.stringify(goals));
}

function maybeHideContainer() {
  if (goalList.children.length === 0) {
    todoContainer.classList.remove("visible");
  }
}

function renderCompletedGoal(text) {
    const list = document.getElementById("completedList");
  
    const item = document.createElement("div");
    item.className = "goal-item";
  
    // Remove button first
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✖";
    removeBtn.className = "remove-btn";
    removeBtn.setAttribute("aria-label", "Remove completed goal");
  
    // Goal text
    const goalText = document.createElement("span");
    goalText.className = "goal-text";
    goalText.textContent = text;
  
    // Remove logic
    removeBtn.addEventListener("click", () => {
      list.removeChild(item);
      removeGoalFromStorage(text);
    });
  
    // Order matters here 👇
    item.appendChild(removeBtn);  // ✖ goes first
    item.appendChild(goalText);  // then text
    list.appendChild(item);
  }
  
  

function addGoal(text, save = true) {
  const goalItem = document.createElement("div");
  goalItem.className = "goal-item highlighted shimmer";

  goalItem.innerHTML = `
    <label class="custom-checkbox">
      <input type="checkbox" />
      <span class="checkmark"></span>
      <span class="goal-text">${text}</span>
    </label>
  `;

  document.querySelectorAll(".goal-item").forEach(item =>
    item.classList.remove("highlighted")
  );

  const checkBox = goalItem.querySelector("input[type='checkbox']");
  checkBox.addEventListener("change", () => {
    if (checkBox.checked) {
      logCompletedGoal(text);
      removeActiveGoal(text);
      setTimeout(() => {
        goalList.removeChild(goalItem);
        maybeHideContainer();
      }, 200);
    }
  });

  goalList.prepend(goalItem);
  todoContainer.classList.add("visible");

  if (save) saveActiveGoal(text);

  // 💥 Visual surprise effect
  goalItem.animate([
    { transform: 'scale(1.2)', opacity: 0 },
    { transform: 'scale(1)', opacity: 1 }
  ], {
    duration: 400,
    easing: 'ease-out'
  });
}

function handleGoalInput(e) {
  if (e.key === "Enter" && goalInput.value.trim()) {
    addGoal(goalInput.value.trim());
    goalInput.value = "";
    cursor.style.display = "inline"; // reset cursor
  }
}

function typePromptText(text, elementId, speed = 50) {
  const el = document.getElementById(elementId);
  let i = 0;
  el.textContent = "";

  const interval = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

function startApp(name) {
  greetingTime(name);
  updateTime();
  setInterval(updateTime, 60000);

  getActiveGoals().forEach(text => addGoal(text, false));
  goalInput.addEventListener("input", () => {
    cursor.style.display = goalInput.value ? "none" : "inline";
  });
  goalInput.addEventListener("keypress", handleGoalInput);

  const todayKey = getTodayKey();
  const completed = JSON.parse(localStorage.getItem(todayKey) || "[]");
  completed.forEach(renderCompletedGoal);

  menuBtn.addEventListener('mouseenter', () => {
    menuBtn.innerText = '🐵';
    dropdown.classList.remove("hidden");
  });

  dropdown.addEventListener('mouseleave', () => {
    menuBtn.innerText = '🐸';
    dropdown.classList.add("hidden");
  });

  typePromptText("What will you create today?", "prompt", 60);
}

function showNameInputMode() {
  nameInput.placeholder = "example...";
  nameEntry.classList.remove("hidden");
  mainApp.classList.add("hidden");

  nameInput.addEventListener("keypress", function handler(e) {
    if (e.key === "Enter" && nameInput.value.trim()) {
      const name = nameInput.value.trim();
      localStorage.setItem("username", name);
      nameInput.removeEventListener("keypress", handler);
      nameInput.value = "";
      nameEntry.classList.add("hidden");
      mainApp.classList.remove("hidden");
      startApp(name);
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  updateTime();
  setInterval(updateTime, 60000);

  const savedName = localStorage.getItem("username");

  if (savedName) {
    nameEntry.classList.add("hidden");
    mainApp.classList.remove("hidden");
    startApp(savedName);
  } else {
    showNameInputMode();
  }
});
