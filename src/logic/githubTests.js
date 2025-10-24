// src/logic/githubTests.js
import { getGitHubClient } from "./githubClient.js";

/**
 * Helper: try to get a path (file or folder) via the API.
 * Returns { status: "met" } if found, otherwise { status: "unmet" }.
 */
async function checkContentPath(owner, repo, path) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.getContent({ owner, repo, path });
    // If the request succeeds we consider the criterion met.
    // res.data can be an array (directory) or object (file).
    return { status: res ? "met" : "unmet" };
  } catch (err) {
    // 404 -> missing file (unmet). Other errors -> unmet but log.
    // don't rethrow to preserve resilience.
    // console.debug("checkContentPath error", { owner, repo, path, err });
    return { status: "unmet" };
  }
}

// ----------------- Basic file checks -----------------
export async function checkReadme(owner, repo) {
  return checkContentPath(owner, repo, "README.md");
}

export async function checkLicense(owner, repo) {
  // use licenses endpoint if available (preferred)
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.licenses.getForRepo({ owner, repo });
    return { status: res && res.data ? "met" : "unmet" };
  } catch {
    // fallback: check for LICENSE file
    return checkContentPath(owner, repo, "LICENSE");
  }
}

export async function checkContributingFile(owner, repo) {
  return checkContentPath(owner, repo, "CONTRIBUTING.md");
}

export async function checkChangeLog(owner, repo) {
  return checkContentPath(owner, repo, "CHANGELOG.md");
}

export async function checkCITATIONcff(owner, repo) {
  return checkContentPath(owner, repo, "CITATION.cff");
}

export async function checkCodeOfConduct(owner, repo) {
  return checkContentPath(owner, repo, "CODE_OF_CONDUCT.md");
}

// ----------------- CI / workflows -----------------
export async function checkCI(owner, repo) {
  // use Actions workflows list (cheaper than checking directory content)
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.actions.listRepoWorkflows({ owner, repo });
    return { status: res && res.data && res.data.total_count > 0 ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

// Check presence of a "tests" folder or common test files (quick heuristic)
export async function checkUnitTests(owner, repo) {
  // Check tests/ directory or tox.ini or jest.config.js or similar
  const candidates = ["tests", "tox.ini", "pytest.ini", "package.json"];
  for (const p of candidates) {
    const res = await checkContentPath(owner, repo, p);
    if (res.status === "met") {
      // special case: if package.json found we should inspect it for test script,
      // but to keep simple we'll mark met if package.json exists (heuristic).
      return { status: "met" };
    }
  }
  return { status: "unmet" };
}

// Continuous deployment: presence of CD-like workflows (heuristic)
export async function checkCD(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.actions.listRepoWorkflows({ owner, repo });
    if (res && res.data && res.data.workflows) {
      // check workflow names for deploy keywords
      const hasCD = res.data.workflows.some(w =>
        /deploy|release|publish|cd/i.test(w.name)
      );
      return { status: hasCD ? "met" : "unmet" };
    }
    return { status: "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

// ----------------- Contributors / PRs / issues -----------------
export async function checkContributors(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listContributors({ owner, repo, per_page: 100 });
    return { status: res && res.data && res.data.length > 0 ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkIdentifiedContributors(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listContributors({ owner, repo, per_page: 100 });
    const people = res?.data || [];
    const allHaveLogin = people.length > 0 && people.every(p => !!p.login);
    return { status: allHaveLogin ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkIssuesEnabled(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    return { status: res?.data?.has_issues ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkIssueLabels(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.issues.listLabelsForRepo({ owner, repo });
    return { status: res?.data?.length > 0 ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkPRsExist(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.pulls.list({ owner, repo, state: "all", per_page: 1 });
    return { status: res?.data?.length > 0 ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkPRsReviewed(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const pulls = await octokit.rest.pulls.list({ owner, repo, state: "all", per_page: 10 });
    for (const pr of pulls.data || []) {
      const reviews = await octokit.rest.pulls.listReviews({ owner, repo, pull_number: pr.number, per_page: 1 });
      if (reviews?.data?.length > 0) return { status: "met" };
    }
    return { status: "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

// ----------------- Releases / distribution -----------------
export async function checkReleases(owner, repo) {
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listReleases({ owner, repo, per_page: 1 });
    return { status: res?.data?.length > 0 ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkDistribution(owner, repo) {
  // heuristic: presence of setup.py, pyproject.toml, package.json, or docs about pip
  const candidates = ["setup.py", "pyproject.toml", "package.json", "requirements.txt"];
  for (const p of candidates) {
    const res = await checkContentPath(owner, repo, p);
    if (res.status === "met") return { status: "met" };
  }
  return { status: "unmet" };
}

// ----------------- README content heuristics -----------------
export async function checkSoftwareIdentifiersInReadme(owner, repo) {
  // tries to fetch README and look for DOI/Zenodo/CITATION
  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    if (!res?.data?.content) return { status: "unmet" };
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    const found = /\b(?:doi:|zenodo|swh:|SWHID|CITATION)/i.test(content);
    return { status: found ? "met" : "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

export async function checkReadmeHasIdentifiersOrCitations(owner, repo) {
  return checkSoftwareIdentifiersInReadme(owner, repo);
}

// ----------------- Generic manual checker -----------------
export function checkManualCriterion({ id }, userAnswers = {}) {
  const a = userAnswers[id];
  if (!a) return { status: "unmet" };
  if (typeof a === "string") {
    const s = a.toLowerCase();
    return { status: s === "met" ? "met" : "unmet" };
  }
  if (typeof a === "object") {
    return { status: a.status === "met" ? "met" : "unmet" };
  }
  if (a === true) return { status: "met" };
  return { status: "unmet" };
}
