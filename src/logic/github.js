// src/logic/github.js
import * as tests from "./githubTests.js";

/**
 * Mapping between guidelines_v2 numeric IDs and test functions.
 * Add or adjust ids according to your generated guidelines_v2.json
 *
 * Only auto-checkable IDs are listed here. Manual criteria are not mapped.
 */
export const githubCriterionMap = {
  8: tests.checkRepoHosting || (() => ({ status: "met" })), // repo exists -> we'll treat separately if needed
  10: tests.checkLicense,
  11: tests.checkLicense, // license info appears twice in original; map to same test
  15: tests.checkCI,
  16: tests.checkUnitTests,
  17: tests.checkCD,
  18: tests.checkDistribution,
  29: async (o, r) => ({ status: "met" }), // version control: repo is on GitHub -> met by definition
  32: tests.checkReadme,
  33: tests.checkLicense,
  34: tests.checkContributors,
  35: tests.checkContributors,
  36: tests.checkIdentifiedContributors,
  37: tests.checkContributingFile,
  38: tests.checkIssuesEnabled,
  39: tests.checkIssueLabels,
  41: tests.checkPRsExist,
  42: tests.checkPRsReviewed,
  46: tests.checkContributingFile,
  47: tests.checkSupportedOS || (() => ({ status: "unmet" })), // placeholder
  49: tests.checkChangeLog,
  50: tests.checkReleases,
  51: tests.checkReadmeHasIdentifiersOrCitations,
  52: tests.checkDistribution, // heuristic: presence of registry info in files
  53: tests.checkDistribution,
  55: tests.checkCITATIONcff,
  59: tests.checkCodeOfConduct,
  // add more mappings if needed
};

/**
 * Run all mapped automatic tests and return an object of results.
 * Each property key is the numeric criterion id (as string) and the value is { status: 'met'|'unmet' }.
 */
export async function checkRepoFeatures(owner, repo) {
  const results = {};

  // If repo doesn't exist (quick check) return fast unmet set
  const octokit = tests.getGitHubClient ? tests.getGitHubClient() : null;
  // We won't re-check repo existence here (assumes caller already fetched repo), but callers can adapt.

  for (const [id, fn] of Object.entries(githubCriterionMap)) {
    try {
      if (typeof fn === "function") {
        const res = await fn(owner, repo);
        // Ensure normalized shape
        results[id] = { status: res?.status === "met" ? "met" : "unmet" };
      } else {
        results[id] = { status: "unmet" };
      }
    } catch (err) {
      console.error(`Error running githubCriterionMap[${id}]`, err);
      results[id] = { status: "unmet" };
    }
  }
  return results;
}
