/* -----------------------------------------------------------
   GLOBAL NEON THEME FOR CHART.JS
----------------------------------------------------------- */

Chart.defaults.color = "#cbd5e1";
Chart.defaults.font.family = "Inter, sans-serif";

Chart.defaults.borderColor = "rgba(148,163,184,0.25)";
Chart.defaults.plugins.legend.labels.color = "#e2e8f0";

Chart.defaults.scale.grid.color = "rgba(56,189,248,0.18)";
Chart.defaults.scale.grid.borderColor = "rgba(56,189,248,0.4)";
Chart.defaults.scale.ticks.color = "#38bdf8";
Chart.defaults.scale.ticks.font = {
    size: 11,
    weight: "500"
};

// Neon glow plugin
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

// Helper for gradients
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
}, 9000); // slow & elegant

/* -----------------------------------------------------------
   MAIN DASHBOARD CHARTS
----------------------------------------------------------- */

window.addEventListener("load", () => {

    /* WORKOUT RING */
    const ringCanvas = document.getElementById("workoutRing");
    if (ringCanvas) {
        new Chart(ringCanvas, {
            type: "doughnut",
            data: {
                datasets: [{
                    data: [75, 25],
                    backgroundColor: [
                        "rgba(56,189,248,1)",
                        "rgba(15,23,42,0.6)"
                    ],
                    borderWidth: 0,
                    cutout: "70%"
                }]
            },
            options: {
                plugins: { legend: { display: false } }
            }
        });
    }

    /* WEIGHT TREND */
    const weightCanvas = document.getElementById("weightTrend");
    if (weightCanvas) {
        const ctx = weightCanvas.getContext("2d");
        const fillGrad = neonGradient(ctx, "rgba(56,189,248,0.4)", "rgba(56,189,248,0)");
        new Chart(weightCanvas, {
            type: "line",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri"],
                datasets: [{
                    label: "Weight",
                    data: [155, 162, 160, 158, 156],
                    borderColor: "#38bdf8",
                    borderWidth: 3,
                    pointRadius: 4,
                    pointBackgroundColor: "#38bdf8",
                    fill: true,
                    backgroundColor: fillGrad,
                    tension: 0.35
                }]
            },
            options: {
                plugins: { legend: { display: false } }
            }
        });
    }

    /* STEP TRACKER (MAIN CARD) */
    const stepCanvas = document.getElementById("stepTracker");
    if (stepCanvas) {
        const ctx = stepCanvas.getContext("2d");
        new Chart(stepCanvas, {
            type: "bar",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Steps",
                    data: [7450, 8200, 9100, 10000, 6800, 12000, 9500],
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

    /* -----------------------------------------------------------
       ANALYTICS PANELS (PRO)
    ----------------------------------------------------------- */

    /* CALORIES WEEKLY */
    const calW = document.getElementById("chartCaloriesWeekly");
    if (calW) {
        const ctx = calW.getContext("2d");
        const fill = neonGradient(ctx, "rgba(77,163,255,0.4)", "rgba(77,163,255,0)");
        new Chart(calW, {
            type: "line",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Calories",
                    data: [1800, 1750, 1900, 2000, 1850, 1700, 2100],
                    borderColor: "#4da3ff",
                    backgroundColor: fill,
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: "#4da3ff"
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    /* CALORIES MONTHLY */
    const calM = document.getElementById("chartCaloriesMonthly");
    if (calM) {
        const ctx = calM.getContext("2d");
        new Chart(calM, {
            type: "bar",
            data: {
                labels: ["Week 1","Week 2","Week 3","Week 4"],
                datasets: [{
                    label: "Avg Calories",
                    data: [1850, 1900, 1780, 1950],
                    backgroundColor: neonGradient(ctx, "rgba(77,163,255,0.9)", "rgba(77,163,255,0.15)"),
                    borderColor: "#4da3ff",
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    /* BURN WEEKLY */
    const burnW = document.getElementById("chartBurnWeekly");
    if (burnW) {
        const ctx = burnW.getContext("2d");
        const fill = neonGradient(ctx, "rgba(255,123,84,0.4)", "rgba(255,123,84,0)");
        new Chart(burnW, {
            type: "line",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Burned",
                    data: [400, 520, 480, 600, 450, 500, 650],
                    borderColor: "#ff7b54",
                    backgroundColor: fill,
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: "#ff7b54"
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    /* BURN MONTHLY */
    const burnM = document.getElementById("chartBurnMonthly");
    if (burnM) {
        const ctx = burnM.getContext("2d");
        new Chart(burnM, {
            type: "bar",
            data: {
                labels: ["Week 1","Week 2","Week 3","Week 4"],
                datasets: [{
                    label: "Avg Burn",
                    data: [450, 500, 520, 560],
                    backgroundColor: neonGradient(ctx, "rgba(255,123,84,0.9)", "rgba(255,123,84,0.15)"),
                    borderColor: "#ff7b54",
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    /* BMI HISTORY */
    const bmiCanvas = document.getElementById("chartBMIHistory");
    if (bmiCanvas) {
        const ctx = bmiCanvas.getContext("2d");
        const fill = neonGradient(ctx, "rgba(77,163,255,0.4)", "rgba(77,163,255,0)");
        new Chart(bmiCanvas, {
            type: "line",
            data: {
                labels: ["Jan","Feb","Mar","Apr","May"],
                datasets: [{
                    label: "BMI",
                    data: [24.1, 23.9, 23.7, 23.5, 23.4],
                    borderColor: "#4da3ff",
                    backgroundColor: fill,
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: "#4da3ff"
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    /* STEPS WEEKLY (PANEL) */
    const stepsW = document.getElementById("chartStepsWeekly");
    if (stepsW) {
        const ctx = stepsW.getContext("2d");
        new Chart(stepsW, {
            type: "bar",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Steps",
                    data: [7450, 8200, 9100, 10000, 6800, 12000, 9500],
                    backgroundColor: neonGradient(ctx, "rgba(76,201,91,0.9)", "rgba(76,201,91,0.15)"),
                    borderColor: "#4cc95b",
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    /* STEPS MONTHLY (PANEL) */
    const stepsM = document.getElementById("chartStepsMonthly");
    if (stepsM) {
        const ctx = stepsM.getContext("2d");
        const fill = neonGradient(ctx, "rgba(76,201,91,0.4)", "rgba(76,201,91,0)");
        new Chart(stepsM, {
            type: "line",
            data: {
                labels: ["Week 1","Week 2","Week 3","Week 4"],
                datasets: [{
                    label: "Avg Steps",
                    data: [8500, 9200, 9800, 10200],
                    borderColor: "#4cc95b",
                    backgroundColor: fill,
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: "#4cc95b"
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

});
