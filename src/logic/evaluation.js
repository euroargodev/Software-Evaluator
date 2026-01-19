// src/logic/evaluation.js

// ✅ Import checkRepoFeatures from github.js
import { checkRepoFeatures } from "./github.js";
import { clearCache } from "./githubClient.js";

/**
 * Main evaluation function
 * Combines auto tests + manual answers to compute final score
 */
export async function evaluateProject(
  guidelines,
  owner,
  repo,
  userAnswers = {},
  onProgress = null,
  targetLevel = null
) {
  console.log("\n🚀 ========== EVALUATION START ==========");
  console.log(`📦 Repository: ${owner}/${repo}`);
  console.log(`📊 Total guidelines: ${guidelines.length}`);
  console.log(`📝 User answers provided: ${Object.keys(userAnswers).length}`);
  // Always start with a fresh cache to avoid stale unmet results
  clearCache();

  const levelWeights = {
    Novice: 1,
    Beginner: 1.2,
    Intermediate: 1.5,
    Advanced: 2,
    Expert: 2.5,
  };
  const levelOrder = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
  const effectiveTarget =
    targetLevel && levelOrder.includes(targetLevel) ? targetLevel : null;

  // ========== STEP 1: SPLIT AUTO VS MANUAL ==========
  const autoCriteria = guidelines.filter(c => c.type === "auto");
  const manualCriteria = guidelines.filter(c => c.type === "manual");

  console.log(`\n📋 Criteria breakdown:
    • Auto: ${autoCriteria.length}
    • Manual: ${manualCriteria.length}`);

  const results = {};
  let totalWeight = 0;
  let weightedScore = 0;

  // ========== STEP 2: PROCESS MANUAL CRITERIA ==========
  console.log("\n📝 Processing manual criteria...");
  for (const criterion of manualCriteria) {
    const answer = userAnswers[criterion.id];

    let status = "unmet";
    if (answer && answer.status === "met") {
      status = "met";
    }

    const levelWeight = levelWeights[criterion.level] || 1;
    totalWeight += levelWeight;
    if (status === "met") weightedScore += levelWeight;

    results[criterion.id] = {
      title: criterion.title,
      level: criterion.level,
      category: criterion.category,
      group: criterion.group,
      status: status,
      weight: levelWeight,
      type: "manual",
      evidence: answer?.evidence || null
    };

    console.log(`  ✅ Manual #${criterion.id} [${criterion.title}]: ${status} (weight: ${levelWeight})`);
  }

  // ========== STEP 3: RUN AUTO TESTS ==========
  console.log(`\n🤖 Running ${autoCriteria.length} automatic tests...`);

  if (onProgress) {
    onProgress(0, autoCriteria.length, "Starting automatic tests...");
  }

  // Call checkRepoFeatures with filtered auto criteria
  const autoResults = await checkRepoFeatures(owner, repo, autoCriteria, onProgress);

  console.log(`\n✅ Automatic tests completed. Results:`, autoResults);

  // ========== STEP 4: MERGE AUTO RESULTS ==========
  for (const criterion of autoCriteria) {
    const autoResult = autoResults[criterion.id];

    let status = "unmet";
    let error = null;

    if (autoResult) {
      status = autoResult.status || "unmet";
      error = autoResult.error || null;
    }

    const levelWeight = levelWeights[criterion.level] || 1;
    totalWeight += levelWeight;
    if (status === "met") weightedScore += levelWeight;

    results[criterion.id] = {
      title: criterion.title,
      level: criterion.level,
      category: criterion.category,
      group: criterion.group,
      status: status,
      weight: levelWeight,
      type: "auto",
      evidence: autoResult?.evidence || null,
      ...(error && { error })
    };

    console.log(`  🤖 Auto #${criterion.id} [${criterion.title}]: ${status} (weight: ${levelWeight})`);
  }

  // ========== CALCULATE FINAL SCORE ==========
  const globalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Raw level derived from score only
  const scoreLevel = (() => {
    if (globalScore > 0.9) return "Expert";
    if (globalScore > 0.75) return "Advanced";
    if (globalScore > 0.6) return "Intermediate";
    if (globalScore > 0.4) return "Beginner";
    return "Novice";
  })();

  // Completed level based on fully met criteria up to each level
  const completedLevel = (() => {
    let achieved = null;
    for (const level of levelOrder) {
      const levelIndex = levelOrder.indexOf(level);
      const required = guidelines.filter(
        (criterion) => levelOrder.indexOf(criterion.level) <= levelIndex
      );
      const allMet = required.every(
        (criterion) => results[criterion.id]?.status === "met"
      );
      if (allMet) {
        achieved = level;
      } else {
        break;
      }
    }
    return achieved;
  })();
  const achievedLevel = completedLevel || levelOrder[0];
  const achievedComplete = Boolean(completedLevel);

  // Cap the displayed level to the target if provided
  let validatedLevel = scoreLevel;
  if (effectiveTarget) {
    const scoreIdx = levelOrder.indexOf(scoreLevel);
    const targetIdx = levelOrder.indexOf(effectiveTarget);
    validatedLevel = levelOrder[Math.min(scoreIdx, targetIdx)];
  }

  console.log(`\n📊 ========== FINAL SCORE ==========`);
  console.log(`  • Weighted score: ${weightedScore.toFixed(2)}`);
  console.log(`  • Total weight: ${totalWeight.toFixed(2)}`);
  console.log(`  • Global score: ${(globalScore * 100).toFixed(1)}%`);
  console.log(`  • Score level: ${scoreLevel}`);
  if (effectiveTarget) {
    console.log(`  • Target level: ${effectiveTarget}`);
  }
  console.log(`  • Validated level (capped by target): ${validatedLevel}`);
  console.log(`=====================================\n`);

  const feedback = generateFeedback(results, guidelines, validatedLevel);

  return {
    validatedLevel,
    achievedLevel,
    achievedComplete,
    scoreLevel,
    globalScore,
    details: results,
    feedback,
    stats: {
      totalCriteria: guidelines.length,
      metCriteria: Object.values(results).filter(r => r.status === "met").length,
      unmetCriteria: Object.values(results).filter(r => r.status === "unmet").length,
      weightedScore,
      totalWeight,
      autoCriteria: autoCriteria.length,
      manualCriteria: manualCriteria.length,
      targetLevel: effectiveTarget
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
        isBlocker: levelIndex <= currentLevelIndex + 1
      });
    }
  }

  const sortedCategories = Object.entries(unmetByCategory).sort((a, b) => {
    const blockersA = a[1].filter(item => item.isBlocker).length;
    const blockersB = b[1].filter(item => item.isBlocker).length;
    return blockersB - blockersA;
  });

  for (const [category, items] of sortedCategories) {
    const blockers = items.filter(item => item.isBlocker);
    const future = items.filter(item => !item.isBlocker);

    if (blockers.length === 0 && future.length === 0) continue;

    const sortedItems = [...blockers, ...future].sort((a, b) => a.priority - b.priority);

    let message;
    if (blockers.length > 0) {
      message = `Critical: Improve your ${category} practices to reach the next level`;
    } else {
      message = `Future improvement: Enhance your ${category} for higher levels`;
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
