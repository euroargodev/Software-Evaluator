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

function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [targetLevel, setTargetLevel] = useState("Novice"); // Default level
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFirstEvaluation, setIsFirstEvaluation] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });

  const guidelines = Array.isArray(guidelinesRaw) ? guidelinesRaw : [];

  // Filters criteria to those at or below the chosen level
  const getFilteredCriteria = () => {
    const targetIndex = LEVEL_ORDER.indexOf(targetLevel);
    
    return guidelines.filter(criterion => {
      const criterionIndex = LEVEL_ORDER.indexOf(criterion.level);
      return criterionIndex <= targetIndex;
    });
  };

  const filteredCriteria = getFilteredCriteria();
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);

        if (!json.repository || !json.userAnswers) {
          throw new Error("Invalid evaluation file format");
        }

        setUploadedFile(json);

        // Restore saved level if present
        if (json.targetLevel) {
          setTargetLevel(json.targetLevel);
        }

        // Load only manual answers relevant to the current level
        const manualAnswers = {};
        manualCriteria.forEach(criterion => {
          if (json.userAnswers[criterion.id]) {
            manualAnswers[criterion.id] = json.userAnswers[criterion.id];
          }
        });

        setUserAnswers(manualAnswers);
        setRepoUrl(json.repository.url || `https://github.com/${json.repository.owner}/${json.repository.repo}`);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("❌ Invalid file format. Please upload a valid evaluation JSON file.");
      }
    };
    reader.readAsText(file);
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
      if (rateLimit.remaining < 100) {
        alert(
          `⚠️ Low GitHub API rate limit: ${rateLimit.remaining} requests remaining.\n` +
            `The evaluation may fail. Consider waiting until ${rateLimit.reset}.`
        );
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
            ✨ Yes, first time
          </button>
          <button 
            onClick={() => setIsFirstEvaluation(false)}
            className="btn-secondary"
          >
            🔄 No, I have a file
          </button>
        </div>
      </div>
    );
  }

  // ========== UPLOAD SCREEN ==========
  if (!isFirstEvaluation) {
    return (
      <div className="file-upload-section">
        <h2>Upload Your Previous Evaluation</h2>
        <p className="subtitle">
          We'll re-run automatic tests only.
          <br />
          Your manual answers will be preserved.
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className="file-input"
        />
        {uploadedFile && (
          <div className="upload-success">
            <p className="success-message">
              ✅ File loaded: {uploadedFile.repository.owner}/{uploadedFile.repository.repo}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              🎯 Target level: {uploadedFile.targetLevel || "Not specified"}
              <br />
              📝 {Object.keys(userAnswers).length} manual answers restored
            </p>
            <button
              onClick={() => setIsFirstEvaluation(true)}
              className="btn-primary mt-4"
            >
              Continue to Evaluation
            </button>
          </div>
        )}
        <button
          onClick={() => setIsFirstEvaluation(null)}
          className="btn-secondary mt-4"
        >
          ← Back
        </button>
      </div>
    );
  }
  // ========== FORMULAIRE PRINCIPAL ==========
  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div className="form-header">
        <h1>📋 Argo Software Assessment</h1>
        <p className="subtitle">
          Select your target level and answer the corresponding manual criteria.
          <br />
          Automatic checks will run when you submit.
        </p>
      </div>

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

      {/* ✅ STATISTIQUES PAR NIVEAU */}
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
          {loading ? "⏳ Evaluating..." : "🚀 Evaluate Repository"}
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
