/**
 * checkRepoFeatures
 * Uses the GitHub API (via Octokit) to check if a repository
 * contains some key elements that indicate project maturity.
 *
 * Returns a set of boolean flags like:
 *   { hasReadme: true, hasLicense: false, ... }
 */

export async function checkRepoFeatures(owner, repo, octokit) {
  const results = {};

  try {
    // Run several GitHub API requests in parallel
    const [hasReadme, hasLicense, hasReleases, hasContributors] = await Promise.all([
      // Check if README exists
      octokit.rest.repos.getReadme({ owner, repo })
        .then(() => true)
        .catch(() => false),

      // Check if license file exists
      octokit.rest.licenses.getForRepo({ owner, repo })
        .then(() => true)
        .catch(() => false),

      // Check if repository has published releases
      octokit.rest.repos.listReleases({ owner, repo })
        .then(r => r.data.length > 0)
        .catch(() => false),

      // Check if repository has contributors
      octokit.rest.repos.listContributors({ owner, repo })
        .then(r => r.data.length > 0)
        .catch(() => false),
    ]);

    // Save results in an object
    results.hasReadme = hasReadme;
    results.hasLicense = hasLicense;
    results.hasReleases = hasReleases;
    results.hasContributors = hasContributors;
  } catch (err) {
    console.error("GitHub API error:", err);
  }

  return results;
}
