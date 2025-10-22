import { getGitHubClient } from "./githubClient.js";

export async function checkReadme(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    return { status: res ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkLicense(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.licenses.getForRepo({ owner, repo });
    return { status: res ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkContributors(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listContributors({ owner, repo });
    return { status: res.data.length > 0 ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkCI(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ".github/workflows",
    });
    return { status: res.data.length > 0 ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

/**
 * Fonction commune pour tous les critères manuels.
 */
export function checkManualCriterion({ id }, userAnswers) {
  const answer = userAnswers[id];
  if (!answer) return { status: "unmet" };
  return { status: answer.status || (answer === true ? "met" : "unmet") };
}
