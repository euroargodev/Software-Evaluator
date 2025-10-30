// src/logic/github.js
import * as tests from "./githubTests.js";

export const githubCriterionMap = {
  // ==================== DATA & IDENTIFIERS ====================
  0: tests.checkDataDOIinReadme,              // Data with DOI
  1: tests.checkArgoPapersInMetadata,         // Argo papers referenced
  19: tests.checkDOIinReadme,                 // Software DOI
  21: tests.checkArgoDataDOI,                 // Argo Data DOI
  22: tests.checkDataAccessibility,           // Data accessible online
  51: tests.checkPersistentIdentifiers,       // All identifiers listed
  52: tests.checkPackageRegistry,             // Registered in registry
  53: tests.checkArgoRegistry,                // Registered in Argo registry

  // ==================== LANGUAGE & LICENSE ====================
  4: tests.checkOpenSourceLanguage,           // Open-source language
  5: tests.checkLanguageAdoptedByArgo,        // Argo-adopted language
  10: tests.checkHasLicense,                  // Has license
  33: tests.checkLicenseFile,                 // LICENSE file exists
  54: tests.checkArgoLicenseCompliance,       // Preserves CC BY 4.0

  // ==================== HOSTING & VERSION CONTROL ====================
  8: tests.checkArgoHosting,                  // Hosted on platform
  29: tests.checkGitUsed,                     // Uses Git
  31: tests.checkArgoOrgHosting,              // Hosted in Argo org

  // ==================== DOCUMENTATION ====================
  3: tests.checkUsageGuidelines,              // Usage examples
  9: tests.checkDependenciesFile,             // Dependencies listed
  11: tests.checkReadmeExists,                // README exists
  12: tests.checkAPIReference,                // API reference
  13: tests.checkDocsHosted,                  // Docs hosted online
  14: tests.checkInstallationInstructions,    // Installation guide
  26: tests.checkEnglishLanguage,             // English documentation
  32: tests.checkReadmeQuality,               // README quality
  47: tests.checkSupportedOS,                 // OS support listed
  48: tests.checkExecutionEnvironment,        // Execution env documented

  // ==================== CODE QUALITY ====================
  6: tests.checkDocstrings,                   // Has docstrings
  7: tests.checkCodeFormatting,               // Code formatted
  56: tests.checkModularDesign,               // Modular components
  57: tests.checkConsistentStyle,             // Consistent style
  58: tests.checkModuleDocumentation,         // Modules documented

  // ==================== CI/CD & TESTING ====================
  15: tests.checkCI,                          // Has CI
  16: tests.checkMultiPlatformTests,          // Multi-platform tests
  17: tests.checkCD,                          // Has CD

  // ==================== DISTRIBUTION ====================
  18: tests.checkPackageRegistry,             // Distributed via pip/conda

  // ==================== ARGO COMPLIANCE ====================
  23: tests.checkArgoFileFormats,             // Argo NetCDF formats
  24: tests.checkArgoMetadataConventions,     // Argo metadata conventions
  25: tests.checkNVSVocabulary,               // Uses NVS vocabulary
  30: tests.checkGDACAccess,                  // Data from GDAC
  60: tests.checkGDACStructure,               // GDAC folder structure
  61: tests.checkArgoMetadataSources,         // Argo metadata sources

  // ==================== COLLABORATION ====================
  34: tests.checkContributorsExternal,        // External contributors
  35: tests.checkContributorsArgo,            // Argo contributors
  36: tests.checkIdentifiedContributors,      // Identified contributors
  37: tests.checkContributingFile,            // CONTRIBUTING file
  46: tests.checkContributingFile,            // CONTRIBUTING file (duplicate)

  // ==================== ISSUE MANAGEMENT ====================
  38: tests.checkIssuesEnabled,               // Issues enabled
  39: tests.checkIssueLabels,                 // Issues have labels
  40: tests.checkArgoMissionLabels,           // Argo mission labels
  62: tests.checkIssueTemplates,              // Issue templates

  // ==================== PULL REQUESTS ====================
  41: tests.checkPRsExist,                    // PRs exist
  42: tests.checkPRsReviewed,                 // PRs reviewed

  // ==================== RELEASES & CITATIONS ====================
  49: tests.checkChangeLog,                   // CHANGELOG
  50: tests.checkReleases,                    // GitHub releases
  55: tests.checkCITATIONcff,                 // CITATION.cff
  
  // ==================== COMMUNITY ====================
  20: tests.checkPublishedPaper,              // Published paper
  59: tests.checkCodeOfConduct,               // CODE_OF_CONDUCT
};

/**
 * Run all mapped automatic tests in PARALLEL
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
        onProgress(completed, totalTests, `Testing criterion #${id}...`);
      }
      return [id, result];
    } catch (error) {
      console.error(`❌ Test ${id} failed:`, error.message);
      completed++;
      if (onProgress) {
        onProgress(completed, totalTests, `Test #${id} failed`);
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
