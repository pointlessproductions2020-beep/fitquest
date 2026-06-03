/* -----------------------------------------------------------
   GLOBAL CHART.JS SETTINGS
----------------------------------------------------------- */

Chart.defaults.color = "#cbd5e1";
Chart.defaults.font.family = "Inter, system-ui, sans-serif";
Chart.defaults.borderColor = "rgba(148,163,184,0.25)";
Chart.defaults.plugins.legend.labels.color = "#e2e8f0";
Chart.defaults.scale.grid.color = "rgba(56,189,248,0.18)";
Chart.defaults.scale.grid.borderColor = "rgba(56,189,248,0.4)";
Chart.defaults.scale.ticks.color = "#38bdf8";
Chart.defaults.scale.ticks.font = {
    size: 11,
    weight: "500"
};

/* Neon glow plugin */
const neonGlow = {
    id: "neonGlow",
    beforeDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.shadowColor = "rgba(56,189,248,0.55)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    },
    afterDraw: (chart) => {
        chart.ctx.restore();
    }
};

Chart.register(neonGlow);

/* Gradient helper */
function neonGradient(ctx, color1, color2) {
    const g = ctx.createLinearGradient(0, 0, 0, 260);
    g.addColorStop(0, color1);
    g.addColorStop(1, color2);
    return g;
}

/* -----------------------------------------------------------
   NEON ENGINE — SLOW AMBIENT ROTATION
----------------------------------------------------------- */

const neonCycle = ["#00eaff", "#7b2fff", "#ff00ff", "#ff8800"];
let neonIndex = 0;

setInterval(() => {
    neonIndex = (neonIndex + 1) % neonCycle.length;
    document.documentElement.style.setProperty("--neon", neonCycle[neonIndex]);
}, 9000);

/* -----------------------------------------------------------
   CLICK SPARK BURST — HYBRID COLOURS
----------------------------------------------------------- */

const sparkPalette = ["#00eaff", "#7b2fff", "#ff00ff", "#ff8800", "#22c55e"];

function getCurrentNeon() {
    const style = getComputedStyle(document.documentElement);
    return style.getPropertyValue("--neon").trim() || "#38bdf8";
}

function sparkBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    for (let i = 0; i < 8; i++) {
        const spark = document.createElement("span");
        spark.className = "spark";

        const usePalette = Math.random() < 0.3;
        const color = usePalette
            ? sparkPalette[Math.floor(Math.random() * sparkPalette.length)]
            : getCurrentNeon();

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

function initNeonInteractions() {
    const interactive = document.querySelectorAll(".neon-interactive");
    interactive.forEach(el => {
        el.addEventListener("click", () => sparkBurst(el));
    });
}

/* -----------------------------------------------------------
   FIRESTORE HELPERS
----------------------------------------------------------- */

async function getUserRef() {
    return new Promise(resolve => {
        auth.onAuthStateChanged(user => {
            if (!user) return resolve(null);
            resolve(db.collection("users").doc(user.uid));
        });
    });
}

/* -----------------------------------------------------------
   INTAKE CHART (DAY / WEEK / MONTH)
----------------------------------------------------------- */

let intakeChart = null;

async function loadIntakeData(range) {
    const userRef = await getUserRef();
    if (!userRef) return { labels: [], data: [] };

    const foodSnap = await userRef.collection("food").get();
    const items = foodSnap.docs.map(d => d.data());

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (range === "day") {
        const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am → 8pm
        const totals = hours.map(() => 0);

        items.forEach(item => {
            const ts = new Date(item.timestamp);
            const date = ts.toISOString().split("T")[0];
            if (date === today) {
                const hour = ts.getHours();
                const index = hours.indexOf(hour);
                if (index !== -1) totals[index] += item.totalCalories || item.calories || 0;
            }
        });

        return {
            labels: hours.map(h => `${h}:00`),
            data: totals
        };
    }

    if (range === "week") {
        const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        const totals = Array(7).fill(0);

        items.forEach(item => {
            const ts = new Date(item.timestamp);
            const day = ts.getDay(); // 0=Sun
            const index = day === 0 ? 6 : day - 1;
            totals[index] += item.totalCalories || item.calories || 0;
        });

        return { labels, data: totals };
    }

    if (range === "month") {
        const labels = ["Week 1","Week 2","Week 3","Week 4"];
        const totals = [0,0,0,0];

        items.forEach(item => {
            const ts = new Date(item.timestamp);
            const week = Math.floor((ts.getDate() - 1) / 7);
            totals[week] += item.totalCalories || item.calories || 0;
        });

        return { labels, data: totals };
    }

    return { labels: [], data: [] };
}

async function renderIntakeChart(range = "day") {
    const canvas = document.getElementById("intakeChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { labels, data } = await loadIntakeData(range);

    if (intakeChart) intakeChart.destroy();

    intakeChart = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Calories",
                data,
                borderColor: "#38bdf8",
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: "#38bdf8",
                fill: true,
                backgroundColor: neonGradient(ctx, "rgba(56,189,248,0.4)", "rgba(56,189,248,0)"),
                tension: 0.35
            }]
        },
        options: {
            plugins: { legend: { display: false } }
        }
    });
}

window.updateIntakeChartRange = (range) => renderIntakeChart(range);

/* -----------------------------------------------------------
   WORKOUT TRACKER (SESSIONS / CALORIES / MINUTES)
----------------------------------------------------------- */

let workoutChart = null;
let workoutMode = "sessions"; // sessions | calories | minutes

async function loadWorkoutData(range) {
    const userRef = await getUserRef();
    if (!userRef) return { labels: [], data: [] };

    const snap = await userRef.collection("workouts").get();
    const workouts = snap.docs.map(d => d.data());

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    const extractValue = (w) => {
        if (workoutMode === "sessions") return 1;
        if (workoutMode === "calories") return w.caloriesBurned || 0;
        if (workoutMode === "minutes") return w.durationMinutes || 0;
        return 0;
    };

    if (range === "day") {
        const hours = Array.from({ length: 14 }, (_, i) => i + 7);
        const totals = hours.map(() => 0);

        workouts.forEach(w => {
            const ts = new Date(w.timestamp);
            const date = ts.toISOString().split("T")[0];
            if (date === today) {
                const hour = ts.getHours();
                const index = hours.indexOf(hour);
                if (index !== -1) totals[index] += extractValue(w);
            }
        });

        return {
            labels: hours.map(h => `${h}:00`),
            data: totals
        };
    }

    if (range === "week") {
        const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
        const totals = Array(7).fill(0);

        workouts.forEach(w => {
            const ts = new Date(w.timestamp);
            const day = ts.getDay();
            const index = day === 0 ? 6 : day - 1;
            totals[index] += extractValue(w);
        });

        return { labels, data: totals };
    }

    if (range === "month") {
        const labels = ["Week 1","Week 2","Week 3","Week 4"];
        const totals = [0,0,0,0];

        workouts.forEach(w => {
            const ts = new Date(w.timestamp);
            const week = Math.floor((ts.getDate() - 1) / 7);
            totals[week] += extractValue(w);
        });

        return { labels, data: totals };
    }

    return { labels: [], data: [] };
}

async function renderWorkoutChart(range = "day") {
    const canvas = document.getElementById("stepTracker");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { labels, data } = await loadWorkoutData(range);

    if (workoutChart) workoutChart.destroy();

    workoutChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: workoutMode,
                data,
                backgroundColor: neonGradient(ctx, "rgba(129,140,248,0.95)", "rgba(129,140,248,0.15)"),
                borderColor: "#818cf8",
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            plugins: { legend: { display: false } }
        }
    });
}

window.updateWorkoutChartRange = (range) => renderWorkoutChart(range);

/* -----------------------------------------------------------
   INITIALIZE EVERYTHING
----------------------------------------------------------- */

window.addEventListener("load", () => {
    initNeonInteractions();
    renderIntakeChart("day");
    renderWorkoutChart("day");
});
