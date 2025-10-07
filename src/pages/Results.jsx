/**
 * Results component
 * ----------------------------------------------------------
 * Displays the evaluation output:
 * - Computed badge or score
 * - Suggestions or improvement notes
 * - Basic repository metadata (if available)
 * - "Back" button to return to the form
 */
export default function Results({ badge, suggestions, repoData, onBack }) {
  return (
    <div className="results-page">
      <h2>Evaluation Results</h2>

      <div id="results">
        <p id="badge">
          <strong>Badge:</strong> {badge || "—"}
        </p>
        <p id="suggestions">
          <strong>Suggestions:</strong> {suggestions || "—"}
        </p>

        {repoData ? (
          <div className="repo-info">
            <h3>{repoData.full_name}</h3>
            <p>{repoData.description}</p>
            <p>Owner: {repoData.owner?.login}</p>
            <p>Default branch: {repoData.default_branch}</p>
            <p>
              ⭐ Stars: {repoData.stargazers_count} — 🍴 Forks: {repoData.forks_count}
            </p>
          </div>
        ) : (
          <p>No repository data available.</p>
        )}
      </div>

      <button onClick={onBack}>Back</button>
    </div>
  );
}

