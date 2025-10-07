// src/logic/github.js
// Handles all GitHub API interactions using Octokit

/**
 * Fetch repository metadata and file tree from GitHub
 * @param {Octokit} octokit - authenticated Octokit instance
 * @param {string} owner - repository owner
 * @param {string} repo - repository name
 * @returns {Promise<object>} - object containing metadata, readme, file tree
 */
export async function fetchRepoData(octokit, owner, repo) {
  try {
    // Get repository metadata
    const { data: metadata } = await octokit.rest.repos.get({ owner, repo });

    // Get root file tree
    const { data: tree } = await octokit.rest.repos.getContent({ owner, repo, path: "" });

    // Optional: fetch README if present
    const readmeFile = tree.find(file => file.name.toLowerCase().includes("readme"));
    let readmeContent = "";
    if (readmeFile) {
      const { data: readmeData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: readmeFile.path
      });
      // README content is Base64 encoded
      readmeContent = atob(readmeData.content);
    }

    return { metadata, tree, readme: readmeContent };
  } catch (err) {
    console.error("fetchRepoData error:", err);
    throw new Error("Failed to fetch repository data");
  }
}
