// src/logic/evaluation.js

export async function evaluateProject(guidelines, owner, repo, userAnswers = {}) {
  const levelWeights = {
    Novice: 1,
    Beginner: 1.2,
    Intermediate: 1.5,
    Advanced: 2,
    Expert: 2.5,
  };

  const results = {};
  let totalWeight = 0;
  let weightedScore = 0;

  for (const c of guidelines) {
    let result;

    try {
      if (c.type === "auto" && typeof c.function === "function") {
        // critère automatique
        result = await c.function(owner, repo);
      } else if (c.type === "manual") {
        // critère manuel
        result = c.function
          ? c.function(c, userAnswers)
          : { status: userAnswers[c.id]?.status || "unmet" };
      } else {
        result = { status: "unmet" };
      }
    } catch (err) {
      console.error(`Error evaluating criterion ${c.id}:`, err);
      result = { status: "unmet" };
    }

    const levelWeight = levelWeights[c.level] || 1;
    totalWeight += levelWeight;
    if (result.status === "met") weightedScore += levelWeight;

    results[c.id] = {
      title: c.title,
      level: c.level,
      status: result.status,
      weight: c.weight || 1,
    };

    console.log(
      `Criterion ${c.id} [${c.title}] (${c.type}) => ${result.status} (weight ${levelWeight})`
    );
  }

  const globalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  let validatedLevel;
  if (globalScore > 0.9) validatedLevel = "Expert";
  else if (globalScore > 0.75) validatedLevel = "Advanced";
  else if (globalScore > 0.6) validatedLevel = "Intermediate";
  else if (globalScore > 0.4) validatedLevel = "Beginner";
  else validatedLevel = "Novice";

  console.log(`✅ Weighted score: ${weightedScore}  / total: ${totalWeight}`);
  console.log(`🎯 Global Score: ${globalScore} → ${validatedLevel}`);

  return { validatedLevel, globalScore, details: results };
}
