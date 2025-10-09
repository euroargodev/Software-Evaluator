// utils/github.js
export async function checkRepoFeatures(owner, repo, octokit) {
  const results = {};

  try {
    // Vérifie quelques éléments simples
    const [readme, license, releases, contributors] = await Promise.all([
      octokit.rest.repos.getReadme({ owner, repo }).then(() => true).catch(() => false),
      octokit.rest.licenses.getForRepo({ owner, repo }).then(() => true).catch(() => false),
      octokit.rest.repos.listReleases({ owner, repo }).then(r => r.data.length > 0).catch(() => false),
      octokit.rest.repos.listContributors({ owner, repo }).then(r => r.data.length > 0).catch(() => false),
    ]);

    results.hasReadme = readme;
    results.hasLicense = license;
    results.hasReleases = releases;
    results.hasContributors = contributors;
  } catch (err) {
    console.error("GitHub API error:", err);
  }

  return results;
}
