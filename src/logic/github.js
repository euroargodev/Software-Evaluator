// src/logic/github.js
import { checkReadme, checkLicense, checkContributors, checkCI } from "./githubTests.js";

export const githubCriterionMap = {
  1: checkReadme,
  2: checkLicense,
  3: checkCI,
  4: checkContributors,
};

export async function checkRepoFeatures(owner, repo) {
  const results = {};
  for (const [id, testFn] of Object.entries(githubCriterionMap)) {
    if (typeof testFn === "function") {
      results[id] = await testFn(owner, repo);
    } else {
      results[id] = null; // si c’est un critère manuel
    }
  }
  return results;
}
