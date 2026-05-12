import { getGitHubClient } from "./githubClient.js";
import * as tests from "./githubTests.js";

function resolveTestFunction(testFunction) {
  if (typeof testFunction === "function") return testFunction;
  if (typeof testFunction === "string" && tests[testFunction]) {
    return tests[testFunction];
  }
  return null;
}

/**
 * Run ONLY the specified automatic tests in PARALLEL
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array} autoCriteria - Auto criteria to test (filtered by level)
 * @param {Function} onProgress - Optional progress callback (completed, total, message)
 * @returns {Object} Results keyed by criterion ID
 */
export async function checkRepoFeatures(owner, repo, autoCriteria = [], onProgress = null) {
  console.log(`\n🤖 ========== AUTO TESTS START ==========`);
  console.log(`📦 Repository: ${owner}/${repo}`);
  console.log(`🧪 Auto criteria to test: ${autoCriteria.length}`);

  const results = {};

  if (autoCriteria.length === 0) {
    console.log(`⚠️ No auto criteria to test for this level`);
    return results;
  }

  const octokit = getGitHubClient();
  if (octokit) {
    try {
      await octokit.rest.repos.get({ owner, repo });
      console.log(`✅ Repository ${owner}/${repo} accessible`);
    } catch (error) {
      console.error(`❌ Repository ${owner}/${repo} not found:`, error.message);
      return Object.fromEntries(
        autoCriteria.map((criterion) => [
          criterion.id,
          {
            status: "unmet",
            error: "Repository not found or inaccessible",
          },
        ])
      );
    }
  }

  const totalTests = autoCriteria.length;
  let completed = 0;

  console.log(`🚀 Running ${totalTests} automatic checks in parallel...`);

  const promises = autoCriteria.map(async (criterion) => {
    const id = criterion.id;
    const testFn = resolveTestFunction(criterion.testFunction);

    if (!testFn) {
      completed++;
      const message = `No valid test function for criterion #${id}`;
      console.warn(`⚠️ ${message}: ${criterion.title}`);
      if (onProgress) {
        onProgress(completed, totalTests, `${criterion.title} (no test function)`);
      }
      return [
        id,
        {
          status: "unmet",
          error: "Test function not implemented",
        },
      ];
    }

    try {
      console.log(`  🔍 Testing #${id}: ${criterion.title} (${criterion.level})`);
      const result = await testFn(owner, repo);
      completed++;
      if (onProgress) {
        onProgress(completed, totalTests, `${criterion.title}`);
      }
      console.log(`  ✅ #${id}: ${result.status}`);
      return [id, result];
    } catch (error) {
      completed++;
      console.error(`  ❌ #${id} failed:`, error.message);
      if (onProgress) {
        onProgress(completed, totalTests, `${criterion.title} (error)`);
      }
      return [
        id,
        {
          status: "unmet",
          error: error.message,
        },
      ];
    }
  });

  const settledResults = await Promise.allSettled(promises);

  const testResults = Object.fromEntries(
    settledResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value)
  );

  Object.assign(results, testResults);

  const metCount = Object.values(results).filter((r) => r.status === "met").length;
  const unmetCount = Object.values(results).filter((r) => r.status === "unmet").length;

  console.log(`\n✅ ========== AUTO TESTS COMPLETE ==========`);
  console.log(`📊 Results: ${metCount}/${totalTests} met, ${unmetCount}/${totalTests} unmet`);
  console.log(`📈 Success rate: ${Math.round((metCount / totalTests) * 100)}%\n`);

  return results;
}