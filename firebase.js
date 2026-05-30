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
const db = firebase.firestore();

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
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPassword").value;

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            return db.collection("users").doc(cred.user.uid).set({
                name: name,
                email: email,
                createdAt: new Date(),
                xp: 0,
                level: 1,
                streak: 0
            });
        })
        .then(() => {
            window.location.href = "dashboard.html";
        })
        .catch(err => alert(err.message));
}

/* LOGOUT */
function logoutUser() {
    auth.signOut()
        .then(() => {
            window.location.href = "index.html";
        })
        .catch(err => alert(err.message));
}

/* XP + LEVEL SYSTEM */
function addXP(amount) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.collection("users").doc(user.uid);

    return db.runTransaction(async (t) => {
        const doc = await t.get(userRef);
        if (!doc.exists) return;

        let xp = doc.data().xp + amount;
        let level = doc.data().level;

        // Level up every 100 XP
        while (xp >= 100) {
            xp -= 100;
            level++;
        }

        t.update(userRef, { xp, level });
    }).then(() => {
        // Refresh UI if on dashboard
        if (document.getElementById("userXP")) {
            db.collection("users").doc(user.uid).get().then(doc => {
                const data = doc.data();
                document.getElementById("userXP").innerText = data.xp + " XP";
                document.getElementById("userLevel").innerText = data.level;
            });
        }
    });
}
