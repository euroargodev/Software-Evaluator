// src/logic/githubTests.js
import { getGitHubClient, getCachedData, setCachedData  } from "./githubClient.js";

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

// ==================== CRITERION 0: Data DOI ====================
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

// ==================== CRITERION 1: Argo Papers ====================
export async function checkArgoPapersInMetadata(owner, repo) {
  const cacheKey = `argo_papers_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasArgoPaper = /argo.*paper|argo.*publication|argo.*doi/i.test(content);
  const citationCheck = await checkCITATIONcff(owner, repo);
  
  const result = { 
    status: (hasArgoPaper || citationCheck.status === "met") ? "met" : "unmet" 
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 3: Usage Guidelines ====================
export async function checkUsageGuidelines(owner, repo) {
  const cacheKey = `usage_guidelines_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasUsage = /##?\s*(usage|examples?|quickstart|getting started)/i.test(content);
  const hasCodeBlock = /```/g.test(content);
  
  const result = { 
    status: (hasUsage && hasCodeBlock) ? "met" : "unmet" 
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 4: Open-Source Language ====================
export async function checkOpenSourceLanguage(owner, repo) {
  const cacheKey = `language_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.listLanguages({ owner, repo });
    const languages = Object.keys(res.data || {});
    
    const openSourceLanguages = [
      "Python", "JavaScript", "TypeScript", "Java", "C", "C++", 
      "R", "Julia", "Go", "Rust", "Ruby", "PHP", "Shell", "MATLAB"
    ];
    
    const hasOpenSourceLang = languages.some(lang => 
      openSourceLanguages.includes(lang)
    );
    
    const result = { 
      status: hasOpenSourceLang ? "met" : "unmet",
      languages 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 5: Argo Language ====================
export async function checkLanguageAdoptedByArgo(owner, repo) {
  const cacheKey = `language_argo_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.listLanguages({ owner, repo });
    const languages = Object.keys(res.data || {});
    
    const argoLanguages = ["Python", "MATLAB", "R"];
    const hasArgoLang = languages.some(lang => argoLanguages.includes(lang));
    
    const result = { 
      status: hasArgoLang ? "met" : "unmet",
      languages 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 7: Code Formatting ====================
export async function checkCodeFormatting(owner, repo) {
  const cacheKey = `code_formatting_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const formattingFiles = [
    ".black.toml",
    "pyproject.toml",
    ".prettierrc",
    ".prettierrc.json",
    ".eslintrc",
    ".eslintrc.json",
    ".stylelintrc",
    "Rakefile"
  ];

  const results = await Promise.allSettled(
    formattingFiles.map(file => checkContentPath(owner, repo, file))
  );

  const found = results.some(r => 
    r.status === "fulfilled" && r.value.status === "met"
  );

  const result = { status: found ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 8: Argo Hosting ====================
export async function checkArgoHosting(owner, repo) {
  const argoOrgs = ["euroargodev", "argo", "euroargo"];
  return { 
    status: argoOrgs.some(org => owner.toLowerCase().includes(org)) ? "met" : "unmet",
    owner
  };
}

// ==================== CRITERION 9: Dependencies File ====================
export async function checkDependenciesFile(owner, repo) {
  const cacheKey = `dependencies_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const depFiles = [
    "requirements.txt",
    "environment.yml",
    "environment.yaml",
    "setup.py",
    "pyproject.toml",
    "package.json",
    "Gemfile",
    "go.mod",
    "Cargo.toml",
    "Pipfile",
    "poetry.lock"
  ];

  const results = await Promise.allSettled(
    depFiles.map(file => checkContentPath(owner, repo, file))
  );

  const found = results.filter(r => 
    r.status === "fulfilled" && r.value.status === "met"
  );

  const result = { 
    status: found.length > 0 ? "met" : "unmet",
    files: found.length
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 10: Has License ====================
export async function checkHasLicense(owner, repo) {
  const cacheKey = `has_license_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    const result = { 
      status: res.data.license ? "met" : "unmet",
      license: res.data.license?.name || null
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 11: README Exists ====================
export async function checkReadmeExists(owner, repo) {
  const cacheKey = `readme_exists_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  const result = { status: content ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// Alias for checkReadmeExists
export async function checkReadme(owner, repo) {
  return await checkReadmeExists(owner, repo);
}

// ==================== CRITERION 12: API Reference ====================
export async function checkAPIReference(owner, repo) {
  const cacheKey = `api_reference_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasAPI = /api\s+reference|api\s+documentation|sphinx|javadoc|jsdoc/i.test(content);
  
  const docsCheck = await checkContentPath(owner, repo, "docs/api");
  const docCheck2 = await checkContentPath(owner, repo, "doc/api");
  
  const result = { 
    status: (hasAPI || docsCheck.status === "met" || docCheck2.status === "met") ? "met" : "unmet" 
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 13: Docs Hosted ====================
export async function checkDocsHosted(owner, repo) {
  const cacheKey = `docs_hosted_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasDocsLink = /https?:\/\/.*(readthedocs|github\.io|gitlab\.io|netlify|vercel|docs\.)/i.test(content);
  
  // Also check for docs folder
  const docsFolder = await checkContentPath(owner, repo, "docs");
  
  const result = { 
    status: (hasDocsLink || docsFolder.status === "met") ? "met" : "unmet" 
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 14: Installation Instructions ====================
export async function checkInstallationInstructions(owner, repo) {
  const cacheKey = `install_instructions_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasInstall = /##?\s*(installation|install|setup|getting started)/i.test(content);
  const hasCommand = /(pip install|npm install|conda install|git clone|install\.packages)/i.test(content);
  
  const result = { 
    status: (hasInstall && hasCommand) ? "met" : "unmet" 
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 15: CI ====================
export async function checkCI(owner, repo) {
  const cacheKey = `ci_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const ciPaths = [
    ".github/workflows",
    ".gitlab-ci.yml",
    ".travis.yml",
    "azure-pipelines.yml",
    ".circleci/config.yml"
  ];

  const results = await Promise.allSettled(
    ciPaths.map(path => checkContentPath(owner, repo, path))
  );

  const found = results.some(r => 
    r.status === "fulfilled" && r.value.status === "met"
  );

  const result = { status: found ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 16: Multi-Platform Tests ====================
export async function checkMultiPlatformTests(owner, repo) {
  const cacheKey = `multiplatform_tests_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const workflows = await octokit.rest.actions.listRepoWorkflows({ owner, repo });
    
    for (const workflow of workflows.data.workflows) {
      try {
        const workflowFile = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: workflow.path
        });
        
        const content = Buffer.from(workflowFile.data.content, "base64").toString("utf8");
        
        const hasMatrix = /strategy:\s*matrix:/i.test(content);
        const hasMultipleOS = /os:.*$$.*,.*$$/s.test(content) || /(ubuntu|windows|macos).*\n.*(ubuntu|windows|macos)/i.test(content);
        
        if (hasMatrix && hasMultipleOS) {
          const result = { status: "met" };
          setCachedData(cacheKey, result);
          return result;
        }
      } catch {
        continue;
      }
    }
    
    return { status: "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 17: Unit Tests ====================
export async function checkUnitTests(owner, repo) {
  const cacheKey = `unit_tests_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const testPaths = ["tests", "test", "spec", "__tests__"];
  
  const results = await Promise.allSettled(
    testPaths.map(path => checkContentPath(owner, repo, path))
  );
  
  const found = results.find(
    r => r.status === "fulfilled" && r.value.status === "met"
  );
  
  const result = found ? found.value : { status: "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 18: CD ====================
export async function checkCD(owner, repo) {
  // CD typically detected by deployment actions in workflows
  return await checkCI(owner, repo);
}

// ==================== CRITERION 19: DOI in README ====================
export async function checkDOIinReadme(owner, repo) {
  const cacheKey = `doi_readme_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasDOI = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i.test(content) ||
                /doi\.org|zenodo\.org.*\/record/i.test(content);
  
  const result = { status: hasDOI ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 20: Published Paper ====================
export async function checkPublishedPaper(owner, repo) {
  const cacheKey = `published_paper_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasPaper = /published\s+paper|joss|journal|publication/i.test(content);
  const hasDOI = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i.test(content);
  
  const result = { 
    status: (hasPaper || hasDOI) ? "met" : "unmet" 
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 21: Argo Data DOI ====================
export async function checkArgoDataDOI(owner, repo) {
  const cacheKey = `argo_data_doi_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasArgoDOI = /argo.*10\.\d{4,9}|10\.\d{4,9}.*argo/i.test(content);
  
  const result = { status: hasArgoDOI ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 22: Docstrings ====================
export async function checkDocstrings(owner, repo) {
  const cacheKey = `docstrings_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const searchRes = await octokit.rest.search.code({
      q: `repo: $ {owner}/ $ {repo} """" OR "'''" OR "/**" OR "///"`,
      per_page: 1
    });

    const result = { 
      status: searchRes.data.total_count > 0 ? "met" : "unmet" 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 26: English Language ====================
export async function checkEnglishLanguage(owner, repo) {
  const cacheKey = `english_docs_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const englishWords = /\b(the|and|is|are|for|with|this|that|software|documentation)\b/gi;
  const matches = content.match(englishWords) || [];
  
  const result = { 
    status: matches.length > 20 ? "met" : "unmet",
    confidence: matches.length
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 29: Git Used ====================
export async function checkGitUsed(owner, repo) {
  return { 
    status: "met",
    platform: "GitHub (Git-based)"
  };
}

// ==================== CRITERION 30: GDAC Access ====================
export async function checkGDACAccess(owner, repo) {
  const cacheKey = `gdac_access_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const searchRes = await octokit.rest.search.code({
      q: `repo: $ {owner}/ $ {repo} "ftp.ifremer.fr" OR "data-argo.ifremer" OR "gdac" OR "usgodae.org"`,
      per_page: 1
    });

    const result = { 
      status: searchRes.data.total_count > 0 ? "met" : "unmet" 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 31: Argo Org Hosting ====================
export async function checkArgoOrgHosting(owner, repo) {
  const argoOrgs = ["euroargodev", "argo", "euroargo", "argodmqc", "argortqc"];
  return { 
    status: argoOrgs.some(org => owner.toLowerCase() === org.toLowerCase()) ? "met" : "unmet",
    owner
  };
}

// ==================== CRITERION 32: README Quality ====================
export async function checkReadmeQuality(owner, repo) {
  const cacheKey = `readme_quality_ $ {owner}_ $ {repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasTitle = /^#\s+/m.test(content);
  const hasDescription = content.length > 200;
  const hasSections = (content.match(/^##\s+/gm) || []).length >= 3;
  const hasCodeBlocks = /```/g.test(content);
  
  const qualityScore = [hasTitle, hasDescription, hasSections, hasCodeBlocks].filter(Boolean).length;
  
  const result = { 
    status: qualityScore >= 3 ? "met" : "unmet",
    score: qualityScore
  };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 33: LICENSE File ====================
export async function checkLicenseFile(owner, repo) {
  const cacheKey = `license_file_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const possiblePaths = [
    "LICENSE",
    "LICENSE.md",
    "LICENSE.txt",
    "COPYING",
    "COPYING.md"
  ];

  for (const path of possiblePaths) {
    const result = await checkContentPath(owner, repo, path);
    if (result.status === "met") {
      setCachedData(cacheKey, { status: "met", path });
      return { status: "met", path };
    }
  }

  const result = { status: "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// Alias for checkLicenseFile
export async function checkLicense(owner, repo) {
  return await checkHasLicense(owner, repo);
}

// ==================== CRITERION 34: External Contributors ====================
export async function checkContributorsExternal(owner, repo) {
  const cacheKey = `contributors_external_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.listContributors({ 
      owner, 
      repo,
      per_page: 100 
    });

    const external = (res.data || []).filter(c =>
      !/argo|euroargodev|dmqc|rtqc/i.test(c.login)
    );

    const result = { 
      status: external.length > 0 ? "met" : "unmet",
      count: external.length 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 35: Argo Contributors ====================
export async function checkContributorsArgo(owner, repo) {
  const cacheKey = `contributors_argo_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.listContributors({ 
      owner, 
      repo,
      per_page: 100 
    });

    const argoContributors = (res.data || []).filter(c =>
      /argo|euroargodev|dmqc|rtqc/i.test(c.login)
    );

    const result = { 
      status: argoContributors.length > 0 ? "met" : "unmet",
      count: argoContributors.length 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// Alias for generic contributor check
export async function checkContributors(owner, repo) {
  return await checkIdentifiedContributors(owner, repo);
}

// ==================== CRITERION 36: Identified Contributors ====================
export async function checkIdentifiedContributors(owner, repo) {
  const cacheKey = `contributors_identified_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.listContributors({ owner, repo });
    const hasContributors = (res.data || []).length > 0;
    const result = { status: hasContributors ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 40: CONTRIBUTING File ====================
export async function checkContributingFile(owner, repo) {
  const cacheKey = `contributing_file_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const possiblePaths = [
    "CONTRIBUTING.md",
    "CONTRIBUTING",
    ".github/CONTRIBUTING.md",
    "docs/CONTRIBUTING.md"
  ];

  for (const path of possiblePaths) {
    const result = await checkContentPath(owner, repo, path);
    if (result.status === "met") {
      setCachedData(cacheKey, { status: "met", path });
      return { status: "met", path };
    }
  }

  return { status: "unmet" };
}

// ==================== CRITERION 41: PRs Exist ====================
export async function checkPRsExist(owner, repo) {
  const cacheKey = `prs_exist_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const prs = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 1
    });

    const result = { 
      status: prs.data.length > 0 ? "met" : "unmet" 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 42: PRs Reviewed ====================
export async function checkPRsReviewed(owner, repo) {
  const cacheKey = `prs_reviewed_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const prs = await octokit.rest.pulls.list({
      owner,
      repo,
      state: "closed",
      per_page: 10
    });

    if (prs.data.length === 0) {
      return { status: "unmet" };
    }

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

    return { status: "unmet" };
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 43: Issues Enabled ====================
export async function checkIssuesEnabled(owner, repo) {
  const cacheKey = `issues_enabled_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    const result = { status: res.data.has_issues ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 44: Issue Labels ====================
export async function checkIssueLabels(owner, repo) {
  const cacheKey = `issue_labels_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.issues.listLabelsForRepo({ owner, repo });
    const hasLabels = (res.data || []).length > 0;
    const result = { status: hasLabels ? "met" : "unmet" };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 47: Supported OS ====================
export async function checkSupportedOS(owner, repo) {
  const cacheKey = `supported_os_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasOSInfo = /(windows|linux|macos|ubuntu|debian|operating system)/i.test(content);
  
  const result = { status: hasOSInfo ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 48: Execution Environment ====================
export async function checkExecutionEnvironment(owner, repo) {
  const cacheKey = `execution_env_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const envFiles = [
    "environment.yml",
    "environment.yaml",
    "Dockerfile",
    "docker-compose.yml",
    ".devcontainer/devcontainer.json"
  ];

  const results = await Promise.allSettled(
    envFiles.map(file => checkContentPath(owner, repo, file))
  );

  const found = results.some(r => 
    r.status === "fulfilled" && r.value.status === "met"
  );

  const result = { status: found ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 49: Changelog ====================
export async function checkChangeLog(owner, repo) {
  const cacheKey = `changelog_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const possiblePaths = [
    "CHANGELOG.md",
    "CHANGELOG",
    "HISTORY.md",
    "CHANGES.md",
    "NEWS.md"
  ];

  for (const path of possiblePaths) {
    const result = await checkContentPath(owner, repo, path);
    if (result.status === "met") {
      setCachedData(cacheKey, { status: "met", path });
      return { status: "met", path };
    }
  }

  return { status: "unmet" };
}

// ==================== CRITERION 50: Releases ====================
export async function checkReleases(owner, repo) {
  const cacheKey = `releases_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const releases = await octokit.rest.repos.listReleases({ 
      owner, 
      repo, 
      per_page: 1 
    });
    
    const result = { 
      status: releases.data.length > 0 ? "met" : "unmet" 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 51: README Identifiers ====================
export async function checkReadmeHasIdentifiersOrCitations(owner, repo) {
  const cacheKey = `readme_ids_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasIdentifiers = /(doi|zenodo|citation|cite|badge|swhid)/i.test(content);
  const result = { status: hasIdentifiers ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 52: Software Registry ====================
export async function checkSoftwareRegistry(owner, repo) {
  const cacheKey = `software_registry_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasRegistry = /(zenodo|seanoe|research software directory|pypi|cran)/i.test(content);
  const result = { status: hasRegistry ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 53: Argo Registry ====================
export async function checkArgoRegistry(owner, repo) {
  const cacheKey = `argo_registry_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const content = await getReadmeContent(owner, repo);
  if (!content) return { status: "unmet" };

  const hasArgoRegistry = /(argo.*software.*tools|ast|argo.*bgc.*webpage)/i.test(content);
  const result = { status: hasArgoRegistry ? "met" : "unmet" };
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 54: Argo License Compliance ====================
export async function checkArgoLicenseCompliance(owner, repo) {
  const cacheKey = `argo_license_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const res = await octokit.rest.repos.get({ owner, repo });
    const license = res.data.license;
    
    if (!license) return { status: "unmet" };

    const permissiveLicenses = [
      "mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause",
      "cc-by-4.0", "cc-by-3.0", "lgpl-3.0", "mpl-2.0"
    ];

    const result = { 
      status: permissiveLicenses.includes(license.key) ? "met" : "unmet",
      license: license.name
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 55: CITATION.cff ====================
export async function checkCITATIONcff(owner, repo) {
  const cacheKey = `citation_cff_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const result = await checkContentPath(owner, repo, "CITATION.cff");
  setCachedData(cacheKey, result);
  return result;
}

// ==================== CRITERION 56: Modular Design ====================
export async function checkModularDesign(owner, repo) {
  const cacheKey = `modular_design_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const structures = ["src", "lib", "modules", "components", "packages"];

  for (const dir of structures) {
    const result = await checkContentPath(owner, repo, dir);
    if (result.status === "met") {
      setCachedData(cacheKey, { status: "met", structure: dir });
      return { status: "met", structure: dir };
    }
  }

  return { status: "unmet" };
}

// ==================== CRITERION 57: Consistent Style ====================
export async function checkConsistentStyle(owner, repo) {
  return await checkCodeFormatting(owner, repo);
}

// ==================== CRITERION 58: Module Documentation ====================
export async function checkModuleDocumentation(owner, repo) {
  return await checkDocstrings(owner, repo);
}

// ==================== CRITERION 59: Code of Conduct ====================
export async function checkCodeOfConduct(owner, repo) {
  const cacheKey = `code_of_conduct_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const possiblePaths = [
    "CODE_OF_CONDUCT.md",
    "CODE_OF_CONDUCT",
    ".github/CODE_OF_CONDUCT.md",
    "docs/CODE_OF_CONDUCT.md"
  ];

  for (const path of possiblePaths) {
    const result = await checkContentPath(owner, repo, path);
    if (result.status === "met") {
      setCachedData(cacheKey, { status: "met", path });
      return { status: "met", path };
    }
  }

  return { status: "unmet" };
}

// ==================== CRITERION 60: GDAC Structure ====================
export async function checkGDACStructure(owner, repo) {
  const cacheKey = `gdac_structure_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const searchRes = await octokit.rest.search.code({
      q: `repo:${owner}/${repo} "dac" OR "profiles" OR "trajectories" OR "gdac structure"`,
      per_page: 1
    });

    const result = { 
      status: searchRes.data.total_count > 0 ? "met" : "unmet" 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 61: Argo Metadata Sources ====================
export async function checkArgoMetadataSources(owner, repo) {
  const cacheKey = `argo_metadata_sources_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const octokit = getGitHubClient();
  if (!octokit) return { status: "unmet" };

  try {
    const searchRes = await octokit.rest.search.code({
      q: `repo:${owner}/${repo} "nvs" OR "sparql" OR "stac" OR "gdac ftp" OR "gdac https"`,
      per_page: 1
    });

    const result = { 
      status: searchRes.data.total_count > 0 ? "met" : "unmet" 
    };
    setCachedData(cacheKey, result);
    return result;
  } catch {
    return { status: "unmet" };
  }
}

// ==================== CRITERION 62: Issue Templates ====================
export async function checkIssueTemplates(owner, repo) {
  const cacheKey = `issue_templates_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const templatePaths = [
    ".github/ISSUE_TEMPLATE",
    ".github/ISSUE_TEMPLATE.md",
    ".gitlab/issue_templates"
  ];

  for (const path of templatePaths) {
    const result = await checkContentPath(owner, repo, path);
    if (result.status === "met") {
      setCachedData(cacheKey, { status: "met", path });
      return { status: "met", path };
    }
  }

  return { status: "unmet" };
}

// ==================== CRITERION 63: Distribution ====================
export async function checkDistribution(owner, repo) {
  const cacheKey = `distribution_${owner}_${repo}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const distFiles = [
    "setup.py",
    "pyproject.toml",
    "package.json",
    "Cargo.toml",
    "pom.xml",
    "build.gradle",
    "DESCRIPTION"
  ];

  const results = await Promise.allSettled(
    distFiles.map(file => checkContentPath(owner, repo, file))
  );

  const found = results.filter(r => 
    r.status === "fulfilled" && r.value.status === "met"
  );

  const result = { 
    status: found.length > 0 ? "met" : "unmet",
    files: found.length
  };
  setCachedData(cacheKey, result);
  return result;
}
