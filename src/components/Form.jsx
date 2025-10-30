// src/components/Form.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import GroupedManualCriteriaBoard from "./GroupedManualCriteriaBoard";
import guidelinesRaw from "../data/guidelines_v2.json";
import { evaluateProject } from "../logic/evaluation";
import { checkRateLimit } from "../logic/githubClient";
import "./Form.css";

function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFirstEvaluation, setIsFirstEvaluation] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });

  const guidelines = Array.isArray(guidelinesRaw) ? guidelinesRaw : [];

  // ✅ FILTRE: Uniquement les critères manuels
  const manualCriteria = guidelines.filter(c => c.type === "manual");
  const autoCriteria = guidelines.filter(c => c.type === "auto");

  console.log(`📊 Criteria breakdown:
    • Manual: ${manualCriteria.length}
    • Auto: ${autoCriteria.length}
    • Total: ${guidelines.length}`);

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

        // ✅ Charger uniquement les réponses manuelles
        const manualAnswers = {};
        manualCriteria.forEach(criterion => {
          if (json.userAnswers[criterion.id]) {
            manualAnswers[criterion.id] = json.userAnswers[criterion.id];
          }
        });

        setUserAnswers(manualAnswers);
        setRepoUrl(json.repository.url || `https://github.com/${json.repository.owner}/${json.repository.repo}`);

        console.log("✅ Evaluation file loaded successfully");
        console.log("📝 Manual answers loaded:", Object.keys(manualAnswers).length);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("❌ Invalid file format. Please upload a valid evaluation JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const onTestProgress = (current, total, message = "") => {
    setProgress({ current, total, message });
    console.log(`📊 Progress: ${current}/${total} - ${message}`);
  };

  // src/components/Form.jsx

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setProgress({ current: 0, total: 0, message: "Starting evaluation..." });

  try {
    const { owner, repo } = parseGitHubUrl(repoUrl);

    // Vérifier que toutes les questions manuelles sont répondues
    const missingAnswers = manualCriteria.filter(
      (c) => !userAnswers[c.id] || !userAnswers[c.id].status
    );

    console.log(`📋 Manual criteria check:
      • Total manual: ${manualCriteria.length}
      • Answered: ${Object.keys(userAnswers).length}
      • Missing: ${missingAnswers.length}`);

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
    console.log(
      `🔢 GitHub API: ${rateLimit.remaining} requests remaining (resets at ${rateLimit.reset})`
    );

    if (rateLimit.remaining < 100) {
      alert(
        `⚠️ Low GitHub API rate limit: ${rateLimit.remaining} requests remaining.\n` +
          `The evaluation may fail. Consider waiting until ${rateLimit.reset}.`
      );
    }

    console.log(`🔍 Evaluating ${owner}/${repo}...`);

    const progressCallback = (current, total, message) => {
      console.log(`📊 Progress: ${current}/${total} - ${message}`);
      setProgress({ current, total, message });
    };

    console.log("🧮 Calling evaluateProject()...");

    // ✅ APPEL CORRIGÉ AVEC TOUS LES PARAMÈTRES
    const evaluationResult = await evaluateProject(
      guidelines,        // ✅ TOUS les guidelines (auto + manual)
      owner,
      repo,
      userAnswers,       // ✅ Réponses manuelles
      progressCallback   // ✅ Callback pour la progression
    );

    console.log("✅ Evaluation completed:", evaluationResult);

    setProgress({ current: 100, total: 100, message: "Complete!" });

    // ✅ ENVOI CORRECT DES 3 PARAMÈTRES À Results
    onEvaluate(
      { owner, repo, url: repoUrl },  // Repository info
      evaluationResult,                // Evaluation results
      userAnswers                      // User answers
    );

  } catch (err) {
    console.error("❌ Error evaluating repo:", err);
    alert(`❌ Error: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  // ========== ÉCRAN DE SÉLECTION ==========
  if (isFirstEvaluation === null) {
    return (
      <div className="evaluation-start">
        <h2>Is this your first evaluation?</h2>
        <p className="subtitle">
          First-time users will answer <strong>{manualCriteria.length} manual questions</strong>.
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

  // ========== ÉCRAN D'UPLOAD ==========
  if (!isFirstEvaluation) {
    return (
      <div className="file-upload-section">
        <h2>Upload Your Previous Evaluation</h2>
        <p className="subtitle">
          We'll re-run <strong>{autoCriteria.length} automatic tests</strong> only.
          <br />
          Your <strong>{manualCriteria.length} manual answers</strong> will be preserved.
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
          Answer <strong>{manualCriteria.length} manual criteria</strong> about your project.
          <br />
          <strong>{autoCriteria.length} automatic checks</strong> will run when you submit.
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

      {/* ✅ AFFICHER UNIQUEMENT LES CRITÈRES MANUELS */}
      <GroupedManualCriteriaBoard
        guidelines={manualCriteria}
        userAnswers={userAnswers}
        setUserAnswers={setUserAnswers}
      />

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>📊 Progress:</strong> {Object.keys(userAnswers).length} / {manualCriteria.length} manual criteria answered
        </p>
      </div>

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
