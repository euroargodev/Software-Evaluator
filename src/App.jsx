import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Results from "./pages/Results";
import { Octokit } from "https://esm.sh/octokit";
import "./App.css";

/**
 * App component
 * ----------------------------------------------------------
 * - Manages authentication and API access (Octokit)
 * - Handles evaluation logic and navigation between pages
 * - Displays either Home or Results depending on state
 */
function App() {
  // ---------- STATE ----------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [badge, setBadge] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [repoData, setRepoData] = useState(null);

  // ---------- AUTHENTICATION ----------
  /**
   * Loads GitHub token from localStorage (if exists)
   * and verifies the user identity.
   */
  useEffect(() => {
    const savedToken = localStorage.getItem("gh_token");
    if (savedToken) {
      verifyToken(savedToken);
    }
  }, []);

  /** Verify token validity and fetch user profile */
  const verifyToken = async (authToken) => {
    try {
      const octokit = new Octokit({ auth: authToken });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      setIsAuthenticated(true);
      setUser(user);
      setToken(authToken);
    } catch (err) {
      console.error("Invalid token:", err);
      logout();
    }
  };

  /** Handle login / logout actions */
  const handleLogin = async (action) => {
    if (action === "logout") {
      logout();
      return;
    }

    // For demo purposes: ask user to paste a PAT manually.
    // In production → replace this with OAuth login redirect.
    const enteredToken = prompt(
      "Enter your GitHub Personal Access Token (classic) to authenticate:"
    );
    if (!enteredToken) return;
    await verifyToken(enteredToken);
    localStorage.setItem("gh_token", enteredToken);
  };

  /** Clear authentication state */
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    localStorage.removeItem("gh_token");
  };

  // ---------- GITHUB EVALUATION ----------
  /** Called when user submits the evaluation form */
  const handleEvaluate = async (owner, repo, notes) => {
    setBadge("⏳ Fetching repository data...");
    setSuggestions("");
    setRepoData(null);
    setShowResults(true);

    try {
      const octokit = new Octokit({ auth: token || undefined });

      // Fetch repository metadata from GitHub REST API
      const { data } = await octokit.rest.repos.get({ owner, repo });
      setRepoData(data);

      // Example scoring logic (simplified)
      let score = 0;
      if (data.license) score += 1;
      if (data.has_wiki) score += 1;
      if (data.has_issues) score += 1;
      if (data.default_branch) score += 1;

      const computedBadge = score >= 3 ? "Gold" : score >= 2 ? "Silver" : "Bronze";
      setBadge(computedBadge);
      setSuggestions(
        `Score: ${score}/4 — ${notes || "No notes provided."}`
      );
    } catch (err) {
      console.error("Evaluation error:", err);
      setBadge("❌ Error");
      setSuggestions(
        err.message || "An error occurred while fetching repository data."
      );
    }
  };

  /** Go back to home screen */
  const handleBack = () => {
    setShowResults(false);
    setRepoData(null);
    setBadge("");
    setSuggestions("");
  };

  // ---------- RENDER ----------
  return (
    <div className="app-container">
      {showResults ? (
        <Results
          badge={badge}
          suggestions={suggestions}
          repoData={repoData}
          onBack={handleBack}
        />
      ) : (
        <Home
          onEvaluate={handleEvaluate}
          onLogin={handleLogin}
          isAuthenticated={isAuthenticated}
          user={user}
        />
      )}
    </div>
  );
}

export default App;

