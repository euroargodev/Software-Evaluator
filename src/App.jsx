import { useState } from "react";
import Home from "./pages/Home";
import Results from "./pages/Results";
import { Octokit } from "https://esm.sh/octokit";

function App() {
  const [badge, setBadge] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleEvaluate = async (repoUrl, notes) => {
    try {
      const [_, owner, repo] = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      const octokit = new Octokit();
      const repoData = await octokit.rest.repos.get({ owner, repo });

      setBadge(`✅ ${repoData.data.full_name}`);
      setSuggestions(`Langage principal : ${repoData.data.language}`);
      setShowResults(true);
    } catch (err) {
      setBadge("❌ Erreur lors de la récupération du dépôt");
      setSuggestions(err.message);
      setShowResults(true);
    }
  };

  return (
    <div>
      {showResults ? (
        <Results badge={badge} suggestions={suggestions} />
      ) : (
        <Home onEvaluate={handleEvaluate} />
      )}
    </div>
  );
}

export default App;

