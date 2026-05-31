console.log("🔥 firebase.js LOADED");

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAVtxIzKrcj5VkTuSo7boaki3CfQzff3gA",
  authDomain: "fitquest-1b9f1.firebaseapp.com",
  projectId: "fitquest-1b9f1",
  storageBucket: "fitquest-1b9f1.firebasestorage.app",
  messagingSenderId: "958554033321",
  appId: "1:958554033321:web:07b2fa75d1e4c9243e2db8",
  measurementId: "G-ZVFR6222TF"
};

console.log("⚙️ Initializing Firebase…");

try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase initialized");
} catch (e) {
    console.error("❌ Firebase init FAILED:", e);
}

let auth, db;

try {
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("✅ Auth + Firestore loaded");
} catch (e) {
    console.error("❌ Auth/Firestore FAILED:", e);
}

// GLOBAL ERROR CATCHER
window.addEventListener("error", (e) => {
    console.error("💥 GLOBAL ERROR:", e.message, "at", e.filename, ":", e.lineno);
});

window.addEventListener("unhandledrejection", (e) => {
    console.error("💥 UNHANDLED PROMISE:", e.reason);
});

// LOG ALL NETWORK REQUESTS
(function(open) {
    XMLHttpRequest.prototype.open = function(method, url) {
        console.log("🌐 XHR:", method, url);
        return open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);

// --- AUTH DEBUG ---
function registerUser() {
    console.log("🟦 registerUser() CALLED");

    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPassword").value;

    console.log("📨 Attempting Firebase signup with:", { email, passLength: pass.length });

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            console.log("✅ Firebase AUTH success:", cred.user.uid);

            return db.collection("users").doc(cred.user.uid).set({
                name,
                email,
                createdAt: new Date(),
                xp: 0,
                level: 1,
                streak: 0
            });
        })
        .then(() => {
            console.log("✅ Firestore write success");
            window.location.href = "dashboard.html";
        })
        .catch(err => {
            console.error("❌ REGISTER ERROR:", err);
            alert(err.message);
        });
}
