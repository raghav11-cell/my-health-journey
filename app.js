
// MY HEALTH JOURNEY 2.0
// Firebase + Smart Dashboard + Habit Progress + Running Statistics

let currentUser = null;

let userData = {
  plan: "",
  runningTime: "",
  runningDuration: "",
  runningDistance: "",
  playlists: {
    morning: "",
    running: "",
    workout: "",
    relaxation: ""
  },
  habits: [],
  runningHistory: []
};

// ---------- DATE HELPERS ----------

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromRecord(record) {
  if (!record.date) return null;

  // New records use YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
    const [year, month, day] = record.date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  // Try to read older records.
  const parsed = new Date(record.date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// ---------- FIREBASE ----------

function waitForFirebase() {
  if (window.auth && window.db) {
    startApp();
  } else {
    window.addEventListener("firebase-ready", startApp, { once: true });
  }
}

function startApp() {
  const auth = window.auth;
  const db = window.db;

  auth.onAuthStateChanged(async (user) => {
    currentUser = user;

    if (user) {
      try {
        const doc = await db.collection("users").doc(user.uid).get();

        if (doc.exists) {
          userData = { ...userData, ...doc.data() };
        }

        // Protect older accounts with missing fields.
        if (!userData.playlists) {
          userData.playlists = {
            morning: "",
            running: "",
            workout: "",
            relaxation: ""
          };
        }

        if (!Array.isArray(userData.habits)) {
          userData.habits = [];
        }

        if (!Array.isArray(userData.runningHistory)) {
          userData.runningHistory = [];
        }

        showDashboard();
        loadUserData();
        updateDashboard();

      } catch (error) {
        alert("Data load nahi hua: " + error.message);
      }

    } else {
      showLogin();
    }
  });

  // SIGNUP
  document.getElementById("signupForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);

      await result.user.updateProfile({ displayName: name });

      await db.collection("users").doc(result.user.uid).set({
        name,
        email,
        ...userData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert("Account successfully created!");

    } catch (error) {
      alert(error.message);
    }
  });

  // LOGIN
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      alert(error.message);
    }
  });

  // LOGOUT
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    auth.signOut();
  });

  connectButtons();
}

// ---------- LOGIN / DASHBOARD ----------

function showLogin() {
  document.getElementById("authSection")?.classList.remove("hidden");
  document.getElementById("dashboard")?.classList.add("hidden");
}

function showDashboard() {
  document.getElementById("authSection")?.classList.add("hidden");
  document.getElementById("dashboard")?.classList.remove("hidden");

  const nameElement = document.getElementById("welcomeName");

  if (nameElement) {
    nameElement.textContent =
      currentUser.displayName ||
      userData.name ||
      currentUser.email;
  }

  const emailElement = document.getElementById("profileEmail");

  if (emailElement) {
    emailElement.textContent = currentUser.email || "";
  }

  document.getElementById("bottomNav")?.classList.remove("hidden");

  if (typeof showScreen === "function") {
    showScreen("home");
  }
}

// ---------- BUTTON CONNECTIONS ----------

function connectButtons() {

  // SAVE DAILY PLAN
  document.getElementById("savePlanBtn")?.addEventListener("click", async () => {
    userData.plan =
      document.getElementById("dailyPlan")?.value || "";

    await saveData();
  });

  // SAVE RUNNING ACTIVITY
  document.getElementById("saveRunningBtn")?.addEventListener("click", async () => {

    const time = document.getElementById("runningTime")?.value || "";
    const duration = document.getElementById("runningDuration")?.value || "";
    const distance = document.getElementById("runningDistance")?.value || "";

    if (!duration && !distance) {
      alert("Please enter your activity duration or distance.");
      return;
    }

    userData.runningTime = time;
    userData.runningDuration = duration;
    userData.runningDistance = distance;

    userData.runningHistory.push({
      date: getLocalDate(),
      time,
      duration,
      distance
    });

    await saveData();
    updateDashboard();

    alert("Activity record saved!");
  });

  // SAVE SPOTIFY PLAYLISTS
  document.getElementById("saveSpotifyBtn")?.addEventListener("click", async () => {

    userData.playlists = {
      morning: document.getElementById("morningPlaylist")?.value.trim() || "",
      running: document.getElementById("runningPlaylist")?.value.trim() || "",
      workout: document.getElementById("workoutPlaylist")?.value.trim() || "",
      relaxation: document.getElementById("relaxPlaylist")?.value.trim() || ""
    };

    await saveData();
    showPlaylists();
  });

  // ADD HABIT
  document.getElementById("saveHabitBtn")?.addEventListener("click", async () => {

    const habitInput = document.getElementById("habitInput");
    const habit = habitInput?.value.trim();

    if (!habit) {
      alert("Please enter a habit.");
      return;
    }

    userData.habits.push({
      name: habit,
      done: false
    });

    habitInput.value = "";

    await saveData();
    loadHabits();
    updateDashboard();
  });
}

// ---------- SAVE FIRESTORE DATA ----------

async function saveData() {
  if (!currentUser) return;

  try {
    await window.db.collection("users").doc(currentUser.uid).set(
      userData,
      { merge: true }
    );

    const status = document.getElementById("saveStatus");

    if (status) {
      status.textContent = "✓ Your data is saved to your account.";
    }

  } catch (error) {
    alert("Save error: " + error.message);
  }
}

// ---------- LOAD USER DATA ----------

function loadUserData() {

  const plan = document.getElementById("dailyPlan");
  if (plan) plan.value = userData.plan || "";

  const time = document.getElementById("runningTime");
  if (time) time.value = userData.runningTime || "";

  const duration = document.getElementById("runningDuration");
  if (duration) duration.value = userData.runningDuration || "";

  const distance = document.getElementById("runningDistance");
  if (distance) distance.value = userData.runningDistance || "";

  const fields = {
    morningPlaylist: "morning",
    runningPlaylist: "running",
    workoutPlaylist: "workout",
    relaxPlaylist: "relaxation"
  };

  Object.entries(fields).forEach(([id, key]) => {
    const element = document.getElementById(id);

    if (element) {
      element.value = userData.playlists?.[key] || "";
    }
  });

  loadHabits();
  showPlaylists();
}

// ---------- HABIT TRACKER ----------

function loadHabits() {
  const list = document.getElementById("habitList");
  if (!list) return;

  list.innerHTML = "";

  userData.habits.forEach((habit, index) => {

    const item = document.createElement("div");
    item.className = "habit-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(habit.done);

    const label = document.createElement("span");
    label.textContent = habit.name;

    if (habit.done) {
      label.style.textDecoration = "line-through";
      label.style.opacity = "0.55";
    }

    checkbox.addEventListener("change", async () => {

      userData.habits[index].done = checkbox.checked;

      label.style.textDecoration =
        checkbox.checked ? "line-through" : "none";

      label.style.opacity =
        checkbox.checked ? "0.55" : "1";

      await saveData();
      updateDashboard();
    });

    item.append(checkbox, label);
    list.appendChild(item);
  });

  updateDashboard();
}

// ---------- SMART DASHBOARD ----------

function createDashboardWidget() {
  const home = document.getElementById("screen-home");

  if (!home || document.getElementById("smartDashboard")) return;

  const widget = document.createElement("div");
  widget.id = "smartDashboard";

  widget.innerHTML = `
    <style>
      #smartDashboard .smart-card {
        background:white;
        border:1px solid #f0eff8;
        border-radius:23px;
        padding:20px;
        margin-bottom:17px;
        box-shadow:0 8px 30px rgba(105,91,180,.07);
      }

      #smartDashboard .smart-title {
        font-size:17px;
        font-weight:800;
        margin-bottom:15px;
      }

      #smartDashboard .progress-row {
        display:flex;
        align-items:center;
        gap:18px;
      }

      #smartDashboard .progress-circle {
        width:92px;
        height:92px;
        border-radius:50%;
        display:grid;
        place-items:center;
        flex-shrink:0;
        background:conic-gradient(#8174e8 0deg,#eeeafa 0deg);
        position:relative;
      }

      #smartDashboard .progress-circle:before {
        content:"";
        position:absolute;
        width:72px;
        height:72px;
        border-radius:50%;
        background:white;
      }

      #smartDashboard .progress-number {
        position:relative;
        z-index:1;
        font-size:21px;
        font-weight:850;
        color:#7568d5;
      }

      #smartDashboard .progress-info p {
        font-size:12px;
        color:#9292a8;
        margin-top:5px;
      }

      #smartDashboard .smart-grid {
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:11px;
      }

      #smartDashboard .smart-stat {
        padding:16px;
        border-radius:17px;
        background:linear-gradient(140deg,#f0edff,#faf8ff);
      }

      #smartDashboard .smart-stat.blue {
        background:linear-gradient(140deg,#eaf5ff,#f8fbff);
      }

      #smartDashboard .smart-stat strong {
        display:block;
        font-size:24px;
        color:#7568d5;
        margin-bottom:5px;
      }

      #smartDashboard .smart-stat.blue strong {
        color:#5796d3;
      }

      #smartDashboard .smart-stat span {
        color:#85839e;
        font-size:11px;
        font-weight:650;
      }

      #smartDashboard .week-chart {
        display:grid;
        grid-template-columns:repeat(7,1fr);
        gap:9px;
        align-items:end;
        height:125px;
        margin-top:15px;
      }

      #smartDashboard .week-day {
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:flex-end;
        height:100%;
        gap:7px;
      }

      #smartDashboard .week-bar-bg {
        height:85px;
        width:100%;
        background:#f3f1fb;
        border-radius:9px;
        display:flex;
        align-items:flex-end;
        overflow:hidden;
      }

      #smartDashboard .week-bar {
        width:100%;
        min-height:3px;
        border-radius:9px;
        background:linear-gradient(180deg,#a99cf4,#8174e8);
      }

      #smartDashboard .week-day span {
        font-size:10px;
        color:#9292a8;
      }
    </style>

    <div class="smart-card">
      <div class="smart-title">Your Daily Progress</div>

      <div class="progress-row">
        <div class="progress-circle" id="habitProgressCircle">
          <span class="progress-number" id="habitProgressNumber">0%</span>
        </div>

        <div class="progress-info">
          <strong id="habitProgressText">0 of 0 habits done</strong>
          <p>Every small step matters. Keep your own pace.</p>
        </div>
      </div>
    </div>

    <div class="smart-card">
      <div class="smart-title">Your Activity Summary</div>

      <div class="smart-grid">
        <div class="smart-stat">
          <strong id="totalDistance">0</strong>
          <span>Total Distance (KM)</span>
        </div>

        <div class="smart-stat blue">
          <strong id="totalSessions">0</strong>
          <span>Activity Sessions</span>
        </div>
      </div>
    </div>

    <div class="smart-card">
      <div class="smart-title">Weekly Activity</div>
      <p style="font-size:12px;color:#9292a8">
        Your recorded activity over the last seven days.
      </p>
      <div class="week-chart" id="weeklyChart"></div>
    </div>
  `;

  // Place smart dashboard after the welcome banner.
  const welcome = home.querySelector(".welcome");

  if (welcome) {
    welcome.after(widget);
  } else {
    home.prepend(widget);
  }
}

function updateDashboard() {

  createDashboardWidget();

  const habits = Array.isArray(userData.habits) ? userData.habits : [];
  const completed = habits.filter(h => h.done).length;

  const percentage = habits.length
    ? Math.round((completed / habits.length) * 100)
    : 0;

  const circle = document.getElementById("habitProgressCircle");
  const number = document.getElementById("habitProgressNumber");
  const text = document.getElementById("habitProgressText");

  if (circle) {
    circle.style.background =
      `conic-gradient(#8174e8 ${percentage * 3.6}deg,#eeeafa 0deg)`;
  }

  if (number) number.textContent = percentage + "%";

  if (text) {
    text.textContent = `${completed} of ${habits.length} habits done`;
  }

  // Total running distance and sessions.
  const history = Array.isArray(userData.runningHistory)
    ? userData.runningHistory
    : [];

  const totalDistance = history.reduce((sum, record) => {
    return sum + (Number(record.distance) || 0);
  }, 0);

  const distanceElement = document.getElementById("totalDistance");
  const sessionsElement = document.getElementById("totalSessions");

  if (distanceElement) {
    distanceElement.textContent = totalDistance.toFixed(1);
  }

  if (sessionsElement) {
    sessionsElement.textContent = history.length;
  }

  updateWeeklyChart(history);
}

// ---------- WEEKLY CHART ----------

function updateWeeklyChart(history) {
  const chart = document.getElementById("weeklyChart");
  if (!chart) return;

  chart.innerHTML = "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dateKey =
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const records = history.filter(record => {
      const recordDate = getDateFromRecord(record);

      if (!recordDate) return false;

      recordDate.setHours(0, 0, 0, 0);

      return recordDate.getTime() === date.getTime();
    });

    const distance = records.reduce((sum, record) => {
      return sum + (Number(record.distance) || 0);
    }, 0);

    days.push({
      label: date.toLocaleDateString("en", { weekday: "short" }),
      distance
    });
  }

  const maxDistance = Math.max(
    ...days.map(day => day.distance),
    1
  );

  days.forEach(day => {
    const item = document.createElement("div");
    item.className = "week-day";

    const background = document.createElement("div");
    background.className = "week-bar-bg";

    const bar = document.createElement("div");
    bar.className = "week-bar";

    bar.style.height =
      day.distance > 0
        ? Math.max(5, (day.distance / maxDistance) * 100) + "%"
        : "3px";

    bar.title = day.distance.toFixed(1) + " km";

    background.appendChild(bar);

    const label = document.createElement("span");
    label.textContent = day.label;

    item.append(background, label);
    chart.appendChild(item);
  });
}

// ---------- SPOTIFY ----------

function showPlaylists() {
  const container = document.getElementById("spotifyPlayers");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(userData.playlists || {}).forEach(([type, url]) => {
    if (!url) return;

    const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];

    if (!playlistId) return;

    const heading = document.createElement("h3");
    heading.textContent =
      type.charAt(0).toUpperCase() + type.slice(1);

    const frame = document.createElement("iframe");

    frame.src =
      `https://open.spotify.com/embed/playlist/${playlistId}`;

    frame.width = "100%";
    frame.height = "152";
    frame.allow =
      "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    frame.loading = "lazy";

    container.append(heading, frame);
  });
}

// ---------- START ----------

waitForFirebase();
      
