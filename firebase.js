// Firebase SDK
const firebaseAppScript = document.createElement("script");
firebaseAppScript.src = "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js";
document.head.appendChild(firebaseAppScript);

firebaseAppScript.onload = () => {
  const authScript = document.createElement("script");
  authScript.src = "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js";
  document.head.appendChild(authScript);

  authScript.onload = () => {
    const dbScript = document.createElement("script");
    dbScript.src = "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js";
    document.head.appendChild(dbScript);

    dbScript.onload = () => {
      const firebaseConfig = {
        apiKey: "AIzaSyB73rBjhAJmaJshFGRa4MFM8c0RW9mf0CA",
        authDomain: "my-health-journey-16b4f.firebaseapp.com",
        projectId: "my-health-journey-16b4f",
        storageBucket: "my-health-journey-16b4f.firebasestorage.app",
        messagingSenderId: "958705938321",
        appId: "1:958705938321:web:2096f0c6de918adf1a7430"
      };

      firebase.initializeApp(firebaseConfig);

      window.auth = firebase.auth();
      window.db = firebase.firestore();

      window.dispatchEvent(new Event("firebase-ready"));
    };
  };
};
