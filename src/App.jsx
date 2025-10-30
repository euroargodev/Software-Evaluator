// src/App.jsx
import { useState } from "react";
import Home from "./pages/Home";
import Results from "./pages/Results";
import "./App.css";

function App() {
  const [repository, setRepository] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [view, setView] = useState("home");

  // ✅ CORRECTION : 3 paramètres séparés au lieu d'un objet
  const handleEvaluate = (repo, evaluation, answers) => {
    console.log("📦 App.jsx received:", { repo, evaluation, answers });
    
    setRepository(repo);
    setEvaluationResult(evaluation);
    setUserAnswers(answers);
    setView("results");
  };

  const handleGoBack = () => {
    setView("home");
    setRepository(null);
    setEvaluationResult(null);
    setUserAnswers({});
  };

  return (
    <div className="app">
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
