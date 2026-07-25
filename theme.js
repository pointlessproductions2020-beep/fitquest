/*
===========================================================
FITQUEST THEME ENGINE
Version 1.0
One theme engine for the entire application.
===========================================================
*/

const FitQuestTheme = (() => {

    const DEFAULT_THEME = {

        themeMode: "single",

        primary: "#00eaff",
        secondary: "#8b5cf6",
        accent: "#ff2bd6",

        background: "#050816",
        panel: "#101828",
        card: "#162032",

        text: "#ffffff",
        muted: "#94a3b8",

        glowStrength: 1,
        animationSpeed: 1,
        uiScale: 1,

        reducedMotion: false,
        minimalMode: false
    };

    let currentTheme = {...DEFAULT_THEME};

    function setVariable(name,value){
        document.documentElement.style.setProperty(name,value);
    }

    function applyCSS(){

        setVariable("--primary",currentTheme.primary);
        setVariable("--secondary",currentTheme.secondary);
        setVariable("--accent",currentTheme.accent);

        setVariable("--fq-primary",currentTheme.primary);
        setVariable("--fq-secondary",currentTheme.secondary);
        setVariable("--fq-accent",currentTheme.accent);

        setVariable("--neon",currentTheme.primary);

        setVariable("--background",currentTheme.background);
        setVariable("--fq-bg",currentTheme.background);

        setVariable("--panel",currentTheme.panel);
        setVariable("--fq-panel",currentTheme.panel);

        setVariable("--card",currentTheme.card);

        setVariable("--text",currentTheme.text);

        setVariable("--muted",currentTheme.muted);

        setVariable("--glow-strength",currentTheme.glowStrength);

        setVariable("--animation-speed",currentTheme.animationSpeed);

        setVariable("--ui-scale",currentTheme.uiScale);

        document.body.classList.toggle(
            "reduced-motion",
            currentTheme.reducedMotion
        );

        document.body.classList.toggle(
            "minimal",
            currentTheme.minimalMode
        );
    }

    async function load(){

        const user = firebase.auth().currentUser;

        if(!user) return;

        const doc = await firebase
            .firestore()
            .collection("users")
            .doc(user.uid)
            .get();

        if(doc.exists){

            const settings =
                doc.data().settings || {};

            currentTheme = {
                ...DEFAULT_THEME,
                ...settings
            };

            applyCSS();
        }

    }

    async function save(theme){

        const user = firebase.auth().currentUser;

        if(!user) return;

        currentTheme = {
            ...currentTheme,
            ...theme
        };

        await firebase
            .firestore()
            .collection("users")
            .doc(user.uid)
            .set({
                settings: currentTheme
            },{merge:true});

        applyCSS();

    }

    function reset(){

        currentTheme = {
            ...DEFAULT_THEME
        };

        applyCSS();

    }

    function get(){

        return {
            ...currentTheme
        };

    }

    return {

        load,
        save,
        reset,
        get,
        apply:applyCSS

    };

})();
