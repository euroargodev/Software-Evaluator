/*export function evaluateProject(criteria, autoChecks, manualAnswers) {
  const levelWeights = {
    Novice: 1,
    Beginner: 1.2,
    Intermediate: 1.5,
    Advanced: 2,
    Expert: 2.5
  };

  const results = {};
  let totalWeight = 0;
  let weightedScore = 0;

  for (const c of criteria) {
    const levelWeight = levelWeights[c.level] || 1;
    const isMet =
      c.type === "auto"
        ? autoChecks[c.id]?.status === "met"
        : manualAnswers[c.id]?.status === "met";

    totalWeight += levelWeight;
    if (isMet) weightedScore += levelWeight;

    results[c.id] = { title: c.title, met: isMet, level: c.level };
  }

  const globalScore = weightedScore / totalWeight;

  const validatedLevel =
    globalScore > 0.9 ? "Expert" :
    globalScore > 0.75 ? "Advanced" :
    globalScore > 0.6 ? "Intermediate" :
    globalScore > 0.4 ? "Beginner" : "Novice";

  return {
    validatedLevel,
    globalScore,
    details: results
  };
}
*/


// Mapping entre ids numériques de miniGuidelines et les auto-checks GitHub
const autoCheckMapping = {
  1: "hasReadme",
  2: "hasLicense",
  3: "hasCI",
  4: "hasContributors",
};

const levelWeights = {
  Novice: 1,
  Beginner: 1.2,
  Intermediate: 1.5,
  Advanced: 2,
  Expert: 2.5
};

/**
 * Évalue un projet en fonction des critères (auto + manuel)
 * @param {Array} criteria miniGuidelines ou newGuidelines
 * @param {Object} autoChecks résultat de checkRepoFeatures
 * @param {Object} userAnswers réponses manuelles
 */
export function evaluateProject(criteria, autoChecks = {}, userAnswers = {}) {
  const results = {};
  const levelScoresRaw = {};

  // Initialiser les scores par niveau
  Object.keys(levelWeights).forEach(level => {
    levelScoresRaw[level] = { weight: 0, met: 0 };
  });

  let totalWeight = 0;
  let weightedScore = 0;

  for (const c of criteria) {
    const levelWeight = levelWeights[c.level] || 1;

    let isMet;
    if (c.type === "auto") {
      const autoKey = autoCheckMapping[c.id];
      isMet = autoChecks[autoKey]?.status === "met";
    } else {
      isMet = userAnswers[c.id]?.status === "met";
    }

    results[c.id] = { title: c.title, met: !!isMet, level: c.level };

    // Calcul du score pondéré
    totalWeight += levelWeight;
    if (isMet) weightedScore += levelWeight;

    // Stocker pour levelScores
    levelScoresRaw[c.level].weight += levelWeight;
    if (isMet) levelScoresRaw[c.level].met += levelWeight;
  }

  // Calculer ratio par niveau
  const levelScores = {};
  Object.entries(levelScoresRaw).forEach(([level, score]) => {
    levelScores[level] = {
      ratio: score.weight > 0 ? score.met / score.weight : 0,
      validated: score.weight > 0 ? score.met / score.weight >= 0.75 : false
    };
  });

  const globalScore = weightedScore / totalWeight;

  const validatedLevel =
    globalScore > 0.9 ? "Expert" :
    globalScore > 0.75 ? "Advanced" :
    globalScore > 0.6 ? "Intermediate" :
    globalScore > 0.4 ? "Beginner" : "Novice";

  return {
    validatedLevel,
    globalScore,
    details: results,
    levelScores
  };
}
