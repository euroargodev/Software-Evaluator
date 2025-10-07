import './Results.css';

/**
 * Results page
 * -------------
 * Displays repository details and evaluation summary.
 */
function Results({ repoData, notes }) {
  if (!repoData) {
    return <p>No evaluation data available yet.</p>;
  }

  return (
    <div className="results-page">
      <h2>Repository Evaluation</h2>
      <div className="repo-card">
        <h3>{repoData.full_name}</h3>
        <p>{repoData.description || 'No description available.'}</p>
        <p><strong>Stars:</strong> {repoData.stargazers_count}</p>
        <p><strong>Forks:</strong> {repoData.forks_count}</p>
        <p><strong>Open Issues:</strong> {repoData.open_issues_count}</p>
        <p><strong>Language:</strong> {repoData.language || 'N/A'}</p>
      </div>

      {notes && (
        <div className="user-notes">
          <h3>Your Notes</h3>
          <p>{notes}</p>
        </div>
      )}
    </div>
  );
}

export default Results;
