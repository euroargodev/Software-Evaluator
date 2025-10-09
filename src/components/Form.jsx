import { useState } from 'react';
import { Octokit } from "https://esm.sh/octokit";
import TargetLevelSelect from './TargetLevelSelect';
import './Form.css';
import guidelines from '../data/guidelines.json';
import { evaluateLevels } from '../utils/evaluation';
import { checkRepoFeatures } from '../utils/github';

function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLevel, setTargetLevel] = useState('');
  const [userAnswers, setUserAnswers] = useState({});
  const [evaluationResult, setEvaluationResult] = useState(null);

  const handleCheckbox = (id) => {
    setUserAnswers(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const match = repoUrl.split("github.com/")[1]?.split("/");
      if (!match) throw new Error('Invalid repository URL');

      const owner = match[0];
      const repo = match[1];
      const octokit = new Octokit({
        auth: import.meta.env.VITE_GH_DEPLOY_TOKEN
      });

      // Récupération des infos GitHub
      const repoData = await octokit.rest.repos.get({ owner, repo });
      const autoChecks = await checkRepoFeatures(owner, repo, octokit);

      // Évaluation complète
      const result = evaluateLevels(guidelines, autoChecks, userAnswers);
      setEvaluationResult(result);

      // Envoi au parent (si besoin)
      onEvaluate(repoData.data, notes);
    } catch (error) {
      console.error('Error fetching repo:', error);
      alert('Failed to fetch repository data.');
    } finally {
      setLoading(false);
    }
  };

  // Petites questions simulées pour le moment
  const mockQuestions = [
    { id: 'doc', text: 'The project has clear documentation.' },
    { id: 'tests', text: 'Automated tests are provided.' },
    { id: 'ci', text: 'Continuous Integration (CI) is configured.' },
  ];

  return (
    <form className="evaluation-form" onSubmit={handleSubmit}>
      <label htmlFor="repoUrl">GitHub Repository URL:</label>
      <input
        type="url"
        id="repoUrl"
        placeholder="https://github.com/user/project"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        required
      />

      <TargetLevelSelect onLevelChange={setTargetLevel} />

      <h3>Checklist</h3>
      {mockQuestions.map(q => (
        <label key={q.id}>
          <input
            type="checkbox"
            checked={!!userAnswers[q.id]}
            onChange={() => handleCheckbox(q.id)}
          />
          {q.text}
        </label>
      ))}

      <label htmlFor="notes">Notes or comments:</label>
      <textarea
        id="notes"
        rows="4"
        placeholder="Add additional information..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Evaluating...' : 'Evaluate'}
      </button>

      {evaluationResult && (
        <div className="results">
          <h4>Validated Level: {evaluationResult.validatedLevel}</h4>
          <pre>{JSON.stringify(evaluationResult.levelScores, null, 2)}</pre>
        </div>
      )}
    </form>
  );
}

export default Form;
