// src/components/Form.jsx
import { useState } from "react";
import GroupedManualCriteriaBoard from "./GroupedManualCriteriaBoard";
import TargetLevelSelect from "./TargetLevelSelect";
import guidelinesRaw from "../data/guidelines_v2.json";
import { githubCriterionMap } from "../logic/github";
import { evaluateProject } from "../logic/evaluation";
import { checkRateLimit } from "../logic/githubClient";
import "./Form.css";

function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFirstEvaluation, setIsFirstEvaluation] = useState(null);
  const [targetLevel, setTargetLevel] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });

  const guidelines = Array.isArray(guidelinesRaw) ? guidelinesRaw : [];

  // Attach test functions to guidelines
  const guidelinesWithFunctions = guidelines.map((criterion) => ({
    ...criterion,
    function:
      criterion.type === "auto" && githubCriterionMap[criterion.id]
        ? githubCriterionMap[criterion.id]
        : null,
  }));

  // Parse GitHub URL
  const parseGitHubUrl = (url) => {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error("Invalid GitHub URL format");
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  };

  // Handle file upload for returning users
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Validate file structure
        if (!json.repository || !json.userAnswers) {
          throw new Error("Invalid evaluation file format");
        }

        setUploadedFile(json);
        setUserAnswers(json.userAnswers || {});
        setRepoUrl(json.repository.url || `https://github.com/${json.repository.owner}/${json.repository.repo}`);
        
        console.log("✅ Evaluation file loaded successfully");
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("❌ Invalid file format. Please upload a valid evaluation JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // Progress callback
  const onTestProgress = (current, total, message) => {
    setProgress({ current, total, message });
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setProgress({ current: 0, total: 100, message: "Starting evaluation..." });

    try {
      // Parse repository URL
      const { owner, repo } = parseGitHubUrl(repoUrl);
      console.log(`📊 Evaluating: ${owner}/${repo}`);

      setProgress({ current: 10, total: 100, message: "Checking GitHub API rate limit..." });

      // Check rate limit
      await checkRateLimit();

      setProgress({ current: 20, total: 100, message: "Running automatic tests..." });

      // Run evaluation
      const result = await evaluateProject(
        guidelinesWithFunctions,
        owner,
        repo,
        userAnswers,
        onTestProgress
      );

      setProgress({ current: 90, total: 100, message: "Generating report..." });

      console.log("✅ Evaluation Result:", result);

      // Send results to parent
      onEvaluate(
        { owner, repo, url: repoUrl },
        result,
        userAnswers
      );

      setProgress({ current: 100, total: 100, message: "Complete!" });

    } catch (err) {
      console.error("Error evaluating repo:", err);
      
      let errorMessage = "Failed to evaluate repository.";
      if (err.status === 404) {
        errorMessage = "❌ Repository not found. Please check the URL.";
      } else if (err.status === 403) {
        errorMessage = "⚠️ GitHub API rate limit exceeded. Please try again later.";
      } else if (err.message) {
        errorMessage = `❌ Error: ${err.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0, message: "" });
    }
  };

  // First-time user selection screen
  if (isFirstEvaluation === null) {
    return (
      <div className="evaluation-start">
        <h2>Is this your first evaluation?</h2>
        <p className="text-gray-600 mb-4">
          First-time users will answer all questions. Returning users can upload their previous evaluation file.
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

  return (
    <div className="form-wrapper">
      <form onSubmit={handleSubmit}>
        {/* Repository URL Input */}
        <div className="form-group">
          <label htmlFor="repoUrl">GitHub Repository URL:</label>
          <input
            type="url"
            id="repoUrl"
            placeholder="https://github.com/euroargodev/argopy"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            required
          />
        </div>

        {/* File Upload (Returning Users) */}
        {!isFirstEvaluation && (
          <div className="form-group">
            <label htmlFor="fileUpload">📄 Upload Previous Evaluation File:</label>
            <input
              type="file"
              id="fileUpload"
              accept=".json"
              onChange={handleFileUpload}
            />
            {uploadedFile && (
              <p className="success-message">
                ✅ Loaded: {uploadedFile.repository.owner}/{uploadedFile.repository.repo}
              </p>
            )}
          </div>
        )}

        {/* Target Level (Returning Users) */}
        {!isFirstEvaluation && (
          <div className="form-group">
            <TargetLevelSelect onLevelChange={setTargetLevel} />
          </div>
        )}

        {/* Manual Criteria (First-Time Users) */}
        {isFirstEvaluation && (
          <section className="manual-section">
            <h3>📋 Manual Criteria Questions</h3>
            <GroupedManualCriteriaBoard
              guidelines={guidelines}
              userAnswers={userAnswers}
              setUserAnswers={setUserAnswers}
            />
          </section>
        )}

        {/* Progress Bar */}
        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="progress-message">{progress.message}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className={loading ? "btn-disabled" : "btn-submit"}
          >
            {loading ? "⏳ Evaluating..." : "🚀 Evaluate Repository"}
          </button>
        </div>

        {/* Reset Link */}
        {!isFirstEvaluation && (
          <div className="form-footer">
            <button
              type="button"
              onClick={() => {
                setIsFirstEvaluation(null);
                setUserAnswers({});
                setUploadedFile(null);
                setRepoUrl("");
              }}
              className="btn-link"
            >
              ← Start over
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default Form;
