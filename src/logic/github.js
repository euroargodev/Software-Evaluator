// src/logic/github.js
import * as tests from "./githubTests.js";
import { getGitHubClient } from "./githubClient.js";

/**
 * MAP: Criterion ID → Test Function
 * Contains ALL auto-checkable criteria
 */
export const githubCriterionMap = {
  // ==================== LANGUAGE & LICENSE ====================
  4: tests.checkOpenSourceLanguage,
  5: tests.checkLanguageAdoptedByArgo,
  10: tests.checkHasLicense,

  // ==================== VERSION CONTROL ====================
  8: tests.checkVersionControl,
  31: tests.checkHasGitignore,

  // ==================== DOCUMENTATION FILES ====================
  9: tests.checkDependenciesFile,
  11: tests.checkReadmeExists,
  26: tests.checkEnglishLanguage,
  33: tests.checkGitHubDescription,
  37: tests.checkRepoURLInCode,
  38: tests.checkCitationFile,
  41: tests.checkContributingFile,

  // ==================== CODE QUALITY ====================
  7: tests.checkCodeFormatting,

  // ==================== TESTING ====================
  46: tests.checkHasTests,

  // ==================== REPOSITORY SETTINGS ====================
  29: tests.checkGitHubTopics,
  32: tests.checkProtectedBranch,

  // ==================== RELEASES ====================
  49: tests.checkHasReleases,

  // ==================== ARGO COMPLIANCE ====================
  30: tests.checkUsesGDACServers,
  60: tests.checkGDACFolderStructure,
  61: tests.checkOfficialArgoSources,
};

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

  // Short-circuit if nothing to test
  if (autoCriteria.length === 0) {
    console.log(`⚠️ No auto criteria to test for this level`);
    return results;
  }

  const octokit = getGitHubClient();

  // Validate repository exists when a token is available
  if (octokit) {
    try {
      await octokit.rest.repos.get({ owner, repo });
      console.log(`✅ Repository ${owner}/${repo} accessible`);
    } catch (error) {
      console.error(`❌ Repository ${owner}/${repo} not found:`, error.message);
      
      // Mark all requested criteria as unmet if repo cannot be fetched
      return Object.fromEntries(
        autoCriteria.map(criterion => [
          criterion.id,
          { 
            status: "unmet", 
            error: "Repository not found or inaccessible" 
          }
        ])
      );
    }
  }

  // Keep only criteria backed by a test function
  const testsToRun = autoCriteria.filter(criterion => {
    const hasTest = criterion.id in githubCriterionMap;
    
    if (!hasTest) {
      console.warn(`⚠️ No test function for criterion #${criterion.id}: ${criterion.title}`);
      results[criterion.id] = {
        status: "unmet",
        error: "Test function not implemented"
      };
    }
    
    return hasTest;
  });

  const totalTests = testsToRun.length;
  let completed = 0;

  console.log(`🚀 Running ${totalTests} automatic checks in parallel...`);

  // Execute tests in parallel
  const promises = testsToRun.map(async (criterion) => {
    const id = criterion.id;
    const testFn = githubCriterionMap[id];

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

      return [id, { 
        status: "unmet", 
        error: error.message 
      }];
    }
  });

  // Wait for all tests
  const settledResults = await Promise.allSettled(promises);

  // Build result object from fulfilled promises
  const testResults = Object.fromEntries(
    settledResults
      .filter(r => r.status === "fulfilled")
      .map(r => r.value)
  );

  // Merge with any placeholder results (criteria without tests)
  Object.assign(results, testResults);

  // Final stats
  const metCount = Object.values(results).filter(r => r.status === "met").length;
  const unmetCount = Object.values(results).filter(r => r.status === "unmet").length;

  console.log(`\n✅ ========== AUTO TESTS COMPLETE ==========`);
  console.log(`📊 Results: ${metCount}/${totalTests} met, ${unmetCount}/${totalTests} unmet`);
  console.log(`📈 Success rate: ${Math.round(metCount/totalTests*100)}%\n`);

  return results;
}

/**
 * Get list of ALL auto-checkable criterion IDs
 */
export function getAutoCheckableCriteria() {
  return Object.keys(githubCriterionMap).map(Number);
}

/**
 * Check if a criterion is auto-checkable
 */
export function isAutoCheckable(criterionId) {
  return criterionId in githubCriterionMap;
}
