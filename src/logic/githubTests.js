// src/logic/githubTests.js
import { getGitHubClient, getCachedData, setCachedData } from "./githubClient.js";

// Simple base64 decoder that works both in browser (atob) and Node (Buffer)
function decodeBase64(content) {
  if (typeof atob === "function") {
    try {
      return decodeURIComponent(escape(atob(content)));
    } catch {
      return atob(content);
    }
  }
  if (typeof Buffer !== "undefined") {
    return Buffer.from(content, "base64").toString("utf8");
  }
  throw new Error("No base64 decoder available");
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get README content
 */
async function getReadmeContent(owner, repo) {
  const cacheKey = `readme_content_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return null;

  try {
    const res = await octokit.rest.repos.getReadme({ owner, repo });
    const content = decodeBase64(res.data.content);
    setCachedData(cacheKey, content);
    return content;
  } catch {
    return null;
  }
}

/**
 * Get repository info
 */
async function getRepoInfo(owner, repo) {
  const cacheKey = `repo_info_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) throw new Error("GitHub client not initialized");

  try {
    const { data } = await octokit.rest.repos.get({ owner, repo });
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    throw new Error(`Failed to get repo info: ${error.message}`);
  }
}

/**
 * Get repository files at path
 */
async function getRepoFiles(owner, repo, path = "") {
  const cacheKey = `repo_files_${owner}_${repo}_${path}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return [];

  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    const files = Array.isArray(data) ? data.map(f => f.name) : [data.name];
    setCachedData(cacheKey, files);
    return files;
  } catch (error) {
    console.warn(`Could not fetch files at ${path}:`, error.message);
    throw new Error(`GitHub API error while listing ${path || "root"}: ${error.message}`);
  }
}

/**
 * Get repository languages
 */
async function getRepoLanguages(owner, repo) {
  const cacheKey = `repo_languages_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return [];

  try {
    const { data } = await octokit.rest.repos.listLanguages({ owner, repo });
    const languages = Object.keys(data);
    setCachedData(cacheKey, languages);
    return languages;
  } catch {
    return [];
  }
}

/**
 * Search in code (uses GitHub Code Search API - has rate limits)
 */
async function searchInCode(owner, repo, patterns) {
  const cacheKey = `code_search_${owner}_${repo}_${patterns.join('_')}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { found: false, error: "No client" };

  try {
    for (const pattern of patterns) {
      const { data } = await octokit.rest.search.code({
        q: `${pattern} repo:${owner}/${repo}`,
        per_page: 1
      });
      if (data.total_count > 0) {
        const result = { found: true, pattern };
        setCachedData(cacheKey, result);
        return result;
      }
    }
    const result = { found: false };
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const message = error?.message || "Code search failed";
    const isRateLimit = /rate limit/i.test(message);
    const friendlyMessage = isRateLimit
      ? "GitHub code search rate limit exceeded"
      : message;
    console.warn("Code search failed:", friendlyMessage);
    const result = { found: false, error: friendlyMessage };
    setCachedData(cacheKey, result);
    return result;
  }
}


// Helper to DRY language-based criteria (open-source vs Argo-adopted)
function buildLanguageResult(owner, repo, id, allowList) {
  return async () => {
    const cacheKey = `criterion_${id}_${owner}_${repo}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const languages = await getRepoLanguages(owner, repo);
      const matched = languages.filter((lang) => allowList.includes(lang));

      const result = {
        status: matched.length > 0 ? "met" : "unmet",
        details: `Languages: ${languages.join(", ")}`,
        evidence: matched,
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      const result = { status: "unmet", error: error.message };
      setCachedData(cacheKey, result);
      return result;
    }
  };
}

// ==================== AUTO CRITERIA ====================

/**
 * CRITERION 4: Open-Source Language
 */
export const checkOpenSourceLanguage = (owner, repo) =>
  buildLanguageResult(owner, repo, 4, [
    "Python", "R", "JavaScript", "TypeScript", "Java", "C++", "C", "Julia",
    "Go", "Rust", "Ruby", "PHP", "Shell", "HTML", "CSS", "MATLAB"
  ])();

/**
 * CRITERION 5: Argo-Adopted Language
 */
export const checkLanguageAdoptedByArgo = (owner, repo) =>
  buildLanguageResult(owner, repo, 5, ["Python", "R", "MATLAB", "Julia"])();

/**
 * CRITERION 7: Code Formatting Standards
 */
export async function checkCodeFormatting(owner, repo) {
  const cacheKey = `criterion_7_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const formattingFiles = [
      '.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs',
      'prettier.config.js', 'prettier.config.cjs',
      '.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs',
      'eslint.config.js', 'eslint.config.cjs',
      '.editorconfig', 'pyproject.toml', 'setup.cfg', 'tox.ini',
      '.flake8', '.pylintrc', '.black', '.style.yapf',
      'ruff.toml', '.ruff.toml', 'biome.json', 'biome.jsonc'
    ];
    
    const hasFormatter = formattingFiles.some(f => files.includes(f));
    
    const result = {
      status: hasFormatter ? "met" : "unmet",
      details: hasFormatter ? "Code formatting config found" : "No formatting config",
      evidence: files.filter(f => formattingFiles.includes(f))
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 8/29: Version Control System
 */
export async function checkVersionControl(owner, repo) {
  const cacheKey = `criterion_8_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    await getRepoInfo(owner, repo);
    
    const result = {
      status: "met",
      details: "Repository uses Git version control",
      evidence: ["GitHub repository"]
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 9: Dependencies File
 */
export async function checkDependenciesFile(owner, repo) {
  const cacheKey = `criterion_9_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const depFiles = [
      'requirements.txt', 'environment.yml', 'environment.yaml',
      'setup.py', 'setup.cfg', 'pyproject.toml',
      'package.json', 'Pipfile', 'poetry.lock',
      'DESCRIPTION', 'renv.lock', 'Project.toml'
    ];
    
    const hasDeps = depFiles.some(f => files.includes(f));
    
    const result = {
      status: hasDeps ? "met" : "unmet",
      details: hasDeps ? "Dependencies file found" : "No dependencies file",
      evidence: files.filter(f => depFiles.includes(f))
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 10/33: LICENSE File
 */
export async function checkHasLicense(owner, repo) {
  const cacheKey = `criterion_10_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const info = await getRepoInfo(owner, repo);
    const files = await getRepoFiles(owner, repo);
    
    const hasLicenseFile = files.some(f => 
      f.toUpperCase().includes('LICENSE') || f.toUpperCase().includes('LICENCE')
    );
    
    const hasLicenseAPI = info.license !== null;
    
    const result = {
      status: (hasLicenseFile || hasLicenseAPI) ? "met" : "unmet",
      details: info.license ? `License: ${info.license.name}` : "License file found",
      evidence: hasLicenseFile ? files.filter(f => f.toUpperCase().includes('LICENSE')) : []
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 11/32: README File
 */
export async function checkReadmeExists(owner, repo) {
  const cacheKey = `criterion_11_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const readmeContent = await getReadmeContent(owner, repo);
    if (readmeContent) {
      const result = {
        status: "met",
        details: "README found via API endpoint",
        evidence: ["README detected via API"],
      };
      setCachedData(cacheKey, result);
      return result;
    }

    const files = await getRepoFiles(owner, repo);
    const upper = files.map((f) => f.toUpperCase());
    const hasReadmeByList = upper.some((f) => f.startsWith("README"));

    // Support common README variants
    const variants = ["README", "README.MD", "README.RST", "README.TXT", "README.MARKDOWN", "README.ORG"];
    const hasVariant = upper.some((f) => variants.includes(f));

    const hasReadme = hasReadmeByList || hasVariant;
    
    const result = {
      status: hasReadme ? "met" : "unmet",
      details: hasReadme ? "README file found" : "No README file",
      evidence: hasReadme
        ? files.filter((f) => f.toUpperCase().startsWith("README"))
        : []
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 26: English Language
 */
export async function checkEnglishLanguage(owner, repo) {
  const cacheKey = `criterion_26_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const readmeContent = await getReadmeContent(owner, repo);
    
    if (!readmeContent) {
      const result = { status: "unmet", details: "No README to check" };
      setCachedData(cacheKey, result);
      return result;
    }
    
    // Simple heuristic: check for common English words
    const englishWords = ['the', 'and', 'for', 'with', 'this', 'that', 'from'];
    const lowerContent = readmeContent.toLowerCase();
    const englishWordCount = englishWords.filter(word => 
      lowerContent.includes(` ${word} `)
    ).length;
    
    const isEnglish = englishWordCount >= 3;
    
    const result = {
      status: isEnglish ? "met" : "unmet",
      details: isEnglish ? "Documentation in English" : "Language unclear",
      evidence: [`${englishWordCount}/7 common English words found`]
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 30: Uses GDAC Servers
 */
export async function checkUsesGDACServers(owner, repo) {
  const cacheKey = `criterion_30_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const gdacPatterns = [
      'ftp.ifremer.fr',
      'data-argo.ifremer.fr',
      'usgodae.org',
      'gdac'
    ];
    
    const result = await searchInCode(owner, repo, gdacPatterns);

    const finalResult = result.error
      ? {
          status: "unmet",
          details: /rate limit/i.test(result.error)
            ? "Code search rate limit exceeded"
            : "Code search unavailable",
          evidence: [],
          error: result.error
        }
      : {
          status: result.found ? "met" : "unmet",
          details: result.found ? `Found: ${result.pattern}` : "No GDAC server references",
          evidence: result.pattern ? [result.pattern] : []
        };
    
    setCachedData(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 31: Hosted on Argo developer platform (approx: owner contains "argo")
 */
export async function checkHostedOnArgoOrg(owner, repo) {
  const cacheKey = `criterion_31_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const info = await getRepoInfo(owner, repo);
    const ownerLogin = info?.owner?.login || "";
    const isArgo = /argo/i.test(ownerLogin);

    const result = {
      status: isArgo ? "met" : "unmet",
      details: isArgo ? `Hosted under ${ownerLogin}` : "Owner does not match an Argo org/user",
      evidence: isArgo ? [ownerLogin] : []
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 37/46: CONTRIBUTING File
 */
export async function checkContributingFile(owner, repo) {
  const cacheKey = `criterion_contrib_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const contributingFiles = ['CONTRIBUTING.md', 'CONTRIBUTING.rst', 'CONTRIBUTING.txt', 'CONTRIBUTING'];
    const hasContributing = contributingFiles.some(f => files.includes(f));
    
    const result = {
      status: hasContributing ? "met" : "unmet",
      details: hasContributing ? "CONTRIBUTING file found" : "No CONTRIBUTING file",
      evidence: files.filter(f => contributingFiles.includes(f))
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 38: Issues managed on platform (issues enabled and/or template present)
 */
export async function checkIssuesManagedOnPlatform(owner, repo) {
  const cacheKey = `criterion_38_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const info = await getRepoInfo(owner, repo);
    const issuesEnabled = info?.has_issues === true;
    let hasTemplate = false;

    try {
      const ghFiles = await getRepoFiles(owner, repo, ".github");
      hasTemplate = ghFiles.some((f) =>
        f.toLowerCase().startsWith("issue_template") || f.toLowerCase() === "issue_template"
      );
    } catch {
      hasTemplate = false;
    }

    const met = issuesEnabled || hasTemplate;
    const evidence = [];
    if (issuesEnabled) evidence.push("issues_enabled");
    if (hasTemplate) evidence.push(".github/ISSUE_TEMPLATE");

    const result = {
      status: met ? "met" : "unmet",
      details: met ? "Issues enabled or template present" : "Issues appear disabled",
      evidence
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 41: Every significant change within the code is managed through a pull (or merge) request
 */
export async function checkChangesViaPullRequests(owner, repo) {
  const cacheKey = `criterion_41_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet", error: "No GitHub client" };

  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "closed",
      per_page: 1,
    });

    const hasClosedPR = Array.isArray(data) && data.length > 0;
    const result = {
      status: hasClosedPR ? "met" : "unmet",
      details: hasClosedPR ? "Closed pull request found" : "No pull requests found",
      evidence: hasClosedPR ? [`PR #${data[0].number}`] : []
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 49: Has changelog
 */
export async function checkHasChangelog(owner, repo) {
  const cacheKey = `criterion_49_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const candidates = [
      "CHANGELOG",
      "CHANGELOG.md",
      "CHANGES",
      "CHANGES.md",
      "HISTORY.md",
      "RELEASE_NOTES.md",
    ];
    const upper = files.map((f) => f.toUpperCase());
    const matches = candidates.filter((c) => upper.includes(c.toUpperCase()));
    const hasChangelog = matches.length > 0;

    const result = {
      status: hasChangelog ? "met" : "unmet",
      details: hasChangelog ? `Found: ${matches.join(", ")}` : "No changelog file found",
      evidence: matches
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 60: GDAC Folder Structure
 */
export async function checkGDACFolderStructure(owner, repo) {
  const cacheKey = `criterion_60_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const gdacPaths = ['/dac/', '/profiles/', '/trajectories/', '/tech/'];
    const result = await searchInCode(owner, repo, gdacPaths);

    const finalResult = result.error
      ? {
          status: "unmet",
          details: /rate limit/i.test(result.error)
            ? "Code search rate limit exceeded"
            : "Code search unavailable",
          evidence: [],
          error: result.error
        }
      : {
          status: result.found ? "met" : "unmet",
          details: result.found ? `Found: ${result.pattern}` : "No GDAC structure references",
          evidence: result.pattern ? [result.pattern] : []
        };
    
    setCachedData(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

/**
 * CRITERION 61: Official Argo Sources
 */
export async function checkOfficialArgoSources(owner, repo) {
  const cacheKey = `criterion_61_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const argoSources = [
      'ifremer.fr',
      'nvs.nerc.ac.uk',
      'argovis.colorado.edu',
      'argo.ucsd.edu'
    ];
    
    const result = await searchInCode(owner, repo, argoSources);

    const finalResult = result.error
      ? {
          status: "unmet",
          details: /rate limit/i.test(result.error)
            ? "Code search rate limit exceeded"
            : "Code search unavailable",
          evidence: [],
          error: result.error
        }
      : {
          status: result.found ? "met" : "unmet",
          details: result.found ? `Found: ${result.pattern}` : "No official Argo sources",
          evidence: result.pattern ? [result.pattern] : []
        };
    
    setCachedData(cacheKey, finalResult);
    return finalResult;
  } catch (error) {
    const result = { status: "unmet", error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}
