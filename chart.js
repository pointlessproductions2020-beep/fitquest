/* -----------------------------------------------------------
   GLOBAL NEON THEME FOR CHART.JS
----------------------------------------------------------- */

Chart.defaults.color = "#cbd5e1";
Chart.defaults.font.family = "Inter, sans-serif";

Chart.defaults.borderColor = "rgba(148,163,184,0.15)";
Chart.defaults.backgroundColor = "rgba(255,255,255,0.03)";

Chart.defaults.plugins.legend.labels.color = "#e2e8f0";

// GRIDLINES
Chart.defaults.scale.grid.color = "rgba(148,163,184,0.12)";
Chart.defaults.scale.grid.borderColor = "rgba(148,163,184,0.25)";

// TICKS
Chart.defaults.scale.ticks.color = "#94a3b8";

// NEON GLOW PLUGIN
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


/* -----------------------------------------------------------
   MAIN DASHBOARD CHARTS (Workout Ring, Weight Trend, Steps)
----------------------------------------------------------- */

window.addEventListener("load", () => {

    /* -------------------------
       WORKOUT RING (DOUGHNUT)
    ------------------------- */
    const ring = document.getElementById("workoutRing");
    if (ring) {
        new Chart(ring, {
            type: "doughnut",
            data: {
                datasets: [{
                    data: [75, 25],
                    backgroundColor: [
                        "rgba(56,189,248,1)",
                        "rgba(30,41,59,0.4)"
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


    /* -------------------------
       WEIGHT TREND (LINE)
    ------------------------- */
    const weight = document.getElementById("weightTrend");
    if (weight) {
        const ctx = weight.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, "rgba(56,189,248,0.35)");
        gradient.addColorStop(1, "rgba(56,189,248,0)");

        new Chart(weight, {
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
                    backgroundColor: gradient,
                    tension: 0.35
                }]
            },
            options: {
                plugins: { legend: { display: false } }
            }
        });
    }


    /* -------------------------
       STEP TRACKER (BAR)
    ------------------------- */
    const steps = document.getElementById("stepTracker");
    if (steps) {
        new Chart(steps, {
            type: "bar",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Steps",
                    data: [7450, 8200, 9100, 10000, 6800, 12000, 9500],
                    backgroundColor: "rgba(129,140,248,0.9)",
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

    /* -------------------------
       CALORIES WEEKLY (LINE)
    ------------------------- */
    const calW = document.getElementById("chartCaloriesWeekly");
    if (calW) {
        new Chart(calW, {
            type: "line",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Calories",
                    data: [1800, 1750, 1900, 2000, 1850, 1700, 2100],
                    borderColor: "#4da3ff",
                    backgroundColor: "rgba(77,163,255,0.2)",
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }


    /* -------------------------
       CALORIES MONTHLY (BAR)
    ------------------------- */
    const calM = document.getElementById("chartCaloriesMonthly");
    if (calM) {
        new Chart(calM, {
            type: "bar",
            data: {
                labels: ["Week 1","Week 2","Week 3","Week 4"],
                datasets: [{
                    label: "Avg Calories",
                    data: [1850, 1900, 1780, 1950],
                    backgroundColor: "rgba(77,163,255,0.6)"
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }


    /* -------------------------
       BURN WEEKLY (LINE)
    ------------------------- */
    const burnW = document.getElementById("chartBurnWeekly");
    if (burnW) {
        new Chart(burnW, {
            type: "line",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Burned",
                    data: [400, 520, 480, 600, 450, 500, 650],
                    borderColor: "#ff7b54",
                    backgroundColor: "rgba(255,123,84,0.2)",
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }


    /* -------------------------
       BURN MONTHLY (BAR)
    ------------------------- */
    const burnM = document.getElementById("chartBurnMonthly");
    if (burnM) {
        new Chart(burnM, {
            type: "bar",
            data: {
                labels: ["Week 1","Week 2","Week 3","Week 4"],
                datasets: [{
                    label: "Avg Burn",
                    data: [450, 500, 520, 560],
                    backgroundColor: "rgba(255,123,84,0.6)"
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }


    /* -------------------------
       BMI HISTORY (LINE)
    ------------------------- */
    const bmi = document.getElementById("chartBMIHistory");
    if (bmi) {
        new Chart(bmi, {
            type: "line",
            data: {
                labels: ["Jan","Feb","Mar","Apr","May"],
                datasets: [{
                    label: "BMI",
                    data: [24.1, 23.9, 23.7, 23.5, 23.4],
                    borderColor: "#4da3ff",
                    backgroundColor: "rgba(77,163,255,0.2)",
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }


    /* -------------------------
       STEPS WEEKLY (BAR)
    ------------------------- */
    const stepsW = document.getElementById("chartStepsWeekly");
    if (stepsW) {
        new Chart(stepsW, {
            type: "bar",
            data: {
                labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
                datasets: [{
                    label: "Steps",
                    data: [7450, 8200, 9100, 10000, 6800, 12000, 9500],
                    backgroundColor: "rgba(76, 201, 91, 0.7)",
                    borderRadius: 6
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }


    /* -------------------------
       STEPS MONTHLY (LINE)
    ------------------------- */
    const stepsM = document.getElementById("chartStepsMonthly");
    if (stepsM) {
        new Chart(stepsM, {
            type: "line",
            data: {
                labels: ["Week 1","Week 2","Week 3","Week 4"],
                datasets: [{
                    label: "Avg Steps",
                    data: [8500, 9200, 9800, 10200],
                    borderColor: "#4cc95b",
                    backgroundColor: "rgba(76,201,91,0.2)",
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

});
