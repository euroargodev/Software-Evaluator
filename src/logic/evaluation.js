// src/logic/evaluation.js
// Handles evaluation of repositories based on guidelines.json

import guidelines from "../data/guidelines.json";

/**
 * Evaluate a repository and assign badge + suggestions
 * @param {object} repoData - output of fetchRepoData
 * @returns {object} - { badge: "Bronze|Silver|Gold", suggestions: "..." }
 */
export function evaluateRepo(repoData) {
  let score = 0;
  const suggestions = [];

  // Loop through all guidelines
  guidelines.forEach(criterion => {
    // Here you will check if criterion is satisfied in repoData
    // e.g., if README exists, license exists, files present etc.
    const satisfied = /* your logic here */ false;

    if (satisfied) {
      score += 1; // simple scoring for now
    } else {
      suggestions.push(`Missing: ${criterion.title}`);
    }
  });

  // Determine badge based on score
  const badge =
    score >= 8 ? "Gold" :
    score >= 5 ? "Silver" :
    "Bronze";

  return { badge, suggestions: suggestions.join("\n") };
}
