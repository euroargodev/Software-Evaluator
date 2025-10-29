// src/App.jsx
import { useState } from "react";
import Home from "./pages/Home";
import Results from "./pages/Results";
import "./App.css";

function App() {
  const [repository, setRepository] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [view, setView] = useState("home"); // "home" or "results"

  const handleEvaluate = (repo, result, answers = {}) => {
    setRepository(repo);
    setEvaluationResult(result);
    setUserAnswers(answers);
    setView("results");
  };

  const handleGoBack = () => {
    setView("home");
  };

  return (
    <div className="app-container">
      {view === "home" && <Home onEvaluate={handleEvaluate} />}
      
      {view === "results" && (
        <Results
          repository={repository}
          evaluationResult={evaluationResult}
          userAnswers={userAnswers}
          onGoBack={handleGoBack}
        />
      )}
    </div>
  );
}

export default App;
