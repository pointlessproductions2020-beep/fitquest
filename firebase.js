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

        let xp = doc.data().xp || 0;
        let level = doc.data().level || 1;

        xp += amount;

        // Level up every 100 XP
        while (xp >= 100) {
            xp -= 100;
            level++;
        }

        t.update(userRef, { xp, level });
    }).then(() => {
        if (document.getElementById("userXP")) {
            const user = auth.currentUser;
            if (!user) return;
            db.collection("users").doc(user.uid).get().then(doc => {
                const data = doc.data();
                document.getElementById("userXP").innerText = (data.xp || 0) + " XP";
                document.getElementById("userLevel").innerText = data.level || 1;
            });
        }
    });
}

/* PROFILE: BMI / BMR / TDEE / TARGET CALORIES */

function getActivityMultiplier(activityLevel) {
    switch (activityLevel) {
        case "sedentary": return 1.2;
        case "light": return 1.375;
        case "moderate": return 1.55;
        case "active": return 1.725;
        case "very_active": return 1.9;
        default: return 1.2;
    }
}

function getGoalAdjustment(goal, pace) {
    // kcal per day adjustment
    if (goal === "maintain") return 0;

    let base = 0;
    if (pace === "slow") base = 250;
    else if (pace === "medium") base = 500;
    else if (pace === "fast") base = 750;
    else base = 500;

    return goal === "lose" ? -base : base;
}

function calculateProfileMetrics({ sex, age, heightCm, weightKg, activityLevel, goal, goalPace }) {
    if (!sex || !age || !heightCm || !weightKg) return {};

    const height = Number(heightCm);
    const weight = Number(weightKg);
    const ageNum = Number(age);

    // BMI
    const bmi = weight / Math.pow(height / 100, 2);

    // Mifflin-St Jeor BMR
    let bmr;
    if (sex === "male") {
        bmr = 10 * weight + 6.25 * height - 5 * ageNum + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * ageNum - 161;
    }

    const activityMult = getActivityMultiplier(activityLevel);
    const tdee = bmr * activityMult;

    const adjustment = getGoalAdjustment(goal, goalPace);
    const targetCalories = tdee + adjustment;

    return { bmi, bmr, tdee, targetCalories };
}

function saveProfile() {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in.");
        return;
    }

    const name = document.getElementById("profileName").value;
    const age = document.getElementById("profileAge").value;
    const sex = document.getElementById("profileSex").value;
    const heightCm = document.getElementById("profileHeight").value;
    const weightKg = document.getElementById("profileWeight").value;
    const activityLevel = document.getElementById("profileActivity").value;
    const goal = document.getElementById("profileGoal").value;
    const goalPace = document.getElementById("profileGoalPace").value;

    const metrics = calculateProfileMetrics({
        sex,
        age,
        heightCm,
        weightKg,
        activityLevel,
        goal,
        goalPace
    });

    const userRef = db.collection("users").doc(user.uid);

    const payload = {
        name,
        age: age ? Number(age) : null,
        sex,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        activityLevel,
        goal,
        goalPace
    };

    if (metrics.bmi) payload.bmi = metrics.bmi;
    if (metrics.tdee) payload.tdee = metrics.tdee;
    if (metrics.targetCalories) payload.targetCalories = metrics.targetCalories;

    userRef.set(payload, { merge: true })
        .then(() => {
            if (document.getElementById("profileStatus")) {
                document.getElementById("profileStatus").innerText = "Profile saved successfully.";
            }
            if (metrics.bmi && document.getElementById("bmiValue")) {
                document.getElementById("bmiValue").innerText = metrics.bmi.toFixed(1);
            }
            if (metrics.tdee && document.getElementById("tdeeValue")) {
                document.getElementById("tdeeValue").innerText = Math.round(metrics.tdee);
            }
            if (metrics.targetCalories && document.getElementById("targetCaloriesValue")) {
                document.getElementById("targetCaloriesValue").innerText = Math.round(metrics.targetCalories);
            }
        })
        .catch(err => {
            if (document.getElementById("profileStatus")) {
                document.getElementById("profileStatus").innerText = "Error saving profile: " + err.message;
            } else {
                alert(err.message);
            }
        });
}
