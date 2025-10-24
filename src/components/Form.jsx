import { useState } from "react";
import TargetLevelSelect from "./TargetLevelSelect";
import "./Form.css";
import guidelines from "../data/guidelines_v2.json";
import CriterionQuestion from "./CriterionQuestion";
import { evaluateProject } from "../logic/evaluation";
import { githubCriterionMap } from "../logic/github";
import { checkManualCriterion } from "../logic/githubTests";

function Form({ onEvaluate, setTargetLevel, isFirstEvaluation, setIsFirstEvaluation }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const match = repoUrl.split("github.com/")[1]?.split("/");
      if (!match) throw new Error("Invalid repository URL");
      const owner = match[0];
      const repo = match[1];

      // Prépare les critères avec fonctions
      const guidelinesWithFunctions = guidelines.map((c) => ({
        ...c,
        function:
          c.type === "auto"
            ? githubCriterionMap[c.id]
            : (crit) => checkManualCriterion(crit, userAnswers),
      }));

      // Évaluation complète
      const result = await evaluateProject(guidelinesWithFunctions, owner, repo, userAnswers);
      console.log("✅ Evaluation Result:", result);

      // Envoie directement au parent (App.jsx)
      onEvaluate({ owner, repo }, result);
    } catch (err) {
      console.error("Error evaluating repo:", err);
      alert("Failed to fetch or evaluate repository data.");
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
      {guidelines
        .filter((c) => c.type === "manual")
        .map((q) => (
          <CriterionQuestion
            key={q.id}
            id={q.id}
            title={q.title}
            info={q.info || ""}
            onAnswerChange={(id, answer, evidence) =>
              setUserAnswers((prev) => ({
                ...prev,
                [id]: { status: answer.toLowerCase(), evidence },
              }))
            }
          />
        ))}

      <button type="submit" disabled={loading}>
        {loading ? "Evaluating..." : "Evaluate"}
      </button>
    </form>
  );
}

export default Form;
