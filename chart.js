// GLOBAL NEON THEME FOR CHART.JS
Chart.defaults.color = "#cbd5e1"; // light grey labels
Chart.defaults.font.family = "Inter, sans-serif";

Chart.defaults.borderColor = "rgba(148,163,184,0.15)";
Chart.defaults.backgroundColor = "rgba(255,255,255,0.03)";

Chart.defaults.plugins.legend.labels.color = "#e2e8f0";

// GRIDLINES
Chart.defaults.scale.grid.color = "rgba(148,163,184,0.12)";
Chart.defaults.scale.grid.borderColor = "rgba(148,163,184,0.25)";

// TICKS
Chart.defaults.scale.ticks.color = "#94a3b8";

// LINE CHART GLOW SHADOW
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
