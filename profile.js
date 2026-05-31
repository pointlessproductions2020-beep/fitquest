/* -----------------------------------------------------------
   LOAD PROFILE DATA
----------------------------------------------------------- */

auth.onAuthStateChanged(user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const userRef = db.collection("users").doc(user.uid);

    userRef.get().then(doc => {
        if (!doc.exists) return;
        const data = doc.data();

        // Fill fields
        if (data.name) {
            document.getElementById("profileName").value = data.name;
            document.getElementById("sidebarName").innerText = data.name;
        }

        if (data.age) {
            document.getElementById("profileAge").value = data.age;
            document.getElementById("sidebarAge").innerText = "Age: " + data.age;
        }

        if (data.sex) {
            document.getElementById("profileSex").value = data.sex;
            document.getElementById("sidebarSex").innerText = "Sex: " + data.sex;
        }

        if (data.heightCm) document.getElementById("profileHeight").value = data.heightCm;
        if (data.weightKg) document.getElementById("profileWeight").value = data.weightKg;
        if (data.activityLevel) document.getElementById("profileActivity").value = data.activityLevel;
        if (data.goal) document.getElementById("profileGoal").value = data.goal;
        if (data.goalPace) document.getElementById("profileGoalPace").value = data.goalPace;

        if (data.avatarUrl) {
            document.getElementById("profileAvatar").src = data.avatarUrl;
        }

        // Stats
        if (data.bmi) document.getElementById("bmiValue").innerText = data.bmi.toFixed(1);
        if (data.tdee) document.getElementById("tdeeValue").innerText = Math.round(data.tdee);
        if (data.targetCalories) document.getElementById("targetCaloriesValue").innerText = Math.round(data.targetCalories);

        // XP + Level
        const xp = data.xp || 0;
        const level = Math.floor(xp / 100) + 1;
        document.getElementById("userLevel").innerText = level;
        document.getElementById("xpFill").style.width = (xp % 100) + "%";
    });
});

/* -----------------------------------------------------------
   SAVE PROFILE (FIXED)
----------------------------------------------------------- */

function saveProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = db.collection("users").doc(user.uid);

    const name = document.getElementById("profileName").value;
    const age = parseInt(document.getElementById("profileAge").value);
    const sex = document.getElementById("profileSex").value;
    const height = parseFloat(document.getElementById("profileHeight").value);
    const weight = parseFloat(document.getElementById("profileWeight").value);
    const activity = document.getElementById("profileActivity").value;
    const goal = document.getElementById("profileGoal").value;
    const pace = document.getElementById("profileGoalPace").value;

    // Calculate BMI
    let bmi = null;
    if (height && weight) {
        bmi = weight / Math.pow(height / 100, 2);
        document.getElementById("bmiValue").innerText = bmi.toFixed(1);
    }

    // Save using set() with merge so fields ALWAYS save
    userRef.set({
        name,
        age,
        sex,
        heightCm: height,
        weightKg: weight,
        activityLevel: activity,
        goal,
        goalPace: pace,
        bmi
    }, { merge: true });

    document.getElementById("profileStatus").innerText = "Profile saved!";
}

/* -----------------------------------------------------------
   AVATAR UPLOAD (Firebase Storage)
----------------------------------------------------------- */

document.getElementById("avatarUpload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) return;

    const storageRef = firebase.storage().ref(`avatars/${user.uid}.jpg`);
    await storageRef.put(file);
    const url = await storageRef.getDownloadURL();

    document.getElementById("profileAvatar").src = url;

    db.collection("users").doc(user.uid).update({
        avatarUrl: url
    });
});

/* -----------------------------------------------------------
   CLICK SPARK BURST
----------------------------------------------------------- */

function sparkBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const sparkPalette = ["#00eaff", "#7b2fff", "#ff00ff", "#ff8800", "#22c55e"];

    for (let i = 0; i < 8; i++) {
        const spark = document.createElement("span");
        spark.className = "spark";

        const usePalette = Math.random() < 0.3;
        const color = usePalette
            ? sparkPalette[Math.floor(Math.random() * sparkPalette.length)]
            : getComputedStyle(document.documentElement).getPropertyValue("--neon").trim();

        spark.style.background = color;

        const angle = (Math.PI * 2 * i) / 8;
        const distance = 40 + Math.random() * 10;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        spark.style.setProperty("--x", `${x}px`);
        spark.style.setProperty("--y", `${y}px`);

        spark.style.left = `${centerX - 3}px`;
        spark.style.top = `${centerY - 3}px`;

        element.appendChild(spark);

        setTimeout(() => spark.remove(), 450);
    }
}

document.querySelectorAll(".neon-interactive").forEach(el => {
    el.addEventListener("click", () => sparkBurst(el));
});
