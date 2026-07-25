/* ---------------------------------------------------------
   FITQUEST PROFILE LOGIC
   Used by:
   - profile.html
   - profile-edit.html

   Firebase v8
--------------------------------------------------------- */

"use strict";

let currentUser = null;
let userRef = null;

/*
 * Storage safety:
 * profile.js will no longer crash if Firebase Storage
 * is temporarily unavailable or not loaded.
 */
const storageRef =
    typeof storage !== "undefined" &&
    storage &&
    typeof storage.ref === "function"
        ? storage.ref()
        : null;


/* ---------------------------------------------------------
   AUTHENTICATION + INITIALISATION
--------------------------------------------------------- */

auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = "index.html";
        return;
    }

    /*
     * This uses the compatibility function provided by theme.js.
     * Do not add another theme auth listener elsewhere.
     */
    if (typeof applyUserTheme === "function") {
        await applyUserTheme();
    }

    currentUser = user;
    userRef = db
        .collection("users")
        .doc(user.uid);

    try {
        const documentSnapshot =
            await userRef.get();

        const data =
            documentSnapshot.exists
                ? documentSnapshot.data()
                : {};

        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        if (currentPage === "profile-edit.html") {
            initProfileEdit(data);
            return;
        }

        if (
            currentPage === "profile.html" ||
            currentPage === ""
        ) {
            initProfileView(data);
        }
    } catch (error) {
        console.error(
            "FitQuest could not load the profile:",
            error
        );

        alert(
            "FitQuest could not load your profile. Please refresh the page."
        );
    }
});


/* ---------------------------------------------------------
   SHARED HELPERS
--------------------------------------------------------- */

function computeTargetsFromData(data) {
    if (
        !window.FitQuestBrain ||
        typeof FitQuestBrain.calculateTargets !== "function"
    ) {
        console.warn(
            "FitQuestBrain.calculateTargets is unavailable."
        );

        return null;
    }

    const profile = {
        sex: data.sex,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        age: data.age,
        activityLevel: data.activityLevel,
        goal: data.goal,
        goalPace: data.goalPace
    };

    const targets =
        FitQuestBrain.calculateTargets(profile);

    return targets || null;
}


function computeBMI(weightKg, heightCm) {
    const weight =
        Number(weightKg);

    const height =
        Number(heightCm);

    if (
        !Number.isFinite(weight) ||
        !Number.isFinite(height) ||
        weight <= 0 ||
        height <= 0
    ) {
        return null;
    }

    const heightMetres =
        height / 100;

    return weight /
        (heightMetres * heightMetres);
}


function formatDisplayValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "–";
    }

    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}


function showProfileStatus(message, isError = false) {
    const existingStatus =
        document.getElementById(
            "profileSaveStatus"
        );

    if (existingStatus) {
        existingStatus.textContent = message;
        existingStatus.style.color =
            isError
                ? "#ff6685"
                : "var(--neon)";
        return;
    }

    if (isError) {
        alert(message);
    }
}


/* ---------------------------------------------------------
   PROFILE EDIT PAGE
--------------------------------------------------------- */

function initProfileEdit(data) {
    const fullName =
        document.getElementById("fullName");

    const age =
        document.getElementById("age");

    const sex =
        document.getElementById("sex");

    const heightCm =
        document.getElementById("heightCm");

    const weightKg =
        document.getElementById("weightKg");

    const activityLevel =
        document.getElementById(
            "activityLevel"
        );

    const goal =
        document.getElementById("goal");

    const goalPace =
        document.getElementById(
            "goalPace"
        );

    const snapshotBMI =
        document.getElementById(
            "snapshotBMI"
        );

    const snapshotTDEE =
        document.getElementById(
            "snapshotTDEE"
        );

    const snapshotTarget =
        document.getElementById(
            "snapshotTarget"
        );

    const profileNameDisplay =
        document.getElementById(
            "profileNameDisplay"
        );

    const profileMeta =
        document.getElementById(
            "profileMeta"
        );

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );

    const profileLevelBadge =
        document.getElementById(
            "profileLevelBadge"
        );

    const xpFillProfile =
        document.getElementById(
            "xpFillProfile"
        );

    const profileTone =
        document.getElementById(
            "profileTone"
        );

    const changePhotoBtn =
        document.getElementById(
            "changePhotoBtn"
        );

    const photoInput =
        document.getElementById(
            "photoInput"
        );

    const saveProfileBtn =
        document.getElementById(
            "saveProfileBtn"
        );


    /*
     * Stop safely if this script is accidentally loaded
     * on a page without the profile-edit form.
     */
    if (
        !fullName ||
        !age ||
        !sex ||
        !heightCm ||
        !weightKg ||
        !activityLevel ||
        !goal ||
        !goalPace
    ) {
        console.warn(
            "Profile edit fields were not found."
        );

        return;
    }


    /* -----------------------------------------------------
       POPULATE FORM
    ----------------------------------------------------- */

    fullName.value =
        data.name || "";

    age.value =
        data.age ?? "";

    sex.value =
        data.sex || "";

    heightCm.value =
        data.heightCm ?? "";

    weightKg.value =
        data.weightKg ?? "";

    activityLevel.value =
        data.activityLevel || "";

    goal.value =
        data.goal || "";

    goalPace.value =
        data.goalPace || "";


    /* -----------------------------------------------------
       AVATAR
    ----------------------------------------------------- */

    if (
        profileAvatar &&
        data.avatarUrl
    ) {
        profileAvatar.src =
            `${data.avatarUrl}&t=${Date.now()}`;
    }


    /* -----------------------------------------------------
       NAME + META
    ----------------------------------------------------- */

    setText(
        profileNameDisplay,
        data.name || "Your Name"
    );

    setText(
        profileMeta,
        `Age: ${data.age || "–"} • Sex: ${formatDisplayValue(data.sex)}`
    );


    /* -----------------------------------------------------
       XP + LEVEL
    ----------------------------------------------------- */

    const xp =
        Number(data.xp) || 0;

    const level =
        Number(data.level) ||
        Math.floor(xp / 100) + 1;

    setText(
        profileLevelBadge,
        `Lv ${level}`
    );

    if (xpFillProfile) {
        xpFillProfile.style.width =
            `${xp % 100}%`;
    }


    /* -----------------------------------------------------
       CURRENT HEALTH SNAPSHOT
    ----------------------------------------------------- */

    const bmi =
        computeBMI(
            data.weightKg,
            data.heightCm
        );

    const targets =
        computeTargetsFromData(data);

    setText(
        snapshotBMI,
        bmi
            ? bmi.toFixed(1)
            : "–"
    );

    setText(
        snapshotTDEE,
        targets &&
        Number.isFinite(targets.tdee)
            ? `${Math.round(targets.tdee)} kcal`
            : "– kcal"
    );

    setText(
        snapshotTarget,
        targets &&
        Number.isFinite(
            targets.targetCalories
        )
            ? `${Math.round(
                targets.targetCalories
            )} kcal`
            : "– kcal"
    );


    /* -----------------------------------------------------
       SUPPORTIVE TONE
    ----------------------------------------------------- */

    updateProfileTone(
        profileTone,
        {
            bmi,
            goal: data.goal,
            goalPace: data.goalPace
        }
    );


    /* -----------------------------------------------------
       LIVE SNAPSHOT UPDATE
    ----------------------------------------------------- */

    [
        age,
        sex,
        heightCm,
        weightKg,
        activityLevel,
        goal,
        goalPace
    ].forEach(element => {
        element.addEventListener(
            "input",
            updateLiveProfileSnapshot
        );

        element.addEventListener(
            "change",
            updateLiveProfileSnapshot
        );
    });


    function getTemporaryProfileData() {
        return {
            sex:
                sex.value || null,

            weightKg:
                weightKg.value
                    ? Number(weightKg.value)
                    : null,

            heightCm:
                heightCm.value
                    ? Number(heightCm.value)
                    : null,

            age:
                age.value
                    ? Number(age.value)
                    : null,

            activityLevel:
                activityLevel.value || null,

            goal:
                goal.value || null,

            goalPace:
                goalPace.value || null
        };
    }


    function updateLiveProfileSnapshot() {
        const temporaryData =
            getTemporaryProfileData();

        const temporaryBMI =
            computeBMI(
                temporaryData.weightKg,
                temporaryData.heightCm
            );

        const temporaryTargets =
            computeTargetsFromData(
                temporaryData
            );

        setText(
            snapshotBMI,
            temporaryBMI
                ? temporaryBMI.toFixed(1)
                : "–"
        );

        setText(
            snapshotTDEE,
            temporaryTargets &&
            Number.isFinite(
                temporaryTargets.tdee
            )
                ? `${Math.round(
                    temporaryTargets.tdee
                )} kcal`
                : "– kcal"
        );

        setText(
            snapshotTarget,
            temporaryTargets &&
            Number.isFinite(
                temporaryTargets.targetCalories
            )
                ? `${Math.round(
                    temporaryTargets.targetCalories
                )} kcal`
                : "– kcal"
        );

        updateProfileTone(
            profileTone,
            {
                bmi: temporaryBMI,
                goal: temporaryData.goal,
                goalPace:
                    temporaryData.goalPace
            }
        );
    }


    /* -----------------------------------------------------
       AVATAR UPLOAD
    ----------------------------------------------------- */

    if (
        changePhotoBtn &&
        photoInput
    ) {
        changePhotoBtn.addEventListener(
            "click",
            () => {
                photoInput.click();
            }
        );

        photoInput.addEventListener(
            "change",
            async event => {
                const file =
                    event.target.files[0];

                if (
                    !file ||
                    !currentUser
                ) {
                    return;
                }

                if (!storageRef) {
                    alert(
                        "Photo storage is currently unavailable. Please try again later."
                    );

                    photoInput.value = "";
                    return;
                }

                const allowedTypes = [
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/webp"
                ];

                const maximumSize =
                    2 * 1024 * 1024;

                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {
                    alert(
                        "Please upload a JPG, JPEG, PNG or WEBP image."
                    );

                    photoInput.value = "";
                    return;
                }

                if (
                    file.size > maximumSize
                ) {
                    alert(
                        "Your profile image must be smaller than 2 MB."
                    );

                    photoInput.value = "";
                    return;
                }

                let extension = "jpg";

                if (
                    file.type === "image/jpeg"
                ) {
                    extension = "jpeg";
                }

                if (
                    file.type === "image/png"
                ) {
                    extension = "png";
                }

                if (
                    file.type === "image/webp"
                ) {
                    extension = "webp";
                }

                const avatarReference =
                    storageRef.child(
                        `avatars/${currentUser.uid}.${extension}`
                    );

                changePhotoBtn.disabled = true;
                changePhotoBtn.textContent =
                    "Uploading...";

                try {
                    await avatarReference.put(file);

                    const url =
                        await avatarReference
                            .getDownloadURL();

                    await userRef.set(
                        {
                            avatarUrl: url,
                            avatarUpdatedAt:
                                firebase.firestore
                                    .FieldValue
                                    .serverTimestamp()
                        },
                        {
                            merge: true
                        }
                    );

                    if (profileAvatar) {
                        profileAvatar.src =
                            `${url}&t=${Date.now()}`;
                    }

                    alert(
                        "Profile photo updated successfully."
                    );
                } catch (error) {
                    console.error(
                        "Avatar upload failed:",
                        error
                    );

                    alert(
                        "The profile photo could not be uploaded. Please try again."
                    );
                } finally {
                    changePhotoBtn.disabled = false;
                    changePhotoBtn.textContent =
                        "Change Photo";

                    photoInput.value = "";
                }
            }
        );
    }


    /* -----------------------------------------------------
       SAVE PROFILE
    ----------------------------------------------------- */

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener(
            "click",
            async () => {
                if (!currentUser) {
                    return;
                }

                const newName =
                    fullName.value
                        .trim()
                        .replace(/\s+/g, " ");

                const newAge =
                    age.value
                        ? Number(age.value)
                        : null;

                const newSex =
                    sex.value || null;

                const newHeight =
                    heightCm.value
                        ? Number(heightCm.value)
                        : null;

                const newWeight =
                    weightKg.value
                        ? Number(weightKg.value)
                        : null;

                const newActivity =
                    activityLevel.value || null;

                const newGoal =
                    goal.value || null;

                const newGoalPace =
                    goalPace.value || null;


                /* -----------------------------------------
                   VALIDATION
                ----------------------------------------- */

                if (
                    newName.length < 2
                ) {
                    alert(
                        "Please enter your name."
                    );

                    fullName.focus();
                    return;
                }

                if (
                    !newAge ||
                    newAge < 16 ||
                    newAge > 120
                ) {
                    alert(
                        "Please enter a valid age between 16 and 120."
                    );

                    age.focus();
                    return;
                }

                if (
                    !newHeight ||
                    newHeight < 100 ||
                    newHeight > 250
                ) {
                    alert(
                        "Please enter a valid height in centimetres."
                    );

                    heightCm.focus();
                    return;
                }

                if (
                    !newWeight ||
                    newWeight < 30 ||
                    newWeight > 400
                ) {
                    alert(
                        "Please enter a valid weight in kilograms."
                    );

                    weightKg.focus();
                    return;
                }


                const newBMI =
                    computeBMI(
                        newWeight,
                        newHeight
                    );

                const newTargets =
                    computeTargetsFromData({
                        sex: newSex,
                        weightKg: newWeight,
                        heightCm: newHeight,
                        age: newAge,
                        activityLevel: newActivity,
                        goal: newGoal,
                        goalPace: newGoalPace
                    });


                /* -----------------------------------------
                   WEIGHT HISTORY
                ----------------------------------------- */

                let weightHistory =
                    Array.isArray(
                        data.weightHistory
                    )
                        ? [...data.weightHistory]
                        : [];

                const previousWeight =
                    Number(data.weightKg);

                if (
                    newWeight &&
                    (
                        !Number.isFinite(
                            previousWeight
                        ) ||
                        newWeight !==
                            previousWeight
                    )
                ) {
                    weightHistory.push({
                        date:
                            new Date()
                                .toISOString(),

                        timestamp:
                            Date.now(),

                        weight:
                            newWeight,

                        weightKg:
                            newWeight
                    });
                }


                const payload = {
                    name: newName,
                    age: newAge,
                    sex: newSex,
                    heightCm: newHeight,
                    weightKg: newWeight,
                    activityLevel:
                        newActivity,
                    goal: newGoal,
                    goalPace:
                        newGoalPace,

                    bmi:
                        newBMI || null,

                    weightHistory,

                    profileUpdatedAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()
                };

                if (newTargets) {
                    payload.bmr =
                        Number.isFinite(
                            newTargets.bmr
                        )
                            ? newTargets.bmr
                            : null;

                    payload.tdee =
                        Number.isFinite(
                            newTargets.tdee
                        )
                            ? newTargets.tdee
                            : null;

                    payload.targetCalories =
                        Number.isFinite(
                            newTargets.targetCalories
                        )
                            ? newTargets.targetCalories
                            : null;
                }


                saveProfileBtn.disabled = true;
                saveProfileBtn.textContent =
                    "Saving...";

                try {
                    await userRef.set(
                        payload,
                        {
                            merge: true
                        }
                    );

                    /*
                     * Update the local copy so another save
                     * does not duplicate the same weight entry.
                     */
                    data = {
                        ...data,
                        ...payload
                    };

                    if (
                        window.FitQuestBrain &&
                        typeof FitQuestBrain.awardXp ===
                            "function"
                    ) {
                        await FitQuestBrain.awardXp(
                            userRef,
                            30,
                            "profile_update"
                        );
                    }

                    setText(
                        profileNameDisplay,
                        newName
                    );

                    setText(
                        profileMeta,
                        `Age: ${newAge} • Sex: ${formatDisplayValue(newSex)}`
                    );

                    setText(
                        snapshotBMI,
                        newBMI
                            ? newBMI.toFixed(1)
                            : "–"
                    );

                    setText(
                        snapshotTDEE,
                        newTargets &&
                        Number.isFinite(
                            newTargets.tdee
                        )
                            ? `${Math.round(
                                newTargets.tdee
                            )} kcal`
                            : "– kcal"
                    );

                    setText(
                        snapshotTarget,
                        newTargets &&
                        Number.isFinite(
                            newTargets.targetCalories
                        )
                            ? `${Math.round(
                                newTargets.targetCalories
                            )} kcal`
                            : "– kcal"
                    );

                    updateProfileTone(
                        profileTone,
                        {
                            bmi: newBMI,
                            goal: newGoal,
                            goalPace:
                                newGoalPace
                        }
                    );

                    showProfileStatus(
                        "Profile saved successfully."
                    );

                    alert(
                        "Profile saved successfully."
                    );
                } catch (error) {
                    console.error(
                        "Profile save failed:",
                        error
                    );

                    showProfileStatus(
                        "FitQuest could not save your profile.",
                        true
                    );
                } finally {
                    saveProfileBtn.disabled = false;
                    saveProfileBtn.textContent =
                        "Save Profile";
                }
            }
        );
    }
}


/* ---------------------------------------------------------
   PROFILE VIEW PAGE
--------------------------------------------------------- */

function initProfileView(data) {
    const viewProfileAvatar =
        document.getElementById(
            "viewProfileAvatar"
        );

    const viewProfileLevelBadge =
        document.getElementById(
            "viewProfileLevelBadge"
        );

    const xpFillView =
        document.getElementById(
            "xpFillView"
        );

    const viewProfileName =
        document.getElementById(
            "viewProfileName"
        );

    const viewProfileMeta =
        document.getElementById(
            "viewProfileMeta"
        );

    const viewProfileTone =
        document.getElementById(
            "viewProfileTone"
        );

    const viewFullName =
        document.getElementById(
            "viewFullName"
        );

    const viewAge =
        document.getElementById(
            "viewAge"
        );

    const viewSex =
        document.getElementById(
            "viewSex"
        );

    const viewHeight =
        document.getElementById(
            "viewHeight"
        );

    const viewWeight =
        document.getElementById(
            "viewWeight"
        );

    const viewActivity =
        document.getElementById(
            "viewActivity"
        );

    const viewGoal =
        document.getElementById(
            "viewGoal"
        );

    const viewGoalPace =
        document.getElementById(
            "viewGoalPace"
        );

    const viewBMI =
        document.getElementById(
            "viewBMI"
        );

    const viewTDEE =
        document.getElementById(
            "viewTDEE"
        );

    const viewTarget =
        document.getElementById(
            "viewTarget"
        );


    if (
        !viewProfileName ||
        !viewFullName
    ) {
        console.warn(
            "Profile view fields were not found."
        );

        return;
    }


    /* -----------------------------------------------------
       AVATAR
    ----------------------------------------------------- */

    if (
        viewProfileAvatar &&
        data.avatarUrl
    ) {
        viewProfileAvatar.src =
            `${data.avatarUrl}&t=${Date.now()}`;
    }


    /* -----------------------------------------------------
       NAME + META
    ----------------------------------------------------- */

    setText(
        viewProfileName,
        data.name || "Your Name"
    );

    setText(
        viewProfileMeta,
        `Age: ${data.age || "–"} • Sex: ${formatDisplayValue(data.sex)}`
    );


    /* -----------------------------------------------------
       XP + LEVEL
    ----------------------------------------------------- */

    const xp =
        Number(data.xp) || 0;

    const level =
        Number(data.level) ||
        Math.floor(xp / 100) + 1;

    setText(
        viewProfileLevelBadge,
        `Lv ${level}`
    );

    if (xpFillView) {
        xpFillView.style.width =
            `${xp % 100}%`;
    }


    /* -----------------------------------------------------
       PROFILE VALUES
    ----------------------------------------------------- */

    setText(
        viewFullName,
        data.name || "–"
    );

    setText(
        viewAge,
        data.age || "–"
    );

    setText(
        viewSex,
        formatDisplayValue(data.sex)
    );

    setText(
        viewHeight,
        data.heightCm
            ? `${data.heightCm} cm`
            : "–"
    );

    setText(
        viewWeight,
        data.weightKg
            ? `${data.weightKg} kg`
            : "–"
    );

    setText(
        viewActivity,
        formatDisplayValue(
            data.activityLevel
        )
    );

    setText(
        viewGoal,
        formatDisplayValue(data.goal)
    );

    setText(
        viewGoalPace,
        formatDisplayValue(
            data.goalPace
        )
    );


    /* -----------------------------------------------------
       HEALTH SNAPSHOT
    ----------------------------------------------------- */

    const bmi =
        Number(data.bmi) ||
        computeBMI(
            data.weightKg,
            data.heightCm
        );

    const targets =
        computeTargetsFromData(data);

    setText(
        viewBMI,
        bmi
            ? bmi.toFixed(1)
            : "–"
    );

    setText(
        viewTDEE,
        targets &&
        Number.isFinite(targets.tdee)
            ? `${Math.round(
                targets.tdee
            )} kcal`
            : (
                Number.isFinite(
                    Number(data.tdee)
                )
                    ? `${Math.round(
                        Number(data.tdee)
                    )} kcal`
                    : "– kcal"
            )
    );

    setText(
        viewTarget,
        targets &&
        Number.isFinite(
            targets.targetCalories
        )
            ? `${Math.round(
                targets.targetCalories
            )} kcal`
            : (
                Number.isFinite(
                    Number(
                        data.targetCalories
                    )
                )
                    ? `${Math.round(
                        Number(
                            data.targetCalories
                        )
                    )} kcal`
                    : "– kcal"
            )
    );


    /* -----------------------------------------------------
       SUPPORTIVE TONE
    ----------------------------------------------------- */

    updateProfileTone(
        viewProfileTone,
        {
            bmi,
            goal: data.goal,
            goalPace: data.goalPace
        }
    );

    /*
     * No TDEE paragraph is created here.
     * profile.html already contains the explanation,
     * preventing it from appearing twice.
     */
}


/* ---------------------------------------------------------
   SHARED TONE HANDLER
--------------------------------------------------------- */

function updateProfileTone(
    element,
    {
        bmi,
        goal,
        goalPace
    }
) {
    if (!element) {
        return;
    }

    if (
        !window.FitQuestBrain ||
        typeof FitQuestBrain.toneEngine !==
            "function"
    ) {
        element.textContent =
            "Your stats help FitQuest build guidance around your current journey.";

        return;
    }

    try {
        const tone =
            FitQuestBrain.toneEngine({
                bmi,
                trend: null,
                goal,
                pace: goalPace
            });

        if (
            tone &&
            (
                tone.headline ||
                tone.subline
            )
        ) {
            element.textContent =
                [
                    tone.headline,
                    tone.subline
                ]
                    .filter(Boolean)
                    .join(" — ");

            return;
        }

        element.textContent =
            "Your stats help FitQuest build guidance around your current journey.";
    } catch (error) {
        console.warn(
            "FitQuest tone engine failed:",
            error
        );

        element.textContent =
            "Your stats help FitQuest build guidance around your current journey.";
    }
}
