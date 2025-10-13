import './Results.css';

/**
 * Results.jsx
 * Displays the evaluation summary after the user submits a repository.
 * Shows repository name, validated level, and a table of level scores.
 */
function Results({ repoData, evaluationResult, targetLevel }) {
  return (
    <div className="results-page">
      <h1>Evaluation Results</h1>

      {/* Basic repository information */}
      <p><strong>Repository:</strong> {repoData.full_name}</p>

      {/* Display validated level */}
      <p><strong>Validated Level:</strong> {evaluationResult.validatedLevel}</p>

      {/* Score table for each level */}
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(evaluationResult.levelScores).map(([level, info]) => (
            <tr key={level}>
              <td>{level}</td>
              <td>{Math.round(info.ratio * 100)}%</td>
              <td>{info.validated ? '✅' : '❌'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Results;
