// 🌌 Load random background image
fetch('./scenicImages.json')
  .then(res => res.json())
  .then(images => {
    const random = images[Math.floor(Math.random() * images.length)];
    document.getElementById("bg").style.backgroundImage = `
    linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)),
    url('./assets/${random}')
    `;
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
  
    removeBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent event bubbling
        
        // Fade out animation
        item.style.opacity = '0';
        item.style.transition = 'opacity 300ms ease-out';
        
        // Remove after animation completes
        setTimeout(() => {
            list.removeChild(item);
            removeGoalFromStorage(text);
        }, 300);
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
        // Fire confetti immediately from center of window
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { x: 0.5, y: 0.5 },
            zIndex: 9999
        });

        // 💥 Animate item out before removing
        goalItem.classList.add("goal-exit");
        goalItem.classList.add("removing");
      
        setTimeout(() => {
          logCompletedGoal(text);
          removeActiveGoal(text);
          goalList.removeChild(goalItem);
          maybeHideContainer();
        }, 500); // ⏳ matches the CSS animation duration
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

  const menuArea = document.getElementById('menuArea');

  menuArea.addEventListener('mouseenter', () => {
    dropdown.classList.remove("hidden");
  });
  
  menuArea.addEventListener('mouseleave', () => {
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

const focusBtn = document.getElementById("startFocusBtn");
const focusOverlay = document.getElementById("focusOverlay");
const focusTimer = document.getElementById("focusTimer");
const endFocusBtn = document.getElementById("endFocusBtn");
const rainToggle = document.getElementById("rainToggle");
const rainAudio = document.getElementById("rainAudio");

let focusInterval = null;
let remainingSeconds = 0;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function startFocusSession() {
  const mins = parseInt(document.getElementById("focusMinutes").value) || 60;
  remainingSeconds = mins * 60;

  const taskText = document.getElementById("focusTaskInput").value.trim() || "Unnamed task";
  document.getElementById("focusTaskDisplay").textContent = `I will focus on: ${taskText}`;

  focusOverlay.classList.remove("hidden");
  focusTimer.textContent = formatTime(remainingSeconds);

  if (rainToggle.checked && rainAudio.paused) rainAudio.play();

  focusInterval = setInterval(() => {
    remainingSeconds--;
    focusTimer.textContent = formatTime(remainingSeconds);
    if (remainingSeconds <= 0) {
      endFocusSession(true);
    }
  }, 1000);

  document.getElementById("focusDrawer").classList.add("hidden");
}


function endFocusSession(completed = false) {
  clearInterval(focusInterval);
  focusOverlay.classList.add("hidden");
  rainAudio.pause();
  rainAudio.currentTime = 0;

  if (completed) {
    logFocusSession();
    renderFocusHistory(); // 👈 this updates the UI right after saving
  }
  
}


function renderFocusHistory() {
  const list = document.getElementById("focusHistoryList");
  const today = `focusLog-${new Date().toISOString().split('T')[0]}`;
  const log = JSON.parse(localStorage.getItem(today) || "[]");
  
  list.innerHTML = "<h2>Total Focus Time</h2>";
  const totalMinutes = log.reduce((total, entry) => total + entry.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMinutesRemainder = totalMinutes % 60;
  list.innerHTML += `<h3>${totalHours}h ${totalMinutesRemainder}m</h3>`;
  list.innerHTML += `<p>Your focus log:</p>`;


  if (log.length == 0) {
    list.innerHTML = "<p>No focus history for today</p>";
  } else {
    log.forEach((entry, i) => {
      const div = document.createElement("div");
      div.className = "focus-entry";
      div.innerHTML = `
        <span class="focus-time">At ${entry.time.slice(0, 5)}, you focused for</span>
        <span class="focus-duration">${entry.duration}min</span>
        <span class="focus-task">on ${entry.task}</span>
      `;
      list.appendChild(div);
    });
  }
}

function logFocusSession() {
  const now = new Date();
  const todayKey = `focusLog-${now.toISOString().split('T')[0]}`;
  const taskText = document.getElementById("focusTaskInput").value || "Unnamed task";

  const log = JSON.parse(localStorage.getItem(todayKey) || "[]");
  log.push({
    time: now.toLocaleTimeString(),
    date: now.toLocaleDateString(),
    duration: parseInt(document.getElementById("focusMinutes").value),
    task: taskText
  });

  localStorage.setItem(todayKey, JSON.stringify(log));
}


focusBtn.addEventListener("click", startFocusSession);
endFocusBtn.addEventListener("click", () => {
    confetti({
        particleCount: 80,
        angle: 90,
        spread: 120,
        startVelocity: 45,
        gravity: 0.6,
        ticks: 250, // Makes it last longer (simulate a trail)
        scalar: 0.8, // Slightly smaller particles
        shapes: ['circle', 'star'], // Sparkle shapes!
        colors: ['#ffffff', '#a0e0ff', '#80d0ff', '#e6faff'],
        origin: {
          x: 0.5,
          y: 0.6
        }
      });
      
    endFocusSession(true);
});


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

  const toggleBtn = document.getElementById("toggleFocusDrawer");
const focusDrawer = document.getElementById("focusDrawer");
const focusOverlayBg = document.getElementById("focusOverlayBg");
const showFocusHistoryBtn = document.getElementById("showFocusHistory");
const focusHistoryDropdown = document.getElementById("focusHistoryDropdown");

toggleBtn.addEventListener("click", () => {
  if (focusDrawer.classList.contains("hidden")) {
    focusDrawer.classList.remove("hidden");
    focusDrawer.style.animation = "flyFromCorner 0.4s ease-out forwards";
    focusOverlayBg.classList.remove("hidden");
  } else {
    focusDrawer.style.animation = "flyToCorner 0.3s ease-in forwards";
    setTimeout(() => {
      focusDrawer.classList.add("hidden");
      focusDrawer.style.animation = "";
      focusOverlayBg.classList.add("hidden");
    }, 300);
  }
});

showFocusHistoryBtn.addEventListener("click", () => {
  const isHidden = focusHistoryDropdown.classList.contains("hidden");
  
  if (isHidden) {
    // Render content first
    renderFocusHistory();
    // Then show and animate
    focusHistoryDropdown.classList.remove("hidden");
    focusHistoryDropdown.style.animation = "flyFromCorner 0.4s ease-out forwards";
  } else {
    focusHistoryDropdown.style.animation = "flyToCorner 0.1s ease-in forwards";
    setTimeout(() => {
      focusHistoryDropdown.classList.add("hidden");
    }, 100); // Match animation duration
  }
});

document.getElementById("focusTaskInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    focusBtn.click();  // triggers startFocusSession()
  }
});



  


});
