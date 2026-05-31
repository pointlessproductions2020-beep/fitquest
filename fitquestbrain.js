/* -----------------------------------------------------------
   FITQUEST BRAIN — MASTER AI-SMART ENGINE
   This file powers:
   - Calorie Brain
   - Trend Engine
   - Tone Engine
   - XP Engine
   - Insights Engine
   - Adaptive Goals
----------------------------------------------------------- */

const FitQuestBrain = {

    /* -----------------------------------------------------------
       1. CALORIE BRAIN
       Calculates BMR, TDEE, calorie targets, predictions
    ----------------------------------------------------------- */

    calculateBMR({ sex, weightKg, heightCm, age }) {
        if (!sex || !weightKg || !heightCm || !age) return null;

        if (sex === "male") {
            return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
        } else {
            return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
        }
    },

    activityMultiplier(level) {
        const map = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9
        };
        return map[level] || 1.2;
    },

    goalAdjustment(goal, pace) {
        const base = {
            lose: -300,
            maintain: 0,
            gain: 300
        }[goal] || 0;

        const paceMod = {
            slow: 0.8,
            medium: 1,
            fast: 1.3
        }[pace] || 1;

        return base * paceMod;
    },

    calculateTargets(profile) {
        const bmr = this.calculateBMR(profile);
        if (!bmr) return null;

        const tdee = bmr * this.activityMultiplier(profile.activityLevel);
        const adjustment = this.goalAdjustment(profile.goal, profile.goalPace);

        const targetCalories = Math.round(tdee + adjustment);

        return {
            bmr,
            tdee,
            targetCalories
        };
    },

    /* -----------------------------------------------------------
       2. TREND ENGINE
       Weight + calorie trends over time
    ----------------------------------------------------------- */

    calculateTrend(values) {
        if (!values || values.length < 2) return "flat";

        const first = values[0];
        const last = values[values.length - 1];

        if (last < first - 0.3) return "down";
        if (last > first + 0.3) return "up";
        return "flat";
    },

    /* -----------------------------------------------------------
       3. TONE ENGINE
       Generates dynamic language based on user data
    ----------------------------------------------------------- */

    toneEngine({ bmi, trend, goal, pace }) {
        let headline = "";
        let subline = "";

        if (trend === "down") {
            headline = "Trend looks solid.";
            subline = "You're moving in the right direction.";
        } else if (trend === "up") {
            headline = "Small bump detected.";
            subline = "Nothing to worry about — stay consistent.";
        } else {
            headline = "Holding steady.";
            subline = "Consistency is your superpower.";
        }

        if (goal === "lose" && pace === "fast") {
            subline = "Aggressive cut — I’ll monitor your recovery.";
        }

        if (bmi > 30) {
            headline = "We’ll take this step by step.";
            subline = "Slow and steady wins this mission.";
        }

        return { headline, subline };
    },

    /* -----------------------------------------------------------
       4. XP ENGINE
       Awards XP for actions, calculates level
    ----------------------------------------------------------- */

    awardXp(userRef, amount, reason = "progress") {
        return userRef.get().then(doc => {
            const xp = (doc.data().xp || 0) + amount;
            const level = Math.floor(xp / 100) + 1;

            return userRef.set({ xp, level }, { merge: true }).then(() => ({
                xp,
                level,
                reason
            }));
        });
    },

    /* -----------------------------------------------------------
       5. INSIGHTS ENGINE
       Generates daily insights based on trends + behaviour
    ----------------------------------------------------------- */

    generateInsights({ weightTrend, calorieTrend, hydration }) {
        const insights = [];

        if (weightTrend === "down") {
            insights.push("Weight trending down — great consistency.");
        } else if (weightTrend === "up") {
            insights.push("Slight weight increase — could be water or food timing.");
        } else {
            insights.push("Weight stable — keep logging accurately.");
        }

        if (calorieTrend === "under") {
            insights.push("You’re consistently under target — deficit is strong.");
        } else if (calorieTrend === "over") {
            insights.push("Calories slightly high — small adjustments will help.");
        }

        if (hydration < 1500) {
            insights.push("Hydration low — aim for 300–500ml more today.");
        }

        return insights;
    },

    /* -----------------------------------------------------------
       6. ADAPTIVE GOALS ENGINE
       Suggests adjustments based on long-term behaviour
    ----------------------------------------------------------- */

    adaptiveGoalCheck({ weightTrend, adherence, targetCalories }) {
        if (weightTrend === "flat" && adherence > 0.8) {
            return {
                suggestion: "Your weight hasn’t moved in 10 days. Want me to tighten your plan?",
                newTarget: targetCalories - 100
            };
        }

        if (weightTrend === "down" && adherence < 0.5) {
            return {
                suggestion: "You’re losing weight despite low adherence. Want me to adjust your target?",
                newTarget: targetCalories + 100
            };
        }

        return null;
    }
};

/* -----------------------------------------------------------
   EXPORT
----------------------------------------------------------- */

window.FitQuestBrain = FitQuestBrain;
