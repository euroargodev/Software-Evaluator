import { useState } from "react";
import Home from "./pages/Home";
import Results from "./pages/Results";
import "./App.css";

/**
 * App.jsx
 * Main component of the application.
 * It switches between the Home page (input form)
 * and the Results page (evaluation output).
 *
 * It also stores the repository data and the evaluation result
 * received from the form.
 */
function App() {
  // Store the GitHub repository information
  const [repoData, setRepoData] = useState(null);

  // Store the result of the evaluation (scores, level, etc.)
  const [evaluationResult, setEvaluationResult] = useState(null);

  // Control which page is visible: "home" or "results"
  const [view, setView] = useState("home");

  // Store the target level selected by the user
  const [targetLevel, setTargetLevel] = useState("");

  /**
   * Called when the user submits the form.
   * Receives:
   * - `data`: info fetched from GitHub
   * - `result`: evaluation result (calculated later)
   */
  const handleEvaluation = (data, result) => {
    setRepoData(data);
    setEvaluationResult(result);
    setView("results"); // Switch to the results page
  };

  return (
    <div className="app-container">
      {view === "home" && <Home onEvaluate={handleEvaluation} />}
      {view === "results" && (
        <Results
          repoData={repoData}
          evaluationResult={evaluationResult}
          targetLevel={targetLevel}
        />
      )}
    </div>
  );
}

export default App;
