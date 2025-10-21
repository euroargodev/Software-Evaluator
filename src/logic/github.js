// src/logic/github.js
/**
 * Vérifie les principales caractéristiques d'un dépôt GitHub
 * pour déterminer le niveau de maturité du projet.
 *
 * Retourne un objet du type :
 * {
 *   hasReadme: true,
 *   hasLicense: true,
 *   hasContributors: false,
 *   hasContributing: true,
 *   hasCI: false,
 *   hasCodeOfConduct: true,
 *   ...
 * }
 */

import { Octokit } from "octokit";

// Correspondance entre IDs des critères (newGuidelines.json ou miniGuidelines.json)
// et les clés des vérifications automatiques dans checkRepoFeatures()
export const githubCriterionMap = {
  1: "hasReadme",              // README
  2: "hasLicense",             // LICENSE
  3: "hasCI",                  // Continuous integration
  4: "hasContributors",        // Multiple contributors
  5: null,                     // Manual criterion
  6: null,                     // Manual criterion
  7: null,                     // Manual criterion
  8: null                      // Manual criterion
};


export async function checkRepoFeatures(owner, repo, octokit = null) {
  if (!octokit) octokit = new Octokit();
  const results = {};

  try {
    // 8 - Le projet est hébergé sur GitHub → implicite
    results.isOnGitHub = true;

    // 29 - Contrôle de version → implicite (GitHub)
    results.hasVersionControl = true;

    // 11 / 32 - README présent
    try {
      await octokit.rest.repos.getReadme({ owner, repo });
      results.hasReadme = true;
    } catch {
      results.hasReadme = false;
    }

    // 10 / 33 - LICENSE open-source
    try {
      await octokit.rest.licenses.getForRepo({ owner, repo });
      results.hasLicense = true;
    } catch {
      results.hasLicense = false;
    }

    // 34 / 35 - Plusieurs collaborateurs
    try {
      const contributors = await octokit.rest.repos.listContributors({ owner, repo });
      results.hasContributors = contributors.data.length > 1;
      results.hasIdentifiedContributors = contributors.data.every(c => !!c.login);
    } catch {
      results.hasContributors = false;
      results.hasIdentifiedContributors = false;
    }

    // 37 / 46 - CONTRIBUTING file
    try {
      await octokit.rest.repos.getContent({ owner, repo, path: "CONTRIBUTING.md" });
      results.hasContributing = true;
    } catch {
      results.hasContributing = false;
    }

    // 38 - Issues activées
    try {
      const repoInfo = await octokit.rest.repos.get({ owner, repo });
      results.hasIssuesEnabled = !!repoInfo.data.has_issues;
    } catch {
      results.hasIssuesEnabled = false;
    }

    // 39 - Labels dans les issues
    try {
      const labels = await octokit.rest.issues.listLabelsForRepo({ owner, repo });
      results.hasIssueLabels = labels.data && labels.data.length > 0;
    } catch {
      results.hasIssueLabels = false;
    }

    // 41 - Pull requests existantes
    try {
      const pulls = await octokit.rest.pulls.list({ owner, repo, state: "all" });
      results.hasPullRequests = pulls.data.length > 0;
    } catch {
      results.hasPullRequests = false;
    }

    // 42 - Reviews sur les PR
    try {
      const pulls = await octokit.rest.pulls.list({ owner, repo, state: "all" });
      const hasReviews = await Promise.all(
        pulls.data.slice(0, 5).map(async (pr) => {
          const reviews = await octokit.rest.pulls.listReviews({
            owner,
            repo,
            pull_number: pr.number,
          });
          return reviews.data.length > 0;
        })
      );
      results.hasReviewedPR = hasReviews.some(Boolean);
    } catch {
      results.hasReviewedPR = false;
    }

    // 49 / 50 - CHANGELOG ou releases
    try {
      await octokit.rest.repos.getContent({ owner, repo, path: "CHANGELOG.md" });
      results.hasChangelog = true;
    } catch {
      results.hasChangelog = false;
    }

    try {
      const releases = await octokit.rest.repos.listReleases({ owner, repo });
      results.hasReleases = releases.data.length > 0;
    } catch {
      results.hasReleases = false;
    }

    // 55 - CITATION.cff
    try {
      await octokit.rest.repos.getContent({ owner, repo, path: "CITATION.cff" });
      results.hasCitationFile = true;
    } catch {
      results.hasCitationFile = false;
    }

    // 59 - CODE_OF_CONDUCT
    try {
      await octokit.rest.repos.getContent({ owner, repo, path: "CODE_OF_CONDUCT.md" });
      results.hasCodeOfConduct = true;
    } catch {
      results.hasCodeOfConduct = false;
    }

    // 15 / 17 - CI/CD : présence de .github/workflows
    try {
      const workflows = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: ".github/workflows",
      });
      results.hasCI = workflows.data && workflows.data.length > 0;
      results.hasCD = results.hasCI; // même vérification pour le moment
    } catch {
      results.hasCI = false;
      results.hasCD = false;
    }
  } catch (err) {
    console.error("GitHub API error:", err);
  }

  return results;
}


/*export const githubCriterionMap = {
  8: "isOnGitHub",
  10: "hasLicense",
  11: "hasReadme",
  29: "hasVersionControl",
  34: "hasContributors",
  35: "hasContributors",
  36: "hasIdentifiedContributors",
  37: "hasContributing",
  38: "hasIssuesEnabled",
  39: "hasIssueLabels",
  41: "hasPullRequests",
  42: "hasReviewedPR",
  49: "hasChangelog",
  50: "hasReleases",
  55: "hasCitationFile",
  59: "hasCodeOfConduct",
  15: "hasCI",
  17: "hasCD"
};*/