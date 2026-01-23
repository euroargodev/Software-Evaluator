// src/components/Form.jsx
// Collects repository info, lets the user answer manual criteria, and triggers auto checks.
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import TargetLevelSelect from "./TargetLevelSelect";
import GroupedManualCriteriaBoard from "./GroupedManualCriteriaBoard";
import guidelinesRaw from "../data/guidelines_v2.json";
import { evaluateProject } from "../logic/evaluation";
import { checkRateLimit } from "../logic/githubClient";
import "./Form.css";

// Fixed order to compare target level and criterion level
const LEVEL_ORDER = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
const EVALUATION_FILE_NAME = "argo-software-dev-evaluation.json";

function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [targetLevel, setTargetLevel] = useState("Novice"); // Default level
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFirstEvaluation, setIsFirstEvaluation] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadInfo, setUploadInfo] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [importMode, setImportMode] = useState("upload");
  const [repoLookup, setRepoLookup] = useState("");
  const [repoLookupLoading, setRepoLookupLoading] = useState(false);

  const guidelines = Array.isArray(guidelinesRaw) ? guidelinesRaw : [];

  // Filters criteria to those at or below a given level
  const getFilteredCriteria = (level = targetLevel) => {
    const targetIndex = LEVEL_ORDER.indexOf(level);
    return guidelines.filter(criterion => LEVEL_ORDER.indexOf(criterion.level) <= targetIndex);
  };

  const filteredCriteria = getFilteredCriteria(targetLevel);
  const manualCriteria = filteredCriteria.filter(c => c.type === "manual");
  const autoCriteria = filteredCriteria.filter(c => c.type === "auto");
  const manualCriteriaKey = manualCriteria.map(c => c.id).join(",");

  // Pre-fill manual answers to unmet whenever the level or list changes
  useEffect(() => {
    setUserAnswers((prev) => {
      const next = {};
      manualCriteria.forEach((criterion) => {
        next[criterion.id] = prev[criterion.id] || { status: "unmet", evidence: "" };
      });
      return next;
    });
  }, [targetLevel, manualCriteriaKey]);

  const parseGitHubUrl = (url) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error("Invalid GitHub URL format");
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  };

  const normalizeAnswer = (answer) => {
    if (!answer || typeof answer !== "object") return null;
    const status = ["met", "unmet"].includes((answer.status || "").toLowerCase())
      ? answer.status.toLowerCase()
      : "unmet";
    const evidence = typeof answer.evidence === "string" ? answer.evidence : "";
    return { status, evidence };
  };

  const validateEvaluationFile = (json, manualList) => {
    const errors = [];
    if (!json.repository || !json.repository.owner || !json.repository.repo) {
      errors.push("Missing repository owner or name.");
    }
    if (!json.userAnswers || typeof json.userAnswers !== "object") {
      errors.push("Missing userAnswers object.");
    }

    const cleanedAnswers = {};
    if (json.userAnswers && typeof json.userAnswers === "object") {
      manualList.forEach((criterion) => {
        const normalized = normalizeAnswer(json.userAnswers[criterion.id]);
        cleanedAnswers[criterion.id] = normalized || { status: "unmet", evidence: "" };
      });
    }

    const repoUrl = json.repository?.url || (json.repository?.owner && json.repository?.repo? `https://github.com/${json.repository.owner}/${json.repository.repo}` : "");

    return {
      valid: errors.length === 0,
      errors,
      cleanedAnswers,
      repoUrl,
    };
  };

  const processEvaluationJson = (json) => {
    const nextTargetCandidates = [
      json.targetLevel,
      json.evaluation?.targetLevel,
      json.evaluation?.stats?.targetLevel,
      json.stats?.targetLevel,
      json.repository?.targetLevel,
      json.evaluation?.level
    ];
    const nextTarget = nextTargetCandidates.find((level) => LEVEL_ORDER.includes(level)) || targetLevel;
    const manualForFile = getFilteredCriteria(nextTarget).filter(c => c.type === "manual");

    const { valid, errors, cleanedAnswers, repoUrl: repoFromFile } = validateEvaluationFile(json, manualForFile);

    if (!valid) {
      setUploadError(errors.join(" "));
      setUploadedFile(null);
      setUploadInfo(null);
      return false;
    }

    setUploadError("");
    setUploadedFile(json);
    setUploadInfo({
      repo: `${json.repository.owner}/${json.repository.repo}`,
      targetLevel: nextTarget,
      manualCount: manualForFile.length,
      restoredAnswers: Object.values(cleanedAnswers || {}).filter(a => a?.status).length
    });

    setTargetLevel(nextTarget);
    setUserAnswers(cleanedAnswers);
    setRepoUrl(repoFromFile);
    setIsFirstEvaluation(true);
    return true;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        processEvaluationJson(json);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("❌ Invalid file format. Please upload a valid evaluation JSON file.");
        setUploadError("Invalid file format. Please upload a valid evaluation JSON file.");
        setUploadedFile(null);
        setUploadInfo(null);
      }
    };
    reader.readAsText(file);
  };

  const parseRepoInput = (input) => {
    if (!input) throw new Error("Repository is required.");
    if (input.includes("github.com")) return parseGitHubUrl(input);
    const match = input.match(/^([^\/\s]+)\/([^\/\s]+)$/);
    if (!match) throw new Error("Use owner/repo or a GitHub URL.");
    return { owner: match[1], repo: match[2] };
  };

  const getDefaultBranch = async (owner, repo) => {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.default_branch || null;
  };

  const fetchEvaluationFromRepo = async () => {
    setUploadError("");
    setRepoLookupLoading(true);

    try {
      const { owner, repo } = parseRepoInput(repoLookup.trim());
      const defaultBranch = await getDefaultBranch(owner, repo);
      const branches = [defaultBranch, "main", "master"].filter(
        (branch, index, list) => branch && list.indexOf(branch) === index
      );

      for (const branch of branches) {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${EVALUATION_FILE_NAME}`;
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          const json = await response.json();
          const processed = processEvaluationJson(json);
          if (!processed) return;
          setRepoLookupLoading(false);
          return;
        }
        if (response.status !== 404) {
          throw new Error("Unable to access evaluation file.");
        }
      }

      setUploadError("Evaluation file not found in the repository.");
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setRepoLookupLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgress({ current: 0, total: 0, message: "Starting evaluation..." });

    try {
      const { owner, repo } = parseGitHubUrl(repoUrl);

      // Ensure every manual criterion is answered
      const missingAnswers = manualCriteria.filter(
        (c) => !userAnswers[c.id] || !userAnswers[c.id].status
      );

      if (missingAnswers.length > 0) {
        alert(
          `⚠️ Please answer all manual criteria before submitting.\n\n` +
            `Missing ${missingAnswers.length} answers:\n` +
            missingAnswers.map((c) => `• ${c.title}`).join("\n")
        );
        setLoading(false);
        return;
      }

      const rateLimit = await checkRateLimit();
      const warnings = [];
      if (rateLimit.remaining < 100) {
        warnings.push(
          `⚠️ Low GitHub API rate limit: ${rateLimit.remaining} requests remaining.\n` +
            `The evaluation may fail. Consider waiting until ${rateLimit.reset}.`
        );
      }
      if (typeof rateLimit.searchRemaining === "number" && rateLimit.searchRemaining < 5) {
        const searchResetLabel = rateLimit.searchReset
          ? rateLimit.searchReset.toLocaleTimeString()
          : "soon";
        warnings.push(
          `⚠️ GitHub code search rate limit is low: ${rateLimit.searchRemaining} requests remaining.\n` +
            `Search-based checks may fail. Resets at ${searchResetLabel}.`
        );
      }
      if (warnings.length > 0) {
        alert(warnings.join("\n\n"));
      }

      const progressCallback = (current, total, message) => {
        setProgress({ current, total, message });
      };

      const evaluationResult = await evaluateProject(
        filteredCriteria,  
        owner,
        repo,
        userAnswers,
        progressCallback,
        targetLevel
      );

      setProgress({ current: 100, total: 100, message: "Complete!" });

      // Pass evaluated data up with the selected target level
      onEvaluate(
        { owner, repo, url: repoUrl, targetLevel },
        evaluationResult,
        userAnswers
      );

    } catch (err) {
      console.error("❌ Error evaluating repo:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== SELECTION SCREEN ==========
  if (isFirstEvaluation === null) {
    return (
      <div className="evaluation-start-wrapper">
        <div className="evaluation-start">
          <h2>Is this your first evaluation?</h2>
          <p className="subtitle">
            First-time users will answer manual questions based on their target level.
            <br />
            Returning users can upload their previous evaluation file.
          </p>
          <div className="button-group">
            <button 
              onClick={() => setIsFirstEvaluation(true)}
              className="btn-primary"
            >
              Yes, first time
            </button>
            <button 
              onClick={() => setIsFirstEvaluation(false)}
              className="btn-secondary"
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== UPLOAD SCREEN ==========
  if (!isFirstEvaluation) {
    return (
      <div className="file-upload-wrapper">
        <div className="file-upload-section">
          <h2>Upload Your Previous Evaluation</h2>
          <p className="subtitle">
            We'll re-run automatic tests only.
            <br />
            Your manual answers will be preserved.
          </p>
          <div className="import-toggle">
            <button
              type="button"
              onClick={() => setImportMode("upload")}
              className={importMode === "upload" ? "btn-primary" : "btn-secondary"}
            >
              Upload file
            </button>
            <button
              type="button"
              onClick={() => setImportMode("repo")}
              className={importMode === "repo" ? "btn-primary" : "btn-secondary"}
            >
              Fetch from repo
            </button>
          </div>
          {importMode === "repo" && (
            <p className="file-upload-note">
              We look for <strong>{EVALUATION_FILE_NAME}</strong> at the repository root.
            </p>
          )}
          {importMode === "upload" ? (
            <div className="file-upload-actions">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="file-input"
              />
            </div>
          ) : (
            <div className="file-upload-actions">
              <input
                type="text"
                value={repoLookup}
                onChange={(event) => setRepoLookup(event.target.value)}
                className="file-input"
                placeholder="owner/repo or GitHub URL"
              />
              <button
                type="button"
                onClick={fetchEvaluationFromRepo}
                className="btn-primary"
                disabled={repoLookupLoading}
              >
                {repoLookupLoading ? "Fetching..." : "Fetch"}
              </button>
            </div>
          )}
          {uploadError && (
            <p className="error-message">{uploadError}</p>
          )}
          {uploadedFile && uploadInfo && (
            <div className="upload-success">
              <p className="success-message">
                File loaded: {uploadInfo.repo}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Target level: {uploadInfo.targetLevel}
                <br />
                {uploadInfo.restoredAnswers} manual answers restored for {uploadInfo.manualCount} manual criteria
              </p>
            </div>
          )}
          <div className="file-upload-footer">
            <button
              type="button"
              onClick={() => setIsFirstEvaluation(null)}
              className="btn-secondary"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  // ========== FORMULAIRE PRINCIPAL ==========
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-intro">
        <p className="form-intro-text">
          Select your target level and answer the corresponding manual criteria. Automatic
          checks will run when you submit.
        </p>
      </div>
      <div className="form-top-row">
        {/* Level selector */}
        <div className="form-group">
          <label htmlFor="target-level">
            Target Level <span className="required">*</span>
          </label>
          <TargetLevelSelect 
            targetLevel={targetLevel}
            maxLevel={LEVEL_ORDER.length}
            onChange={setTargetLevel}
            disabled={loading}
          />
          <p className="helper-text">
            Selecting a level will show criteria up to and including that level.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="repo-url">
            GitHub Repository URL <span className="required">*</span>
          </label>
          <input
            id="repo-url"
            type="url"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group auto-tests">
          <h3>Automatic checks that will run</h3>
          <details className="auto-tests-details">
            <summary>{autoCriteria.length} checks</summary>
            <ul className="auto-tests-list">
              {autoCriteria.map((criterion) => (
                <li key={criterion.id}>
                  <span className="auto-test-id">#{criterion.id}</span>
                  <span className="auto-test-title">{criterion.title}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {/* Stats per level */}
      <div className="evaluation-stats">
        <div className="stat-card">
          <span className="stat-label">Target Level</span>
          <span className="stat-value">{targetLevel}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Manual Criteria</span>
          <span className="stat-value">
            {Object.keys(userAnswers).length} / {manualCriteria.length}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Auto Checks</span>
          <span className="stat-value">{autoCriteria.length}</span>
        </div>
      </div>

      {/* Manual criteria filtered by level */}
      <GroupedManualCriteriaBoard
        guidelines={manualCriteria}
        userAnswers={userAnswers}
        setUserAnswers={setUserAnswers}
      />

      {loading && progress.total > 0 && (
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="progress-message">
            {progress.message || `${progress.current} / ${progress.total} tests completed`}
          </p>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={loading} className="evaluate-btn">
          {loading ? "⏳ Evaluating..." : "Evaluate Repository"}
        </button>

        <button
          type="button"
          onClick={() => setIsFirstEvaluation(null)}
          className="btn-secondary"
        >
          ← Back
        </button>
      </div>
    </form>
  );
}

Form.propTypes = {
  onEvaluate: PropTypes.func.isRequired,
};

export default Form;
