/*import { useState } from "react";
import { Octokit } from "https://esm.sh/octokit";
import TargetLevelSelect from "./TargetLevelSelect";
import "./Form.css";
import miniGuidelines from "../data/miniGuidelines.json";
import CriterionQuestion from "./CriterionQuestion";
import { evaluateProject } from "../logic/evaluation";
import { checkRepoFeatures } from "../logic/github";


function Form({ onEvaluate, setTargetLevel, isFirstEvaluation, setIsFirstEvaluation }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Toggle checkbox state for manual questions
  const handleCheckbox = (id) => {
    setUserAnswers(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const match = repoUrl.split("github.com/")[1]?.split("/");
      if (!match) throw new Error("Invalid repository URL");
      const owner = match[0];
      const repo = match[1];

      const octokit = new Octokit({ auth: import.meta.env.VITE_GH_DEPLOY_TOKEN });
      const repoData = await octokit.rest.repos.get({ owner, repo });

      // Auto checks via GitHub API
      const rawAutoChecks = await checkRepoFeatures(owner, repo, octokit);
      console.log("Raw autoChecks:", rawAutoChecks);

      const normalizedAutoChecks = {};
      Object.entries(rawAutoChecks).forEach(([key, value]) => {
        normalizedAutoChecks[key] = { status: value ? "met" : "unmet" };
      });

      // Evaluate using miniGuidelines
      const result = evaluateProject(miniGuidelines, normalizedAutoChecks, userAnswers);
      setEvaluationResult(result);
      console.log("Result : ", result);

      onEvaluate({ ...repoData.data, autoChecks: normalizedAutoChecks }, result);

    } catch (error) {
      console.error("Error fetching repo:", error);
      alert("Failed to fetch repository data.");
    } finally {
      setLoading(false);
    }
  };

  if (isFirstEvaluation === null) {
    return (
      <div className="evaluation-start">
        <h2>Is it your first evaluation ?</h2>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={() => setIsFirstEvaluation(true)}>Yes</button>
          <button onClick={() => setIsFirstEvaluation(false)}>No</button>
        </div>
      </div>
    );
  }

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

      {!isFirstEvaluation && <TargetLevelSelect onLevelChange={setTargetLevel} />}

      <h3>Manual Criteria</h3>
      {miniGuidelines.filter(c => c.type === "manual").map(q => (
        <CriterionQuestion
          key={q.id}
          id={q.id}
          title={q.title}
          info={q.info || ""}
          onAnswerChange={(id, answer, evidence) =>
            setUserAnswers(prev => ({
              ...prev,
              [id]: { status: answer, evidence }
            }))
          }
        />
      ))}

      <button type="submit" disabled={loading}>
        {loading ? "Evaluating..." : "Evaluate"}
      </button>

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

export default Form;*/

import { useState } from "react";
import { Octokit } from "https://esm.sh/octokit";
import TargetLevelSelect from "./TargetLevelSelect";
import "./Form.css";
import miniGuidelines from "../data/miniGuidelines.json";
import CriterionQuestion from "./CriterionQuestion";
import { evaluateProject } from "../logic/evaluation";
import { checkRepoFeatures } from "../logic/github";

function Form({ onEvaluate, setTargetLevel, isFirstEvaluation, setIsFirstEvaluation }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const match = repoUrl.split("github.com/")[1]?.split("/");
      if (!match) throw new Error("Invalid repository URL");
      const owner = match[0];
      const repo = match[1];

      const octokit = new Octokit({ auth: import.meta.env.VITE_GH_DEPLOY_TOKEN });
      console.log("Octokit initialized:", octokit);

      const repoData = await octokit.rest.repos.get({ owner, repo });
      console.log("Repository data fetched:", repoData);

      const rawAutoChecks = await checkRepoFeatures(owner, repo, octokit);
      const normalizedAutoChecks = {};
      Object.entries(rawAutoChecks).forEach(([key, value]) => {
        normalizedAutoChecks[key] = { status: value ? "met" : "unmet" };
      });

      // Évaluation
      const result = evaluateProject(miniGuidelines, normalizedAutoChecks, userAnswers);
      setEvaluationResult(result);

      // Retourner le résultat + données GitHub
      onEvaluate({ ...repoData.data, autoChecks: normalizedAutoChecks }, result);
    } catch (err) {
      console.error("Error fetching repo:", err);
      alert("Failed to fetch repository data.");
    } finally {
      setLoading(false);
    }
  };

  if (isFirstEvaluation === null) {
    return (
      <div className="evaluation-start">
        <h2>Is it your first evaluation?</h2>
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button onClick={() => setIsFirstEvaluation(true)}>Yes</button>
          <button onClick={() => setIsFirstEvaluation(false)}>No</button>
        </div>
      </div>
    );
  }

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

      {!isFirstEvaluation && <TargetLevelSelect onLevelChange={setTargetLevel} />}

      <h3>Manual Criteria</h3>
      {miniGuidelines.filter(c => c.type === "manual").map(q => (
        <CriterionQuestion
          key={q.id}
          id={q.id}
          title={q.title}
          info={q.info || ""}
          onAnswerChange={(id, answer, evidence) =>
            setUserAnswers(prev => ({
              ...prev,
              [id]: { status: answer, evidence }
            }))
          }
        />
      ))}

      <button type="submit" disabled={loading}>
        {loading ? "Evaluating..." : "Evaluate"}
      </button>

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

