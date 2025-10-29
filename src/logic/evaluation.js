// src/logic/evaluation.js

export async function evaluateProject(guidelines, owner, repo, userAnswers = {}, onProgress = null) {
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
      result = { status: "unmet", error: err.message };
    }

    const levelWeight = levelWeights[c.level] || 1;
    totalWeight += levelWeight;
    if (result.status === "met") weightedScore += levelWeight;

    results[c.id] = {
      title: c.title,
      level: c.level,
      category: c.category,
      status: result.status,
      weight: levelWeight,
      ...(result.error && { error: result.error })
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

  console.log(`✅ Weighted score: ${weightedScore} / total: ${totalWeight}`);
  console.log(`🎯 Global Score: ${(globalScore * 100).toFixed(1)}% → ${validatedLevel}`);

  // Generate intelligent feedback
  const feedback = generateFeedback(results, guidelines, validatedLevel);

  return { 
    validatedLevel, 
    globalScore, 
    details: results,
    feedback,
    stats: {
      totalCriteria: guidelines.length,
      metCriteria: Object.values(results).filter(r => r.status === "met").length,
      unmetCriteria: Object.values(results).filter(r => r.status === "unmet").length,
      weightedScore,
      totalWeight
    }
  };
}

/**
 * Generate intelligent feedback based on unmet criteria
 */
function generateFeedback(results, guidelines, currentLevel) {
  const feedback = [];
  const levelOrder = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
  const currentLevelIndex = levelOrder.indexOf(currentLevel);
  
  // Group unmet criteria by category
  const unmetByCategory = {};
  
  for (const [id, result] of Object.entries(results)) {
    if (result.status === "unmet") {
      const criterion = guidelines.find(g => g.id === parseInt(id));
      if (!criterion) continue;
      
      const cat = criterion.category || "General";
      if (!unmetByCategory[cat]) {
        unmetByCategory[cat] = [];
      }
      
      const levelIndex = levelOrder.indexOf(criterion.level);
      unmetByCategory[cat].push({
        id: criterion.id,
        title: criterion.title,
        level: criterion.level,
        priority: levelIndex,
        isBlocker: levelIndex <= currentLevelIndex + 1 // Criteria for current or next level
      });
    }
  }
  
  // Sort categories by number of blockers
  const sortedCategories = Object.entries(unmetByCategory).sort((a, b) => {
    const blockersA = a[1].filter(item => item.isBlocker).length;
    const blockersB = b[1].filter(item => item.isBlocker).length;
    return blockersB - blockersA;
  });
  
  // Generate feedback for each category
  for (const [category, items] of sortedCategories) {
    const blockers = items.filter(item => item.isBlocker);
    const future = items.filter(item => !item.isBlocker);
    
    if (blockers.length === 0 && future.length === 0) continue;
    
    const sortedItems = [...blockers, ...future].sort((a, b) => a.priority - b.priority);
    
    let message;
    if (blockers.length > 0) {
      message = `🚨 Critical: Improve your ${category} practices to reach the next level`;
    } else {
      message = `💡 Future improvement: Enhance your ${category} for higher levels`;
    }
    
    feedback.push({
      category,
      priority: blockers.length > 0 ? "high" : "low",
      message,
      missing: sortedItems.map(item => ({
        id: item.id,
        level: item.level,
        title: item.title,
        isBlocker: item.isBlocker
      }))
    });
  }
  
  // Add positive feedback if score is high
  if (currentLevel === "Expert" || currentLevel === "Advanced") {
    feedback.unshift({
      category: "Overall",
      priority: "info",
      message: `🎉 Excellent work! Your project follows most best practices.`,
      missing: []
    });
  }
  
  return feedback;
}

/**
 * Check manual criterion based on user answers
 */
export function checkManualCriterion(criterion, userAnswers) {
  const answer = userAnswers[criterion.id];
  
  if (!answer) {
    return { status: "unmet" };
  }
  
  // If met, evidence is required
  if (answer.status === "met" && !answer.evidence) {
    return { status: "unmet", error: "Evidence required" };
  }
  
  return {
    status: answer.status,
    evidence: answer.evidence
  };
}
