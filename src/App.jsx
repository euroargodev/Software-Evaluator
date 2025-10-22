import { useState } from "react";
import Home from "./pages/Home";
import Results from "./pages/Results";
import "./App.css";

/**
 * App.jsx
 * ------------------------
 * Main entry of the application.
 * Controls navigation between:
 *  - EvaluationStart (first question)
 *  - Home (evaluation form)
 *  - Results (summary and badge)
 */
function App() {
  const [repoData, setRepoData] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [view, setView] = useState("home");
  const [targetLevel, setTargetLevel] = useState("");
  const [isFirstEvaluation, setIsFirstEvaluation] = useState(null);


  // Callback: called when the user submits the evaluation form
  const handleEvaluation = (data, result) => {
    console.log("✅ handleEvaluation called:", { data, result });
    setRepoData(data);
    if (result instanceof Promise) {
      console.warn("⚠️ result is still a Promise!");
    } else {
      console.log("✅ result is a plain object");
    }
    setEvaluationResult(result)
    setView("results");
  };

  const goBackToHome = () => {
  setView("home");
};

  return (
    <div className="app-container">
      
      {view === "home" && 
        <Home 
          onEvaluate={handleEvaluation} 
          setTargetLevel={setTargetLevel}
          repoData={repoData}
          evaluationResult={evaluationResult}
          isFirstEvaluation={isFirstEvaluation}
          setIsFirstEvaluation={setIsFirstEvaluation}
        />}

      {view === "results" && (
        <Results
          repoData={repoData}
          evaluationResult={evaluationResult}
          onGoBack={goBackToHome}
        />
      )}
    </div>
  );
}

export default App;
