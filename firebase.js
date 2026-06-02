// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAVtxIzKrcj5VkTuSo7boaki3CfQzff3gA",
  authDomain: "fitquest-1b9f1.firebaseapp.com",
  projectId: "fitquest-1b9f1",
  storageBucket: "fitquest-1b9f1.appspot.com",
  messagingSenderId: "958554033321",
  appId: "1:958554033321:web:07b2fa75d1e4c9243e2db8",
  measurementId: "G-ZVFR6222TF"
};

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // REQUIRED FOR AVATARS + UPLOADS

/* ---------------------------------------------------
   AUTH
--------------------------------------------------- */

function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const pass = document.getElementById("loginPassword").value;

    auth.signInWithEmailAndPassword(email, pass)
        .then(() => window.location.href = "dashboard.html")
        .catch(err => alert(err.message));
}

function registerUser() {
    const name = document.getElementById("regName").value;
    const email = document.getElementById("regEmail").value;
    const pass = document.getElementById("regPassword").value;

    auth.createUserWithEmailAndPassword(email, pass)
        .then((cred) => {
            return db.collection("users").doc(cred.user.uid).set({
                name,
                email,
                createdAt: new Date(),
                xp: 0,
                level: 1,
                streak: 0,
                avatarUrl: "" // PREP FOR STORAGE
            });
        })
        .then(() => window.location.href = "dashboard.html")
        .catch(err => alert(err.message));
}

function logoutUser() {
    auth.signOut()
        .then(() => window.location.href = "index.html")
        .catch(err => alert(err.message));
}

/* ---------------------------------------------------
   XP + LEVEL SYSTEM
--------------------------------------------------- */

function addXP(amount) {
    const user = auth.currentUser;
    if (!user) return;

    const ref = db.collection("users").doc(user.uid);

    return db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        if (!doc.exists) return;

        let xp = doc.data().xp || 0;
        let level = doc.data().level || 1;

        xp += amount;

        while (xp >= 100) {
            xp -= 100;
            level++;
        }

        t.update(ref, { xp, level });
    }).then(() => {
        if (document.getElementById("userXP")) {
            ref.get().then(doc => {
                const d = doc.data();
                document.getElementById("userXP").innerText = d.xp + " XP";
                document.getElementById("userLevel").innerText = d.level;
            });
        }
    });
}

/* ---------------------------------------------------
   PROFILE CALCULATIONS (BMI, BMR, TDEE)
--------------------------------------------------- */

function getActivityMultiplier(level) {
    return {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    }[level] || 1.2;
}

function getGoalAdjustment(goal, pace) {
    if (goal === "maintain") return 0;

    const paceMap = {
        slow: 250,
        medium: 500,
        fast: 750
    };

    const base = paceMap[pace] || 500;
    return goal === "lose" ? -base : base;
}

function calculateProfileMetrics({ sex, age, heightCm, weightKg, activityLevel, goal, goalPace }) {
    if (!sex || !age || !heightCm || !weightKg) return {};

    const h = Number(heightCm);
    const w = Number(weightKg);
    const a = Number(age);

    const bmi = w / Math.pow(h / 100, 2);

    let bmr = sex === "male"
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;

    const tdee = bmr * getActivityMultiplier(activityLevel);
    const targetCalories = tdee + getGoalAdjustment(goal, goalPace);

    return { bmi, bmr, tdee, targetCalories };
}

function saveProfile() {
    const user = auth.currentUser;
    if (!user) return alert("Not logged in.");

    const fields = {
        name: document.getElementById("profileName").value,
        age: Number(document.getElementById("profileAge").value),
        sex: document.getElementById("profileSex").value,
        heightCm: Number(document.getElementById("profileHeight").value),
        weightKg: Number(document.getElementById("profileWeight").value),
        activityLevel: document.getElementById("profileActivity").value,
        goal: document.getElementById("profileGoal").value,
        goalPace: document.getElementById("profileGoalPace").value
    };

    const metrics = calculateProfileMetrics(fields);

    const payload = { ...fields, ...metrics };

    db.collection("users").doc(user.uid).set(payload, { merge: true })
        .then(() => {
            if (document.getElementById("profileStatus"))
                document.getElementById("profileStatus").innerText = "Profile saved.";

            if (metrics.bmi) document.getElementById("bmiValue").innerText = metrics.bmi.toFixed(1);
            if (metrics.tdee) document.getElementById("tdeeValue").innerText = Math.round(metrics.tdee);
            if (metrics.targetCalories) document.getElementById("targetCaloriesValue").innerText = Math.round(metrics.targetCalories);
        })
        .catch(err => alert(err.message));
}
