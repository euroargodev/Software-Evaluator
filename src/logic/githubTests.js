// src/logic/githubTests.js
import { getGitHubClient, getCachedData, setCachedData } from "./githubClient.js";

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if a file/path exists in repository
 */
async function checkContentPath(owner, repo, path) {
  const cacheKey = `path_${owner}_${repo}_${path}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet", error: "No GitHub client" };

  try {
    await octokit.rest.repos.getContent({ owner, repo, path });
    const result = { status: "met", path };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    const result = { status: "unmet" };
    setCachedData(cacheKey, result);
    return result;
  }
}

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
    const content = Buffer.from(res.data.content, "base64").toString("utf8");
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
    return [];
  }
}

/**
 * Get file content
 */
async function getFileContent(owner, repo, path) {
  const cacheKey = `file_content_${owner}_${repo}_${path}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return null;

  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
    if (data.content) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      setCachedData(cacheKey, content);
      return content;
    }
    return null;
  } catch {
    return null;
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
 * Check if branch is protected
 */
async function isBranchProtected(owner, repo, branch) {
  const cacheKey = `branch_protected_${owner}_${repo}_${branch}`;
  const cached = getCachedData(cacheKey);
  if (cached !== undefined) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return false;

  try {
    await octokit.rest.repos.getBranchProtection({ owner, repo, branch });
    setCachedData(cacheKey, true);
    return true;
  } catch {
    setCachedData(cacheKey, false);
    return false;
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
    console.warn("Code search failed:", error.message);
    const result = { found: false, error: error.message };
    setCachedData(cacheKey, result);
    return result;
  }
}

// ==================== LEGACY CRITERION 0 (now manual) ====================
export async function checkDataDOIinReadme(owner, repo) {
  const cacheKey = `data_doi_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasDataDOI = /data.*doi.*10\.\d{4,9}/i.test(content) ||
                    /doi.*data.*10\.\d{4,9}/i.test(content);

  const result = { status: hasDataDOI ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== AUTO CRITERIA (20 functions) ====================

/**
 * CRITERION 4: Open-Source Language
 */
export async function checkOpenSourceLanguage(owner, repo) {
  const cacheKey = `criterion_4_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const languages = await getRepoLanguages(owner, repo);
    const openSourceLanguages = [
      'Python', 'R', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C', 'Julia',
      'Go', 'Rust', 'Ruby', 'PHP', 'Shell', 'HTML', 'CSS', 'MATLAB'
    ];
    
    const hasOpenSource = languages.some(lang => 
      openSourceLanguages.includes(lang)
    );
    
    const result = {
      status: hasOpenSource ? "met" : "unmet",
      details: `Languages: ${languages.join(', ')}`,
      evidence: languages.filter(lang => openSourceLanguages.includes(lang))
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
 * CRITERION 5: Argo-Adopted Language
 */
export async function checkLanguageAdoptedByArgo(owner, repo) {
  const cacheKey = `criterion_5_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const languages = await getRepoLanguages(owner, repo);
    const argoLanguages = ['Python', 'R', 'MATLAB', 'Julia'];
    
    const hasArgoLang = languages.some(lang => 
      argoLanguages.includes(lang)
    );
    
    const result = {
      status: hasArgoLang ? "met" : "unmet",
      details: `Languages: ${languages.join(', ')}`,
      evidence: languages.filter(lang => argoLanguages.includes(lang))
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
 * CRITERION 7: Code Formatting Standards
 */
export async function checkCodeFormatting(owner, repo) {
  const cacheKey = `criterion_7_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const formattingFiles = [
      '.prettierrc', '.prettierrc.json', '.prettierrc.js',
      '.eslintrc', '.eslintrc.json', '.eslintrc.js',
      '.editorconfig', 'pyproject.toml', 'setup.cfg',
      '.flake8', '.pylintrc', '.black', '.style.yapf'
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
 * CRITERION 8: Version Control System
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
 * CRITERION 10: LICENSE File
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
 * CRITERION 11: README File
 */
export async function checkReadmeExists(owner, repo) {
  const cacheKey = `criterion_11_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const hasReadme = files.some(f => f.toUpperCase().startsWith('README'));
    
    const result = {
      status: hasReadme ? "met" : "unmet",
      details: hasReadme ? "README file found" : "No README file",
      evidence: files.filter(f => f.toUpperCase().startsWith('README'))
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
 * CRITERION 29: GitHub Topics
 */
export async function checkGitHubTopics(owner, repo) {
  const cacheKey = `criterion_29_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const info = await getRepoInfo(owner, repo);
    const hasTopics = info.topics && info.topics.length > 0;
    
    const result = {
      status: hasTopics ? "met" : "unmet",
      details: hasTopics ? `${info.topics.length} topics` : "No topics",
      evidence: info.topics || []
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
    
    const finalResult = {
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
 * CRITERION 31: .gitignore File
 */
export async function checkHasGitignore(owner, repo) {
  const cacheKey = `criterion_31_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const hasGitignore = files.includes('.gitignore');
    
    const result = {
      status: hasGitignore ? "met" : "unmet",
      details: hasGitignore ? ".gitignore found" : "No .gitignore",
      evidence: hasGitignore ? ['.gitignore'] : []
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
 * CRITERION 32: Protected Main Branch
 */
export async function checkProtectedBranch(owner, repo) {
  const cacheKey = `criterion_32_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const info = await getRepoInfo(owner, repo);
    const defaultBranch = info.default_branch || 'main';
    
    const isProtected = await isBranchProtected(owner, repo, defaultBranch);
    
    const result = {
      status: isProtected ? "met" : "unmet",
      details: isProtected ? `${defaultBranch} branch protected` : "Branch not protected",
      evidence: isProtected ? [defaultBranch] : []
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
 * CRITERION 33: GitHub Description
 */
export async function checkGitHubDescription(owner, repo) {
  const cacheKey = `criterion_33_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const info = await getRepoInfo(owner, repo);
    const hasDescription = info.description && info.description.trim().length > 0;
    
    const result = {
      status: hasDescription ? "met" : "unmet",
      details: hasDescription ? info.description : "No description",
      evidence: hasDescription ? [info.description] : []
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
 * CRITERION 37: Repo URL in Code
 */
export async function checkRepoURLInCode(owner, repo) {
  const cacheKey = `criterion_37_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const repoURL = `github.com/${owner}/${repo}`;
    const result = await searchInCode(owner, repo, [repoURL]);
    
    const finalResult = {
      status: result.found ? "met" : "unmet",
      details: result.found ? "Repository URL found in code" : "URL not found",
      evidence: result.found ? [repoURL] : []
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
 * CRITERION 38: CITATION File
 */
export async function checkCitationFile(owner, repo) {
  const cacheKey = `criterion_38_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    const citationFiles = ['CITATION.cff', 'CITATION.md', 'CITATION.txt', 'CITATION'];
    const hasCitation = citationFiles.some(f => files.includes(f));
    
    const result = {
      status: hasCitation ? "met" : "unmet",
      details: hasCitation ? "CITATION file found" : "No CITATION file",
      evidence: files.filter(f => citationFiles.includes(f))
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
 * CRITERION 41: CONTRIBUTING File
 */
export async function checkContributingFile(owner, repo) {
  const cacheKey = `criterion_41_${owner}_${repo}`;
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
 * CRITERION 46: Has Tests
 */
export async function checkHasTests(owner, repo) {
  const cacheKey = `criterion_46_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const files = await getRepoFiles(owner, repo);
    
    // Check for test directories or files
    const testPatterns = ['test', 'tests', 'spec', '__tests__'];
    const hasTestDir = files.some(f => 
      testPatterns.some(pattern => f.toLowerCase().includes(pattern))
    );
    
    // Check for test files in root
    const hasTestFiles = files.some(f => 
      f.toLowerCase().startsWith('test_') || 
      f.toLowerCase().endsWith('_test.py') ||
      f.toLowerCase().endsWith('.test.js')
    );
    
    const hasTests = hasTestDir || hasTestFiles;
    
    const result = {
      status: hasTests ? "met" : "unmet",
      details: hasTests ? "Test files/directories found" : "No tests found",
      evidence: files.filter(f => 
        testPatterns.some(p => f.toLowerCase().includes(p))
      )
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
 * CRITERION 49: Has Releases
 */
export async function checkHasReleases(owner, repo) {
  const cacheKey = `criterion_49_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) {
    const result = { status: "unmet", error: "No GitHub client" };
    setCachedData(cacheKey, result);
    return result;
  }

  try {
    const { data: releases } = await octokit.rest.repos.listReleases({
      owner,
      repo,
      per_page: 1
    });
    
    const { data: tags } = await octokit.rest.repos.listTags({
      owner,
      repo,
      per_page: 1
    });
    
    const hasReleases = releases.length > 0 || tags.length > 0;
    
    const result = {
      status: hasReleases ? "met" : "unmet",
      details: hasReleases ? `${releases.length} releases, ${tags.length} tags` : "No releases or tags",
      evidence: releases.map(r => r.tag_name)
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
    
    const finalResult = {
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
    
    const finalResult = {
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
