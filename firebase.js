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

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

/* LOGIN */
function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch(err => alert(err.message));
}

/* REGISTER */
function registerUser() {
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPassword").value;

    auth.createUserWithEmailAndPassword(email, pass)
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch(err => alert(err.message));
}
