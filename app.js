// My Health Journey - Main App

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

        showDashboard();
        loadUserData();
      } catch (error) {
        alert("Data load nahi hua: " + error.message);
      }
    } else {
      showLogin();
    }
  });

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
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
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value;

      try {
        await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        alert(error.message);
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => auth.signOut());
  }

  connectButtons();
}

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
      currentUser.displayName || currentUser.email;
  }
}

function connectButtons() {
  document.getElementById("savePlanBtn")?.addEventListener("click", async () => {
    userData.plan = document.getElementById("dailyPlan")?.value || "";
    await saveData();
  });

  document.getElementById("saveRunningBtn")?.addEventListener("click", async () => {
    userData.runningTime = document.getElementById("runningTime")?.value || "";
    userData.runningDuration = document.getElementById("runningDuration")?.value || "";
    userData.runningDistance = document.getElementById("runningDistance")?.value || "";

    userData.runningHistory.push({
      date: new Date().toLocaleDateString(),
      time: userData.runningTime,
      duration: userData.runningDuration,
      distance: userData.runningDistance
    });

    await saveData();
    alert("Running record saved!");
  });

  document.getElementById("saveSpotifyBtn")?.addEventListener("click", async () => {
    userData.playlists = {
      morning: document.getElementById("morningPlaylist")?.value || "",
      running: document.getElementById("runningPlaylist")?.value || "",
      workout: document.getElementById("workoutPlaylist")?.value || "",
      relaxation: document.getElementById("relaxPlaylist")?.value || ""
    };

    await saveData();
    showPlaylists();
  });

  document.getElementById("saveHabitBtn")?.addEventListener("click", async () => {
    const habitInput = document.getElementById("habitInput");
    const habit = habitInput?.value.trim();

    if (!habit) return;

    userData.habits.push({
      name: habit,
      done: false
    });

    habitInput.value = "";
    await saveData();
    loadHabits();
  });
}

async function saveData() {
  if (!currentUser) return;

  try {
    await window.db.collection("users").doc(currentUser.uid).set(
      userData,
      { merge: true }
    );

    const status = document.getElementById("saveStatus");
    if (status) status.textContent = "Saved to your account";
  } catch (error) {
    alert("Save error: " + error.message);
  }
}

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
    if (element) element.value = userData.playlists?.[key] || "";
  });

  loadHabits();
  showPlaylists();
}

async function loadHabits() {
  const list = document.getElementById("habitList");
  if (!list) return;

  list.innerHTML = "";

  userData.habits.forEach((habit, index) => {
    const item = document.createElement("div");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = habit.done;

    checkbox.addEventListener("change", async () => {
      userData.habits[index].done = checkbox.checked;
      await saveData();
    });

    const label = document.createElement("span");
    label.textContent = habit.name;

    item.append(checkbox, label);
    list.appendChild(item);
  });
}

function showPlaylists() {
  const container = document.getElementById("spotifyPlayers");
  if (!container) return;

  container.innerHTML = "";

  Object.entries(userData.playlists || {}).forEach(([type, url]) => {
    if (!url) return;

    const playlistId = url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) return;

    const heading = document.createElement("h3");
    heading.textContent = type.charAt(0).toUpperCase() + type.slice(1);

    const frame = document.createElement("iframe");
    frame.src = `https://open.spotify.com/embed/playlist/${playlistId}`;
    frame.width = "100%";
    frame.height = "152";
    frame.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
    frame.loading = "lazy";

    container.append(heading, frame);
  });
}

waitForFirebase();
