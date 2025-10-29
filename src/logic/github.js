// src/logic/github.js

/**
 * Mapping between guidelines_v2 numeric IDs and test functions.
 * Add or adjust ids according to your generated guidelines_v2.json
 *
 * Only auto-checkable IDs are listed here. Manual criteria are not mapped.
 */
import * as tests from "./githubTests.js";

export const githubCriterionMap = {
  // --- Langage et licence ---
  4: tests.checkOpenSourceLanguage,
  5: tests.checkLanguageAdoptedByArgo,
  10: tests.checkLicense,
  33: tests.checkLicense,
  54: tests.checkArgoLicenseCompliance,

  // --- Hébergement / version control ---
  8: tests.checkArgoHosting,
  29: async () => ({ status: "met" }), // Git détecté (toujours met si sur GitHub)
  31: tests.checkArgoHosting,

  // --- Documentation ---
  9: tests.checkDependenciesFile,
  11: tests.checkReadme,
  13: tests.checkDocsHosted,
  32: tests.checkReadme,
  47: tests.checkSupportedOS,

  // --- CI / CD / tests ---
  15: tests.checkCI,
  16: tests.checkUnitTests,
  17: tests.checkCD,

  // --- Distribution / enregistrement ---
  18: tests.checkDistribution,
  19: tests.checkReadmeHasIdentifiersOrCitations,
  51: tests.checkReadmeHasIdentifiersOrCitations,
  52: tests.checkDistribution,
  53: tests.checkDistribution,

  // --- Collaborations / gestion du projet ---
  34: tests.checkContributorsExternal,
  35: tests.checkContributorsArgo,
  36: tests.checkIdentifiedContributors,
  37: tests.checkContributingFile,
  38: tests.checkIssuesEnabled,
  39: tests.checkIssueLabels,
  41: tests.checkPRsExist,
  42: tests.checkPRsReviewed,

  // --- Documentation et releases ---
  49: tests.checkChangeLog,
  50: tests.checkReleases,
  55: tests.checkCITATIONcff,
  59: tests.checkCodeOfConduct,
};

/**
 * Run all mapped automatic tests and return an object of results.
 * Each property key is the numeric criterion id (as string) and the value is { status: 'met'|'unmet' }.
 * Tests are run in PARALLEL for maximum performance.
 */
export async function checkRepoFeatures(owner, repo, onProgress = null) {
  const octokit = tests.getGitHubClient ? tests.getGitHubClient() : null;

  // Quick check if repo exists
  if (octokit) {
    try {
      await octokit.rest.repos.get({ owner, repo });
      console.log(`✅ Repository ${owner}/${repo} found`);
    } catch (error) {
      console.error(`❌ Repository ${owner}/${repo} not found or inaccessible`);
      // Return all tests as unmet
      return Object.fromEntries(
        Object.keys(githubCriterionMap).map(id => [id, { status: "unmet", error: "Repository not found" }])
      );
    }
  }

  // Run all tests in parallel
  const entries = Object.entries(githubCriterionMap);
  const totalTests = entries.length;
  let completed = 0;

  const promises = entries.map(async ([id, testFn]) => {
    try {
      const result = await testFn(owner, repo);
      completed++;
      if (onProgress) {
        onProgress(completed, totalTests);
      }
      return [id, result];
    } catch (error) {
      console.error(`❌ Test ${id} failed:`, error.message);
      completed++;
      if (onProgress) {
        onProgress(completed, totalTests);
      }
      return [id, { status: "unmet", error: error.message }];
    }
  });

  const results = await Promise.allSettled(promises);

  return Object.fromEntries(
    results
      .filter(r => r.status === "fulfilled")
      .map(r => r.value)
  );
}
