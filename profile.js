/* ---------------------------------------------------------
   PROFILE LOGIC FOR BOTH profile-edit.html AND profile.html
   Firebase v8 — Corrected for new bucket domain
--------------------------------------------------------- */

let currentUser = null;
let userRef = null;

// ⭐ FORCE Firebase Storage to use the correct bucket
// Your project uses the new domain: fitquest-1b9f1.firebasestorage.app
const storage = firebase.storage();
const storageRef = storage.refFromURL("gs://fitquest-1b9f1.firebasestorage.app");

auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    currentUser = user;
    userRef = db.collection("users").doc(user.uid);

    const doc = await userRef.get();
    const data = doc.exists ? doc.data() : {};

    const path = window.location.pathname;

    if (path.includes("profile-edit.html")) {
        initProfileEdit(data);
    } else if (path.includes("profile.html")) {
        initProfileView(data);
    }
});

/* ---------------------------------------------------------
   SHARED HELPERS
--------------------------------------------------------- */

function computeTargetsFromData(data) {
    const profile = {
        sex: data.sex,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        age: data.age,
        activityLevel: data.activityLevel,
        goal: data.goal,
        goalPace: data.goalPace
    };

    const targets = FitQuestBrain.calculateTargets(profile);
    return targets || null;
}

function computeBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    const hM = heightCm / 100;
    return weightKg / (hM * hM);
}

/* ---------------------------------------------------------
   EDIT PAGE
--------------------------------------------------------- */

function initProfileEdit(data) {
    const fullName = document.getElementById("fullName");
    const age = document.getElementById("age");
    const sex = document.getElementById("sex");
    const heightCm = document.getElementById("heightCm");
    const weightKg = document.getElementById("weightKg");
    const activityLevel = document.getElementById("activityLevel");
    const goal = document.getElementById("goal");
    const goalPace = document.getElementById("goalPace");

    const snapshotBMI = document.getElementById("snapshotBMI");
    const snapshotTDEE = document.getElementById("snapshotTDEE");
    const snapshotTarget = document.getElementById("snapshotTarget");

    const profileNameDisplay = document.getElementById("profileNameDisplay");
    const profileMeta = document.getElementById("profileMeta");
    const profileAvatar = document.getElementById("profileAvatar");
    const profileLevelBadge = document.getElementById("profileLevelBadge");
    const xpFillProfile = document.getElementById("xpFillProfile");
    const profileTone = document.getElementById("profileTone");

    const changePhotoBtn = document.getElementById("changePhotoBtn");
    const photoInput = document.getElementById("photoInput");
    const saveProfileBtn = document.getElementById("saveProfileBtn");

    // Populate fields
    fullName.value = data.name || "";
    age.value = data.age || "";
    sex.value = data.sex || "";
    heightCm.value = data.heightCm || "";
    weightKg.value = data.weightKg || "";
    activityLevel.value = data.activityLevel || "";
    goal.value = data.goal || "";
    goalPace.value = data.goalPace || "";

    // Avatar
    if (data.avatarUrl) {
        profileAvatar.src = data.avatarUrl + "?t=" + Date.now();
    }

    // Name + meta
    profileNameDisplay.innerText = data.name || "Your Name";
    profileMeta.innerText = `Age: ${data.age || "–"} • Sex: ${data.sex || "–"}`;

    // XP + level
    const xp = data.xp || 0;
    const level = data.level || (Math.floor(xp / 100) + 1);
    profileLevelBadge.innerText = "Lv " + level;
    xpFillProfile.style.width = (xp % 100) + "%";

    // Targets + BMI
    const bmi = computeBMI(data.weightKg, data.heightCm);
    const targets = computeTargetsFromData(data);

    if (bmi) snapshotBMI.innerText = bmi.toFixed(1);
    if (targets) {
        snapshotTDEE.innerText = Math.round(targets.tdee) + " kcal";
        snapshotTarget.innerText = Math.round(targets.targetCalories) + " kcal";
    }

    // Tone
    const tone = FitQuestBrain.toneEngine({
        bmi: bmi,
        trend: null,
        goal: data.goal,
        pace: data.goalPace
    });
    profileTone.innerText = `${tone.headline} — ${tone.subline}`;

    // Live update snapshot
    [age, sex, heightCm, weightKg, activityLevel, goal, goalPace].forEach(el => {
        el.addEventListener("input", () => {
            const tempData = {
                sex: sex.value || null,
                weightKg: weightKg.value ? parseFloat(weightKg.value) : null,
                heightCm: heightCm.value ? parseFloat(heightCm.value) : null,
                age: age.value ? parseInt(age.value) : null,
                activityLevel: activityLevel.value || null,
                goal: goal.value || null,
                goalPace: goalPace.value || null
            };

            const tempBMI = computeBMI(tempData.weightKg, tempData.heightCm);
            const tempTargets = computeTargetsFromData(tempData);

            snapshotBMI.innerText = tempBMI ? tempBMI.toFixed(1) : "–";
            snapshotTDEE.innerText = tempTargets ? Math.round(tempTargets.tdee) + " kcal" : "– kcal";
            snapshotTarget.innerText = tempTargets ? Math.round(tempTargets.targetCalories) + " kcal" : "– kcal";
        });
    });

    /* ---------------------------------------------------------
       ⭐ FIXED AVATAR UPLOAD — correct bucket + CORS safe
    --------------------------------------------------------- */
    changePhotoBtn.addEventListener("click", () => photoInput.click());

    photoInput.addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        const avatarRef = storageRef.child(`avatars/${currentUser.uid}.jpg`);

        await avatarRef.put(file);
        const url = await avatarRef.getDownloadURL();

        await userRef.set({ avatarUrl: url }, { merge: true });
        profileAvatar.src = url + "?t=" + Date.now();
    });

    // Save profile
    saveProfileBtn.addEventListener("click", async () => {
        if (!currentUser) return;

        const newName = fullName.value.trim();
        const newAge = age.value ? parseInt(age.value) : null;
        const newSex = sex.value || null;
        const newHeight = heightCm.value ? parseFloat(heightCm.value) : null;
        const newWeight = weightKg.value ? parseFloat(weightKg.value) : null;
        const newActivity = activityLevel.value || null;
        const newGoal = goal.value || null;
        const newGoalPace = goalPace.value || null;

        const newBMI = computeBMI(newWeight, newHeight);
        const newTargets = computeTargetsFromData({
            sex: newSex,
            weightKg: newWeight,
            heightCm: newHeight,
            age: newAge,
            activityLevel: newActivity,
            goal: newGoal,
            goalPace: newGoalPace
        });

        // Weight history update
        let weightHistory = data.weightHistory || [];
        if (newWeight && newWeight !== data.weightKg) {
            weightHistory = weightHistory.concat([{
                date: new Date().toISOString(),
                weight: newWeight
            }]);
        }

        const payload = {
            name: newName || null,
            age: newAge,
            sex: newSex,
            heightCm: newHeight,
            weightKg: newWeight,
            activityLevel: newActivity,
            goal: newGoal,
            goalPace: newGoalPace,
            bmi: newBMI || null,
            weightHistory: weightHistory
        };

        if (newTargets) {
            payload.tdee = newTargets.tdee;
            payload.targetCalories = newTargets.targetCalories;
        }

        await userRef.set(payload, { merge: true });

        FitQuestBrain.awardXp(userRef, 30, "profile_update");

        profileNameDisplay.innerText = newName || "Your Name";
        profileMeta.innerText = `Age: ${newAge || "–"} • Sex: ${newSex || "–"}`;
        snapshotBMI.innerText = newBMI ? newBMI.toFixed(1) : "–";
        snapshotTDEE.innerText = newTargets ? Math.round(newTargets.tdee) + " kcal" : "– kcal";
        snapshotTarget.innerText = newTargets ? Math.round(newTargets.targetCalories) + " kcal" : "– kcal";

        alert("Profile saved successfully.");
    });
}

/* ---------------------------------------------------------
   VIEW PAGE
--------------------------------------------------------- */

function initProfileView(data) {
    const viewProfileAvatar = document.getElementById("viewProfileAvatar");
    const viewProfileLevelBadge = document.getElementById("viewProfileLevelBadge");
    const xpFillView = document.getElementById("xpFillView");
    const viewProfileName = document.getElementById("viewProfileName");
    const viewProfileMeta = document.getElementById("viewProfileMeta");
    const viewProfileTone = document.getElementById("viewProfileTone");

    const viewFullName = document.getElementById("viewFullName");
    const viewAge = document.getElementById("viewAge");
    const viewSex = document.getElementById("viewSex");
    const viewHeight = document.getElementById("viewHeight");
    const viewWeight = document.getElementById("viewWeight");
    const viewActivity = document.getElementById("viewActivity");
    const viewGoal = document.getElementById("viewGoal");
    const viewGoalPace = document.getElementById("viewGoalPace");

    const viewBMI = document.getElementById("viewBMI");
    const viewTDEE = document.getElementById("viewTDEE");
    const viewTarget = document.getElementById("viewTarget");

    if (data.avatarUrl) {
        viewProfileAvatar.src = data.avatarUrl + "?t=" + Date.now();
    }

    viewProfileName.innerText = data.name || "Your Name";
    viewProfileMeta.innerText = `Age: ${data.age || "–"} • Sex: ${data.sex || "–"}`;

    const xp = data.xp || 0;
    const level = data.level || (Math.floor(xp / 100) + 1);
    viewProfileLevelBadge.innerText = "Lv " + level;
    xpFillView.style.width = (xp % 100) + "%";

    viewFullName.innerText = data.name || "–";
    viewAge.innerText = data.age || "–";
    viewSex.innerText = data.sex || "–";
    viewHeight.innerText = data.heightCm ? `${data.heightCm} cm` : "–";
    viewWeight.innerText = data.weightKg ? `${data.weightKg} kg` : "–";
    viewActivity.innerText = data.activityLevel || "–";
    viewGoal.innerText = data.goal || "–";
    viewGoalPace.innerText = data.goalPace || "–";

    const bmi = data.bmi || computeBMI(data.weightKg, data.heightCm);
    const targets = computeTargetsFromData(data);

    viewBMI.innerText = bmi ? bmi.toFixed(1) : "–";
    viewTDEE.innerText = targets ? Math.round(targets.tdee) + " kcal" : "– kcal";
    viewTarget.innerText = targets ? Math.round(targets.targetCalories) + " kcal" : "– kcal";

    const tone = FitQuestBrain.toneEngine({
        bmi: bmi,
        trend: null,
        goal: data.goal,
        pace: data.goalPace
    });
    viewProfileTone.innerText = `${tone.headline} — ${tone.subline}`;

    const tdeeExplain = document.createElement("p");
    tdeeExplain.style.marginTop = "10px";
    tdeeExplain.style.opacity = "0.85";
    tdeeExplain.style.fontSize = "0.85rem";
    tdeeExplain.innerText =
        "TDEE = Total Daily Energy Expenditure — the number of calories your body burns each day including movement, exercise, and basic functions.";
    viewProfileTone.insertAdjacentElement("afterend", tdeeExplain);
}
