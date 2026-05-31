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
                streak: 0
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

/* ---------------------------------------------------
   DAILY LOG SYSTEM (CALORIES, WATER, EXERCISE)
--------------------------------------------------- */

function getTodayLogId(uid) {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${uid}_${yyyy}-${mm}-${dd}`;
}

function updateDashboardFromLog(log, target) {
    const eaten = log.caloriesEaten || 0;
    const water = log.waterMl || 0;
    const exercise = log.exerciseCalories || 0;

    const net = eaten - exercise;
    const remaining = Math.max(0, Math.round(target - net));

    if (document.getElementById("calEaten")) document.getElementById("calEaten").innerText = eaten;
    if (document.getElementById("waterTotal")) document.getElementById("waterTotal").innerText = water;
    if (document.getElementById("exerciseCalories")) document.getElementById("exerciseCalories").innerText = exercise;
    if (document.getElementById("calRemaining")) document.getElementById("calRemaining").innerText = remaining;

    if (document.getElementById("brainMessage")) {
        let msg = "";
        if (!target) msg = "Set up your profile to unlock smart calorie guidance.";
        else if (remaining <= 0) msg = "You've hit your target for today.";
        else if (remaining < 300) msg = `You're close. About ${remaining} kcal left.`;
        else msg = `You've got about ${remaining} kcal left today.`;

        document.getElementById("brainMessage").innerText = msg;
    }
}

function loadDashboardBrain() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.collection("users").doc(user.uid);

    userRef.get().then(doc => {
        const data = doc.data();
        const target = data.targetCalories ? Math.round(data.targetCalories) : null;

        if (document.getElementById("userName")) document.getElementById("userName").innerText = data.name || "Adventurer";
        if (document.getElementById("userLevel")) document.getElementById("userLevel").innerText = data.level || 1;
        if (document.getElementById("userXP")) document.getElementById("userXP").innerText = (data.xp || 0) + " XP";
        if (document.getElementById("calTarget")) document.getElementById("calTarget").innerText = target || "–";

        const logId = getTodayLogId(user.uid);
        const logRef = db.collection("dailyLogs").doc(logId);

        logRef.get().then(ldoc => {
            if (!ldoc.exists) {
                const base = {
                    userId: user.uid,
                    date: new Date().toISOString().substring(0, 10),
                    caloriesEaten: 0,
                    waterMl: 0,
                    exerciseCalories: 0,
                    targetCalories: target
                };
                logRef.set(base).then(() => updateDashboardFromLog(base, target || 0));
            } else {
                const log = ldoc.data();
                updateDashboardFromLog(log, target || log.targetCalories || 0);
            }
        });
    });
}

/* ---------------------------------------------------
   QUICK ADD (manual calories, water, exercise)
--------------------------------------------------- */

function promptAddMeal() {
    const val = prompt("Calories?");
    if (!val) return;
    addMealCalories(parseInt(val));
}

function addMealCalories(amount) {
    const user = auth.currentUser;
    if (!user) return;

    const logId = getTodayLogId(user.uid);
    const ref = db.collection("dailyLogs").doc(logId);

    db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const d = doc.exists ? doc.data() : {};
        d.caloriesEaten = (d.caloriesEaten || 0) + amount;
        t.set(ref, d);
    }).then(() => loadDashboardBrain());
}

function promptAddWater() {
    const val = prompt("Water (ml)?");
    if (!val) return;
    addWater(parseInt(val));
}

function addWater(amount) {
    const user = auth.currentUser;
    if (!user) return;

    const logId = getTodayLogId(user.uid);
    const ref = db.collection("dailyLogs").doc(logId);

    db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const d = doc.exists ? doc.data() : {};
        d.waterMl = (d.waterMl || 0) + amount;
        t.set(ref, d);
    }).then(() => loadDashboardBrain());
}

function promptAddExercise() {
    const val = prompt("Calories burned?");
    if (!val) return;
    addExerciseCalories(parseInt(val));
}

function addExerciseCalories(amount) {
    const user = auth.currentUser;
    if (!user) return;

    const logId = getTodayLogId(user.uid);
    const ref = db.collection("dailyLogs").doc(logId);

    db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const d = doc.exists ? doc.data() : {};
        d.exerciseCalories = (d.exerciseCalories || 0) + amount;
        t.set(ref, d);
    }).then(() => loadDashboardBrain());
}

/* ---------------------------------------------------
   SMART FOOD SYSTEM (SEARCH + SELECT + LOG)
--------------------------------------------------- */

let selectedFood = null;

function performFoodSearch(query) {
    if (!query || query.length < 2) {
        document.getElementById("foodResults").innerHTML = "<p>Keep typing...</p>";
        return;
    }

    const qLower = query.toLowerCase();

    db.collection("foods")
        .where("nameLower", ">=", qLower)
        .where("nameLower", "<=", qLower + "\uf8ff")
        .limit(20)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                document.getElementById("foodResults").innerHTML = "<p>No matches found.</p>";
                return;
            }

            let html = "";
            snapshot.forEach(doc => {
                const f = doc.data();
                html += `
                    <div class="food-item" 
                         onclick="selectFood('${doc.id}', '${f.name}', ${f.calories}, '${f.servingSize}', ${f.protein}, ${f.carbs}, ${f.fat})">
                        <strong>${f.name}</strong><br>
                        <small>${f.servingSize} — ${f.calories} kcal</small>
                    </div>
                `;
            });

            document.getElementById("foodResults").innerHTML = html;
        });
}

function selectFood(id, name, calories, servingSize, protein, carbs, fat) {
    selectedFood = { id, name, calories, servingSize, protein, carbs, fat };

    document.getElementById("selectedFoodBlock").style.display = "block";
    document.getElementById("selectedFoodName").innerText = name;
    document.getElementById("selectedFoodServing").innerText = servingSize;
    document.getElementById("selectedFoodCalories").innerText = calories;

    const servings = parseFloat(document.getElementById("foodServing").value) || 1;
    document.getElementById("selectedFoodTotalCalories").innerText = Math.round(calories * servings);
}

function logSelectedFoodFromUI() {
    if (!selectedFood) return alert("No food selected.");

    const servings = parseFloat(document.getElementById("foodServing").value) || 1;
    const totalCalories = Math.round(selectedFood.calories * servings);

    addMealCalories(totalCalories);

    closeMealModal();
}
