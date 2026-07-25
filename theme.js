/* ============================================================
   FITQUEST THEME ENGINE — VERSION 2
   Complete replacement for theme.js

   Supports:
   - Single colour
   - Two-colour gradient
   - Multi-colour palette
   - Ambient rotation
   - Random colours
   - Neon off
   - Glow strength
   - Animation speed
   - UI scale
   - Reduced motion
   - Minimal mode

   Compatible with both original and upgraded FitQuest pages.
============================================================ */

"use strict";

const FitQuestTheme = (() => {
    const STORAGE_KEY = "fitquest_theme_settings_v2";

    const DEFAULT_SETTINGS = {
        themeMode: "single",

        singleColour: "#00eaff",

        grad1: "#00eaff",
        grad2: "#ff00ff",

        pal1: "#00eaff",
        pal2: "#7b2fff",
        pal3: "#ff00ff",
        pal4: "#ff8800",

        glowStrength: 1,
        animSpeed: 1,
        uiScale: 1,

        reducedMotion: false,
        minimalMode: false
    };

    let currentSettings = {
        ...DEFAULT_SETTINGS
    };

    let rotationTimer = null;
    let authObserverStarted = false;

    /* --------------------------------------------------------
       HELPERS
    -------------------------------------------------------- */

    function safeNumber(value, fallback) {
        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;
    }

    function normalise(raw = {}) {
        return {
            themeMode:
                raw.themeMode ||
                DEFAULT_SETTINGS.themeMode,

            singleColour:
                raw.singleColour ||
                raw.primary ||
                DEFAULT_SETTINGS.singleColour,

            grad1:
                raw.grad1 ||
                raw.primary ||
                DEFAULT_SETTINGS.grad1,

            grad2:
                raw.grad2 ||
                raw.secondary ||
                raw.accent ||
                DEFAULT_SETTINGS.grad2,

            pal1:
                raw.pal1 ||
                raw.primary ||
                DEFAULT_SETTINGS.pal1,

            pal2:
                raw.pal2 ||
                raw.secondary ||
                DEFAULT_SETTINGS.pal2,

            pal3:
                raw.pal3 ||
                raw.accent ||
                DEFAULT_SETTINGS.pal3,

            pal4:
                raw.pal4 ||
                DEFAULT_SETTINGS.pal4,

            glowStrength:
                safeNumber(
                    raw.glowStrength,
                    DEFAULT_SETTINGS.glowStrength
                ),

            animSpeed:
                safeNumber(
                    raw.animSpeed ??
                    raw.animationSpeed,
                    DEFAULT_SETTINGS.animSpeed
                ),

            uiScale:
                safeNumber(
                    raw.uiScale,
                    DEFAULT_SETTINGS.uiScale
                ),

            reducedMotion:
                Boolean(raw.reducedMotion),

            minimalMode:
                Boolean(raw.minimalMode)
        };
    }

    function stopRotation() {
        if (rotationTimer) {
            clearInterval(rotationTimer);
            rotationTimer = null;
        }
    }

    function setVariable(name, value) {
        document.documentElement.style.setProperty(
            name,
            String(value),
            "important"
        );
    }

    /*
     * This is the compatibility bridge.
     *
     * Original pages use --neon.
     * Dashboard uses --fq-primary.
     * Exercise and onboarding use --primary.
     *
     * All are updated together.
     */
    function setColours(
        primary,
        secondary = primary,
        accent = secondary
    ) {
        /* Original FitQuest pages */
        setVariable("--neon", primary);

        /* Upgraded dashboard pages */
        setVariable("--fq-primary", primary);
        setVariable("--fq-secondary", secondary);
        setVariable("--fq-accent", accent);

        /* Exercise, onboarding and future V2 pages */
        setVariable("--primary", primary);
        setVariable("--secondary", secondary);
        setVariable("--accent", accent);

        /* Shared aliases for future components */
        setVariable("--theme-primary", primary);
        setVariable("--theme-secondary", secondary);
        setVariable("--theme-accent", accent);
    }

    function cache(settings) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(settings)
            );
        } catch (error) {
            console.warn(
                "FitQuest theme could not be cached:",
                error
            );
        }
    }

    function readCache() {
        try {
            const saved =
                localStorage.getItem(STORAGE_KEY);

            return saved
                ? JSON.parse(saved)
                : null;
        } catch (error) {
            console.warn(
                "FitQuest cached theme could not be read:",
                error
            );

            return null;
        }
    }

    function randomColour() {
        return `#${Math.floor(
            Math.random() * 16777215
        )
            .toString(16)
            .padStart(6, "0")}`;
    }

    /* --------------------------------------------------------
       APPLY THEME
    -------------------------------------------------------- */

    function apply(rawSettings = currentSettings) {
        currentSettings =
            normalise(rawSettings);

        stopRotation();

        const body = document.body;

        setVariable(
            "--glow-strength",
            currentSettings.glowStrength
        );

        setVariable(
            "--animation-speed",
            currentSettings.reducedMotion
                ? 0
                : currentSettings.animSpeed
        );

        setVariable(
            "--ui-scale",
            currentSettings.uiScale
        );

        setVariable(
            "--fitquest-ui-scale",
            currentSettings.uiScale
        );

        if (body) {
            body.classList.toggle(
                "reduced-motion",
                currentSettings.reducedMotion
            );

            body.classList.toggle(
                "minimal",
                currentSettings.minimalMode
            );

            body.classList.toggle(
                "fitquest-neon-off",
                currentSettings.themeMode === "off"
            );
        }

        switch (currentSettings.themeMode) {
            case "single":
                setColours(
                    currentSettings.singleColour,
                    currentSettings.singleColour,
                    currentSettings.singleColour
                );
                break;

            case "gradient":
                setColours(
                    currentSettings.grad1,
                    currentSettings.grad2,
                    currentSettings.grad2
                );

                setVariable(
                    "--fitquest-gradient",
                    `linear-gradient(
                        100deg,
                        ${currentSettings.grad1},
                        ${currentSettings.grad2}
                    )`
                );
                break;

            case "palette":
                setColours(
                    currentSettings.pal1,
                    currentSettings.pal2,
                    currentSettings.pal3
                );

                setVariable(
                    "--fitquest-palette-1",
                    currentSettings.pal1
                );

                setVariable(
                    "--fitquest-palette-2",
                    currentSettings.pal2
                );

                setVariable(
                    "--fitquest-palette-3",
                    currentSettings.pal3
                );

                setVariable(
                    "--fitquest-palette-4",
                    currentSettings.pal4
                );
                break;

            case "ambient": {
                const colours = [
                    currentSettings.pal1,
                    currentSettings.pal2,
                    currentSettings.pal3,
                    currentSettings.pal4
                ];

                let index = 0;

                setColours(
                    colours[0],
                    colours[1],
                    colours[2]
                );

                if (!currentSettings.reducedMotion) {
                    const delay = Math.max(
                        1500,
                        5000 /
                        Math.max(
                            currentSettings.animSpeed,
                            0.5
                        )
                    );

                    rotationTimer =
                        setInterval(() => {
                            index =
                                (index + 1) %
                                colours.length;

                            setColours(
                                colours[index],

                                colours[
                                    (index + 1) %
                                    colours.length
                                ],

                                colours[
                                    (index + 2) %
                                    colours.length
                                ]
                            );
                        }, delay);
                }

                break;
            }

            case "random":
                setColours(
                    randomColour(),
                    randomColour(),
                    randomColour()
                );

                if (!currentSettings.reducedMotion) {
                    rotationTimer =
                        setInterval(() => {
                            setColours(
                                randomColour(),
                                randomColour(),
                                randomColour()
                            );
                        }, 5000);
                }

                break;

            case "off":
                setColours(
                    "#64748b",
                    "#94a3b8",
                    "#94a3b8"
                );

                setVariable(
                    "--glow-strength",
                    0
                );

                break;

            default:
                setColours(
                    currentSettings.singleColour,
                    currentSettings.singleColour,
                    currentSettings.singleColour
                );
        }

        cache(currentSettings);

        window.fitQuestCurrentTheme = {
            ...currentSettings
        };

        return {
            ...currentSettings
        };
    }

    /* --------------------------------------------------------
       LOAD FROM FIRESTORE
    -------------------------------------------------------- */

    async function load() {
        /*
         * Apply the cached theme first so the page changes
         * immediately without waiting for Firestore.
         */
        const cached = readCache();

        if (cached) {
            apply(cached);
        }

        if (
            !window.firebase ||
            !firebase.auth ||
            !firebase.firestore
        ) {
            return {
                ...currentSettings
            };
        }

        const user =
            firebase.auth().currentUser;

        if (!user) {
            return {
                ...currentSettings
            };
        }

        try {
            const snapshot =
                await firebase
                    .firestore()
                    .collection("users")
                    .doc(user.uid)
                    .get();

            const settings =
                snapshot.exists
                    ? (
                        snapshot
                            .data()
                            .settings || {}
                    )
                    : {};

            return apply(settings);
        } catch (error) {
            console.error(
                "FitQuest theme could not be loaded:",
                error
            );

            return {
                ...currentSettings
            };
        }
    }

    /* --------------------------------------------------------
       SAVE TO FIRESTORE
    -------------------------------------------------------- */

    async function save(rawSettings) {
        if (
            !window.firebase ||
            !firebase.auth ||
            !firebase.firestore
        ) {
            throw new Error(
                "Firebase is not available."
            );
        }

        const user =
            firebase.auth().currentUser;

        if (!user) {
            throw new Error(
                "You must be logged in to save settings."
            );
        }

        const settings =
            normalise({
                ...currentSettings,
                ...rawSettings
            });

        await firebase
            .firestore()
            .collection("users")
            .doc(user.uid)
            .set(
                {
                    settings,

                    settingsUpdatedAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()
                },
                {
                    merge: true
                }
            );

        apply(settings);

        return {
            ...settings
        };
    }

    /* --------------------------------------------------------
       RESET
    -------------------------------------------------------- */

    async function reset() {
        return save({
            ...DEFAULT_SETTINGS
        });
    }

    /* --------------------------------------------------------
       PUBLIC HELPERS
    -------------------------------------------------------- */

    function get() {
        return {
            ...currentSettings
        };
    }

    function preview(rawSettings) {
        return apply({
            ...currentSettings,
            ...rawSettings
        });
    }

    /* --------------------------------------------------------
       EARLY CACHED THEME
    -------------------------------------------------------- */

    function applyCachedThemeEarly() {
        const cached = readCache();

        if (!cached) {
            return;
        }

        if (document.body) {
            apply(cached);
            return;
        }

        document.addEventListener(
            "DOMContentLoaded",
            () => {
                apply(cached);
            },
            {
                once: true
            }
        );
    }

    /* --------------------------------------------------------
       AUTOMATIC THEME LOADING
    -------------------------------------------------------- */

    function startAutomaticLoading() {
        if (
            authObserverStarted ||
            !window.firebase ||
            !firebase.auth
        ) {
            return;
        }

        authObserverStarted = true;

        firebase
            .auth()
            .onAuthStateChanged(
                async user => {
                    if (!user) {
                        stopRotation();
                        return;
                    }

                    try {
                        await load();
                    } catch (error) {
                        console.warn(
                            "Automatic FitQuest theme loading failed:",
                            error
                        );
                    }
                }
            );
    }

    applyCachedThemeEarly();

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            startAutomaticLoading,
            {
                once: true
            }
        );
    } else {
        startAutomaticLoading();
    }

    /*
     * Apply it once more after the page stylesheet and page
     * scripts have fully finished loading.
     */
    window.addEventListener(
        "load",
        () => {
            setTimeout(() => {
                if (
                    window.firebase &&
                    firebase.auth &&
                    firebase.auth().currentUser
                ) {
                    load();
                }
            }, 150);
        },
        {
            once: true
        }
    );

    return {
        load,
        save,
        reset,
        get,
        apply,
        preview,

        defaults: () => ({
            ...DEFAULT_SETTINGS
        }),

        stop: stopRotation
    };
})();

/* ============================================================
   COMPATIBILITY FUNCTION

   Your existing pages currently call:

       await applyUserTheme();

   This keeps those pages working without modifying them.
============================================================ */

async function applyUserTheme() {
    return FitQuestTheme.load();
}
