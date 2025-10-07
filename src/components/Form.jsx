import { useState } from 'react';
import { Octokit } from "https://esm.sh/octokit";
import TargetLevelSelect from './TargetLevelSelect';
import './Form.css';

/**
 * Form component
 * ----------------
 * This component allows the user to enter a GitHub repository URL
 * and optional notes, then triggers an evaluation when submitted.
 */
function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetLevel, setTargetLevel] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Extract repository owner and name from the GitHub URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) throw new Error('Invalid repository URL');

      const owner = match[1];
      const repo = match[2];

      // GitHub authentication via environment variable
      const octokit = new Octokit({
        auth: import.meta.env.VITE_GH_DEPLOY_TOKEN
      });

      // Fetch basic repository info
      const repoData = await octokit.rest.repos.get({
        owner,
        repo
      });

      // Pass fetched data back to parent component
      onEvaluate(repoData.data, notes);
    } catch (error) {
      console.error('Error fetching repo:', error);
      alert('Failed to fetch repository data.');
    } finally {
      setLoading(false);
    }
  };

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

      <label htmlFor="notes">Notes or comments:</label>
      <textarea
        id="notes"
        rows="4"
        placeholder="Add additional information..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <TargetLevelSelect onLevelChange={setTargetLevel} />     

      <button type="submit" disabled={loading}>
        {loading ? 'Evaluating...' : 'Evaluate'}
      </button>
    </form>
  );
}

export default Form;
