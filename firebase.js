/* ---------------------------------------------------
   Firebase Config — FINAL FIXED VERSION
   Uses the correct firebasestorage.app bucket
--------------------------------------------------- */

const firebaseConfig = {
  apiKey: "AIzaSyAVtxIzKrcj5VkTuSo7boaki3CfQzff3gA",
  authDomain: "fitquest-1b9f1.firebaseapp.com",
  projectId: "fitquest-1b9f1",

  // ⭐ THIS WAS THE PROBLEM — now fixed
  storageBucket: "fitquest-1b9f1.firebasestorage.app",

  messagingSenderId: "958554033321",
  appId: "1:958554033321:web:07b2fa75d1e4c9243e2db8",
  measurementId: "G-ZVFR6222TF"
};

/* ---------------------------------------------------
   Initialize Firebase
--------------------------------------------------- */

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();   // ⭐ Correct global storage instance

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

/* ---------------------------------------------------
   FITQUEST THEME ENGINE
   Loads saved settings from users/{uid}.settings
   and applies them across old and new pages
--------------------------------------------------- */

let fitQuestThemeInterval = null;

function normaliseThemeSettings(settings = {}) {
    return {
        themeMode: settings.themeMode || "single",

        singleColour:
            settings.singleColour || "#00eaff",

        grad1:
            settings.grad1 || "#00eaff",

        grad2:
            settings.grad2 || "#ff00ff",

        pal1:
            settings.pal1 || "#00eaff",

        pal2:
            settings.pal2 || "#7b2fff",

        pal3:
            settings.pal3 || "#ff00ff",

        pal4:
            settings.pal4 || "#ff8800",

        glowStrength:
            Number(settings.glowStrength ?? 1),

        animSpeed:
            Number(settings.animSpeed ?? 1),

        uiScale:
            Number(settings.uiScale ?? 1),

        reducedMotion:
            Boolean(settings.reducedMotion),

        minimalMode:
            Boolean(settings.minimalMode)
    };
}

function setFitQuestColourVariables(primary, secondary = primary) {
    const root = document.documentElement;

    /*
     * Old FitQuest pages
     */
    root.style.setProperty("--neon", primary);

    /*
     * New FitQuest pages use different variable names.
     * Setting all aliases keeps every page compatible.
     */
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--secondary", secondary);

    root.style.setProperty("--fq-primary", primary);
    root.style.setProperty("--fq-secondary", secondary);

    root.style.setProperty("--accent", secondary);
    root.style.setProperty("--fq-accent", secondary);
}

function stopFitQuestThemeRotation() {
    if (fitQuestThemeInterval) {
        clearInterval(fitQuestThemeInterval);
        fitQuestThemeInterval = null;
    }
}

function applyFitQuestThemeSettings(rawSettings = {}) {
    const settings =
        normaliseThemeSettings(rawSettings);

    const root = document.documentElement;
    const body = document.body;

    stopFitQuestThemeRotation();

    root.style.setProperty(
        "--glow-strength",
        String(settings.glowStrength)
    );

    root.style.setProperty(
        "--animation-speed",
        String(settings.animSpeed)
    );

    root.style.setProperty(
        "--ui-scale",
        String(settings.uiScale)
    );

    /*
     * Store scale as a variable rather than forcing every page
     * through a body transform. Individual upgraded pages can use
     * the variable safely.
     */
    root.style.setProperty(
        "--fitquest-ui-scale",
        String(settings.uiScale)
    );

    body.classList.toggle(
        "reduced-motion",
        settings.reducedMotion
    );

    body.classList.toggle(
        "minimal",
        settings.minimalMode
    );

    if (settings.reducedMotion) {
        root.style.setProperty(
            "--animation-speed",
            "0"
        );
    }

    switch (settings.themeMode) {
        case "single":
            setFitQuestColourVariables(
                settings.singleColour,
                settings.singleColour
            );
            break;

        case "gradient":
            setFitQuestColourVariables(
                settings.grad1,
                settings.grad2
            );

            root.style.setProperty(
                "--fitquest-gradient",
                `linear-gradient(
                    100deg,
                    ${settings.grad1},
                    ${settings.grad2}
                )`
            );
            break;

        case "palette":
            setFitQuestColourVariables(
                settings.pal1,
                settings.pal2
            );

            root.style.setProperty(
                "--fitquest-palette-1",
                settings.pal1
            );

            root.style.setProperty(
                "--fitquest-palette-2",
                settings.pal2
            );

            root.style.setProperty(
                "--fitquest-palette-3",
                settings.pal3
            );

            root.style.setProperty(
                "--fitquest-palette-4",
                settings.pal4
            );
            break;

        case "ambient": {
            const ambientColours = [
                settings.pal1,
                settings.pal2,
                settings.pal3,
                settings.pal4
            ];

            let ambientIndex = 0;

            setFitQuestColourVariables(
                ambientColours[0],
                ambientColours[1]
            );

            if (!settings.reducedMotion) {
                const intervalMs =
                    Math.max(
                        1500,
                        5000 / Math.max(
                            settings.animSpeed,
                            0.5
                        )
                    );

                fitQuestThemeInterval =
                    setInterval(() => {
                        ambientIndex =
                            (
                                ambientIndex + 1
                            ) % ambientColours.length;

                        const nextIndex =
                            (
                                ambientIndex + 1
                            ) % ambientColours.length;

                        setFitQuestColourVariables(
                            ambientColours[
                                ambientIndex
                            ],
                            ambientColours[
                                nextIndex
                            ]
                        );
                    }, intervalMs);
            }

            break;
        }

        case "random": {
            function createRandomColour() {
                return `#${Math.floor(
                    Math.random() * 16777215
                )
                    .toString(16)
                    .padStart(6, "0")}`;
            }

            setFitQuestColourVariables(
                createRandomColour(),
                createRandomColour()
            );

            if (!settings.reducedMotion) {
                fitQuestThemeInterval =
                    setInterval(() => {
                        setFitQuestColourVariables(
                            createRandomColour(),
                            createRandomColour()
                        );
                    }, 5000);
            }

            break;
        }

        case "off":
            setFitQuestColourVariables(
                "#64748b",
                "#94a3b8"
            );

            root.style.setProperty(
                "--glow-strength",
                "0"
            );

            body.classList.add(
                "fitquest-neon-off"
            );
            break;

        default:
            setFitQuestColourVariables(
                settings.singleColour,
                settings.singleColour
            );
    }

    if (settings.themeMode !== "off") {
        body.classList.remove(
            "fitquest-neon-off"
        );
    }

    /*
     * Keep a local copy so the selected theme can appear quickly
     * before Firestore finishes loading next time.
     */
    try {
        localStorage.setItem(
            "fitquest_theme_settings",
            JSON.stringify(settings)
        );
    } catch (error) {
        console.warn(
            "Could not cache FitQuest theme:",
            error
        );
    }

    return settings;
}

async function applyUserTheme() {
    /*
     * Apply the locally cached theme immediately to avoid a flash
     * of the default cyan colour.
     */
    try {
        const cached =
            localStorage.getItem(
                "fitquest_theme_settings"
            );

        if (cached) {
            applyFitQuestThemeSettings(
                JSON.parse(cached)
            );
        }
    } catch (error) {
        console.warn(
            "Could not read cached FitQuest theme:",
            error
        );
    }

    const user =
        auth.currentUser;

    if (!user) {
        return null;
    }

    try {
        const userDocument =
            await db
                .collection("users")
                .doc(user.uid)
                .get();

        const settings =
            userDocument.exists
                ? userDocument.data().settings || {}
                : {};

        return applyFitQuestThemeSettings(
            settings
        );
    } catch (error) {
        console.error(
            "FitQuest theme could not be loaded:",
            error
        );

        return null;
    }
}
