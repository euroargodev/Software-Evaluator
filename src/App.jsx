import { useState } from "react";
import { Octokit } from "https://esm.sh/octokit"; // ✅ Import depuis CDN compatible navigateur
import "./App.css";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [badge, setBadge] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [repoData, setRepoData] = useState(null);

  // Fonction pour extraire "owner" et "repo" à partir de l’URL
  const parseGitHubUrl = (url) => {
    try {
      const parts = url.split("github.com/")[1].split("/");
      return { owner: parts[0], repo: parts[1] };
    } catch {
      return { owner: null, repo: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { owner, repo } = parseGitHubUrl(repoUrl);
    if (!owner || !repo) {
      alert("URL invalide. Exemple : https://github.com/user/repo");
      return;
    }

    setBadge("⏳ Fetching repository data...");
    setSuggestions("");

    try {
      const octokit = new Octokit({
        auth: import.meta.env.VITE_GH_DEPLOY_TOKEN // ✅ Token GitHub injecté via workflow
      });

      // Exemple : obtenir les infos du dépôt
      const { data } = await octokit.rest.repos.get({ owner, repo });
      setRepoData(data);

      setBadge(`✅ Repository found: ${data.full_name}`);
      setSuggestions(`⭐ Stars: ${data.stargazers_count} | 🍴 Forks: ${data.forks_count}`);
    } catch (error) {
      console.error(error);
      setBadge("❌ Error fetching repository data.");
      setSuggestions(error.message);
    }
  };

  return (
    <div className="container">
      <h1>🔍 Software Evaluator</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="repoUrl">GitHub Repository URL:</label>
        <input
          type="url"
          id="repoUrl"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          required
        />

        <label htmlFor="notes">Notes:</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows="4"
          placeholder="Additional comments..."
        ></textarea>

        <button type="submit">Evaluate</button>
      </form>

      <div id="results">
        <p id="badge">{badge}</p>
        <p id="suggestions">{suggestions}</p>

        {repoData && (
          <div className="repo-info">
            <h2>{repoData.name}</h2>
            <p>{repoData.description}</p>
            <p>👤 Owner: {repoData.owner.login}</p>
            <p>📦 Default branch: {repoData.default_branch}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

