import { useState } from "react";
import { Octokit } from "https://esm.sh/octokit";
import TargetLevelSelect from "./TargetLevelSelect";
import "./Form.css";
import guidelines from "../data/guidelines.json";
import manualQuestions from "../data/manualQuestions.json";
import { evaluateLevels } from "../logic/evaluation";
import { checkRepoFeatures } from "../logic/github";

/**
 * Form.jsx
 * Main form for entering GitHub repo URL and answering manual questions.
 * Handles automatic checks + manual answers and triggers evaluation.
 */
function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetLevel, setTargetLevel] = useState("");
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Toggle checkbox state for manual questions
  const handleCheckbox = (id) => {
    setUserAnswers(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Extract owner and repo name from GitHub URL
      const match = repoUrl.split("github.com/")[1]?.split("/");
      if (!match) throw new Error("Invalid repository URL");
      const owner = match[0];
      const repo = match[1];

      // GitHub authentication
      const octokit = new Octokit({ auth: import.meta.env.VITE_GH_DEPLOY_TOKEN });

      // Fetch repository info
      const repoData = await octokit.rest.repos.get({ owner, repo });

      // Check features automatically
      const autoChecks = await checkRepoFeatures(owner, repo, octokit);

      // Evaluate all criteria
      const result = evaluateLevels(guidelines, autoChecks, userAnswers);
      setEvaluationResult(result);

      // Send data to App.jsx
      onEvaluate(repoData.data, result);
    } catch (error) {
      console.error("Error fetching repo:", error);
      alert("Failed to fetch repository data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="evaluation-form" onSubmit={handleSubmit}>
      <label htmlFor="repoUrl">GitHub Repository URL:</label>
      <input
        type="url"
        id="repoUrl"
        placeholder="https://github.com/user/project"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        required
      />

      {/* Dropdown for selecting target level */}
      <TargetLevelSelect onLevelChange={setTargetLevel} />

      <h3>Manual Criteria</h3>
      {manualQuestions.map(q => (
        <label key={q.id} className="question-item">
          <input
            type="checkbox"
            checked={!!userAnswers[q.id]}
            onChange={() => handleCheckbox(q.id)}
          />
          {q.text}
        </label>
      ))}

      <button type="submit" disabled={loading}>
        {loading ? "Evaluating..." : "Evaluate"}
      </button>

      {/* Display evaluation results */}
      {evaluationResult && (
        <div className="results">
          <h3>🧭 Evaluation Results</h3>
          <p><strong>Validated Level:</strong> {evaluationResult.validatedLevel}</p>

          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(evaluationResult.levelScores).map(([level, info]) => (
                <tr key={level}>
                  <td>{level}</td>
                  <td>{Math.round(info.ratio * 100)}%</td>
                  <td>{info.validated ? "✅ Passed" : "❌ Not reached"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </form>
  );
}

export default Form;
