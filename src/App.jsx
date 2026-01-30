// Root view switcher between the Home form and Results page.
import { useEffect, useState } from "react";
import { trackEvent } from "./logic/telemetry";
import Home from "./pages/Home";
import Results from "./pages/Results";
import "./App.css";

function App() {
  const [repository, setRepository] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [view, setView] = useState("home");

  // Propagate evaluation data up from the form
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

  useEffect(() => {
    trackEvent("pageview", {
      view,
      path: `${window.location.pathname}${window.location.search}`,
    });
  }, [view]);

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
