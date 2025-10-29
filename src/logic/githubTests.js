// src/logic/githubTests.js
import { getGitHubClient, getCachedData, setCachedData } from "./githubClient.js";

/**
 * Helper function to check if a file/folder exists in the repository
 */
async function checkContentPath(owner, repo, path) {
  const cacheKey = `content_${owner}_${repo}_${path}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    await octokit.rest.repos.getContent({ owner, repo, path });
    const result = { status: "met" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repository has a dependencies file (requirements.txt, package.json, etc.)
 */
export async function checkDependenciesFile(owner, repo) {
  const depsFiles = [
    "requirements.txt",
    "environment.yml",
    "setup.py",
    "pyproject.toml",
    "package.json",
    "Pipfile",
    "poetry.lock"
  ];

  // Test all files in parallel
  const results = await Promise.allSettled(
    depsFiles.map(file => checkContentPath(owner, repo, file))
  );

  const found = results.find(
    r => r.status === "fulfilled" && r.value.status === "met"
  );

  return found ? found.value : { status: "unmet" };
}

/**
 * Check if documentation is hosted (ReadTheDocs, GitHub Pages, etc.)
 */
export async function checkDocsHosted(owner, repo) {
  const cacheKey = `docs_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  
  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    const hasDocsLink = /(readthedocs|github\.io|docs\.|documentation)/i.test(content);
    
    if (hasDocsLink) {
      const result = { status: "met" };
      setCachedData(cacheKey, result);
      return result;
    }
  } catch (error) {
    console.log(`README not found for ${owner}/${repo}`);
  }

  // Check for docs folder
  const docsFolder = await checkContentPath(owner, repo, "docs");
  setCachedData(cacheKey, docsFolder);
  return docsFolder;
}

/**
 * Check if there are external contributors (not from Argo team)
 */
export async function checkContributorsExternal(owner, repo) {
  const cacheKey = `contributors_external_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listContributors({ 
      owner, 
      repo,
      per_page: 100 
    });
    
    const outsiders = (res.data || []).filter(c =>
      !/argo|euroargodev|dmqc|rtqc/i.test(c.login)
    );
    
    const result = { 
      status: outsiders.length > 0 ? "met" : "unmet",
      count: outsiders.length 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`Error checking contributors for ${owner}/${repo}:`, error);
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repository has a README
 */
export async function checkReadme(owner, repo) {
  return await checkContentPath(owner, repo, "README.md") || 
         await checkContentPath(owner, repo, "README.rst") ||
         await checkContentPath(owner, repo, "README");
}

/**
 * Check if repository has an open source license
 */
export async function checkLicense(owner, repo) {
  const cacheKey = `license_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    const hasLicense = res.data.license !== null;
    const result = { status: hasLicense ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repository uses an open source language
 */
export async function checkOpenSourceLanguage(owner, repo) {
  const cacheKey = `language_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listLanguages({ owner, repo });
    const languages = Object.keys(res.data || {});
    
    const openSourceLanguages = [
      "Python", "JavaScript", "TypeScript", "Java", "C", "C++", 
      "R", "Julia", "Go", "Rust", "Ruby", "PHP", "Shell"
    ];
    
    const hasOpenSourceLang = languages.some(lang => 
      openSourceLanguages.includes(lang)
    );
    
    const result = { status: hasOpenSourceLang ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if language is adopted by Argo (Python, Matlab, R)
 */
export async function checkLanguageAdoptedByArgo(owner, repo) {
  const cacheKey = `language_argo_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listLanguages({ owner, repo });
    const languages = Object.keys(res.data || {});
    
    const argoLanguages = ["Python", "Matlab", "R"];
    const hasArgoLang = languages.some(lang => argoLanguages.includes(lang));
    
    const result = { status: hasArgoLang ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repo is hosted on Argo GitHub organization
 */
export async function checkArgoHosting(owner, repo) {
  const result = { 
    status: /argo|euroargodev/i.test(owner) ? "met" : "unmet" 
  };
  return result;
}

/**
 * Check if repository has CI/CD workflows
 */
export async function checkCI(owner, repo) {
  const workflows = await checkContentPath(owner, repo, ".github/workflows");
  return workflows;
}

/**
 * Check if repository has unit tests
 */
export async function checkUnitTests(owner, repo) {
  const testPaths = ["tests", "test", "spec", "__tests__"];
  
  const results = await Promise.allSettled(
    testPaths.map(path => checkContentPath(owner, repo, path))
  );
  
  const found = results.find(
    r => r.status === "fulfilled" && r.value.status === "met"
  );
  
  return found ? found.value : { status: "unmet" };
}

/**
 * Check for CD (Continuous Deployment)
 */
export async function checkCD(owner, repo) {
  // Check for common CD indicators in workflows
  return await checkCI(owner, repo); // Simplified for now
}

/**
 * Check if software is distributed (PyPI, npm, CRAN, etc.)
 */
export async function checkDistribution(owner, repo) {
  const distFiles = ["setup.py", "pyproject.toml", "package.json", "DESCRIPTION"];
  
  const results = await Promise.allSettled(
    distFiles.map(file => checkContentPath(owner, repo, file))
  );
  
  const found = results.find(
    r => r.status === "fulfilled" && r.value.status === "met"
  );
  
  return found ? found.value : { status: "unmet" };
}

/**
 * Check if README has identifiers or citations (DOI, Zenodo, etc.)
 */
export async function checkReadmeHasIdentifiersOrCitations(owner, repo) {
  const cacheKey = `readme_ids_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    
    const hasIdentifiers = /(doi|zenodo|citation|cite|badge)/i.test(content);
    const result = { status: hasIdentifiers ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repository follows Argo license compliance
 */
export async function checkArgoLicenseCompliance(owner, repo) {
  const cacheKey = `license_argo_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    const license = res.data.license?.spdx_id || "";
    
    // Argo accepts MIT, Apache-2.0, GPL, BSD, CC
    const argoLicenses = ["MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "CC-BY-4.0"];
    const isCompliant = argoLicenses.some(l => license.includes(l));
    
    const result = { status: isCompliant ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repository has identified contributors
 */
export async function checkIdentifiedContributors(owner, repo) {
  const cacheKey = `contributors_identified_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listContributors({ owner, repo });
    const hasContributors = (res.data || []).length > 0;
    const result = { status: hasContributors ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check for CONTRIBUTING file
 */
export async function checkContributingFile(owner, repo) {
  return await checkContentPath(owner, repo, "CONTRIBUTING.md") ||
         await checkContentPath(owner, repo, "CONTRIBUTING") ||
         await checkContentPath(owner, repo, ".github/CONTRIBUTING.md");
}

/**
 * Check if issues are enabled
 */
export async function checkIssuesEnabled(owner, repo) {
  const cacheKey = `issues_enabled_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    const result = { status: res.data.has_issues ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repository uses issue labels
 */
export async function checkIssueLabels(owner, repo) {
  const cacheKey = `issue_labels_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.issues.listLabelsForRepo({ owner, repo });
    const hasLabels = (res.data || []).length > 0;
    const result = { status: hasLabels ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if repository has pull requests
 */
export async function checkPRsExist(owner, repo) {
  const cacheKey = `prs_exist_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.pulls.list({ 
      owner, 
      repo, 
      state: "all",
      per_page: 1 
    });
    const hasPRs = (res.data || []).length > 0;
    const result = { status: hasPRs ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check if PRs are reviewed
 */
export async function checkPRsReviewed(owner, repo) {
  const cacheKey = `prs_reviewed_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const prs = await octokit.rest.pulls.list({ 
      owner, 
      repo, 
      state: "closed",
      per_page: 10 
    });
    
    if (prs.data.length === 0) {
      const result = { status: "unmet" };
      setCachedData(cacheKey, result);
      return result;
    }
    
    // Check if at least one PR has reviews
    for (const pr of prs.data.slice(0, 5)) {
      const reviews = await octokit.rest.pulls.listReviews({
        owner,
        repo,
        pull_number: pr.number
      });
      if (reviews.data.length > 0) {
        const result = { status: "met" };
        setCachedData(cacheKey, result);
        return result;
      }
    }
    
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check for CHANGELOG
 */
export async function checkChangeLog(owner, repo) {
  return await checkContentPath(owner, repo, "CHANGELOG.md") ||
         await checkContentPath(owner, repo, "CHANGELOG") ||
         await checkContentPath(owner, repo, "HISTORY.md");
}

/**
 * Check if repository has releases
 */
export async function checkReleases(owner, repo) {
  const cacheKey = `releases_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listReleases({ owner, repo });
    const hasReleases = (res.data || []).length > 0;
    const result = { status: hasReleases ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Check for CITATION.cff file
 */
export async function checkCITATIONcff(owner, repo) {
  return await checkContentPath(owner, repo, "CITATION.cff");
}

/**
 * Check for CODE_OF_CONDUCT
 */
export async function checkCodeOfConduct(owner, repo) {
  return await checkContentPath(owner, repo, "CODE_OF_CONDUCT.md") ||
         await checkContentPath(owner, repo, ".github/CODE_OF_CONDUCT.md");
}

/**
 * Check if repository has Argo contributors
 */
export async function checkContributorsArgo(owner, repo) {
  const cacheKey = `contributors_argo_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.listContributors({ owner, repo });
    const argoContributors = (res.data || []).filter(c =>
      /argo|euroargodev|dmqc|rtqc/i.test(c.login)
    );
    const result = { status: argoContributors.length > 0 ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * Generic contributor check
 */
export async function checkContributors(owner, repo) {
  return await checkIdentifiedContributors(owner, repo);
}

/**
 * Check for supported OS documentation (placeholder)
 */
export async function checkSupportedOS(owner, repo) {
  const cacheKey = `supported_os_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
    
    const hasOSInfo = /(windows|linux|macos|ubuntu|debian|operating system)/i.test(content);
    const result = { status: hasOSInfo ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}
