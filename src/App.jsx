import { useState } from "react";
import Home from "./pages/Home";
import Results from "./pages/Results";
import { Octokit } from "https://esm.sh/octokit";
import "./App.css";

// - fetchRepoData(octokit, owner, repo) -> returns repo metadata object
// - evaluateRepo(repoData) -> returns { badge, suggestions } (scoring logic)
import { fetchRepoData } from "./logic/github.js";
import { evaluateRepo } from "./logic/evaluation.js";

function App() {
  // UI state
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Result state
  const [repoData, setRepoData] = useState(null);
  const [badge, setBadge] = useState("");
  const [suggestions, setSuggestions] = useState("");

  /**
   * Build an Octokit instance using the token injected at build time.
   * If no token is present, Octokit will be unauthenticated (public requests,
   * but subject to lower rate limits).
   *
   * IMPORTANT: token comes from import.meta.env.VITE_GH_DEPLOY_TOKEN,
   * which must be created locally (.env) for dev, and injected by CI for production.
   */
  const makeOctokit = () => {
    const token = import.meta.env.VITE_GH_DEPLOY_TOKEN || undefined;
    return new Octokit({ auth: token });
  };

  /**
   * Called by the form component (via Home -> Form).
   * - owner, repo: strings extracted from the repository URL
   * - notes: optional free text provided by the user
   *
   * This function:
   * 1) creates Octokit using the env token (if present)
   * 2) delegates data fetching to fetchRepoData()
   * 3) delegates scoring to evaluateRepo()
   * 4) stores results in state for Results.jsx to render
   */
  const handleEvaluate = async (owner, repo, notes) => {
    setShowResults(true);
    setLoading(true);
    setErrorMessage("");
    setRepoData(null);
    setBadge("");
    setSuggestions("");

    try {
      const octokit = makeOctokit();

      // fetch repository metadata and optionally other files (README/license)
      const data = await fetchRepoData(octokit, owner, repo);
      setRepoData(data);

      // delegate scoring to the evaluation module
      // evaluateRepo should return an object like: { badge: "Gold", suggestions: "..." }
      const evaluation = await evaluateRepo(data);
      // attach optional user notes to suggestions
      const finalSuggestions = notes ? `${evaluation.suggestions}\n\nUser notes:\n${notes}` : evaluation.suggestions;

      setBadge(evaluation.badge);
      setSuggestions(finalSuggestions);
    } catch (err) {
      console.error("handleEvaluate error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred");
      setBadge("Error");
      setSuggestions(err?.message || "Unable to evaluate repository");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // keep things simple: go back to home and clear results
    setShowResults(false);
    setRepoData(null);
    setBadge("");
    setSuggestions("");
    setErrorMessage("");
  };

  return (
    <div className="app-container">
      {showResults ? (
        <Results
          badge={badge}
          suggestions={suggestions}
          repoData={repoData}
          onBack={handleBack}
          loading={loading}
          errorMessage={errorMessage}
        />
      ) : (
        <Home onEvaluate={handleEvaluate} />
      )}
    </div>
  );
}

export default App;

