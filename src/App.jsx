import { useState } from 'react';
import { Octokit } from 'octokit';
import './App.css';

function App() {
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [badge, setBadge] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [repoData, setRepoData] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('URL saisie :', repoUrl);
    console.log('Notes :', notes);
  };

  return (
    <div>
      <form id="evaluation-form" onSubmit={handleSubmit}>
        <label htmlFor="repoUrl">URL du dépôt Git :</label>
        <input
          type="url"
          id="repoUrl"
          name="repoUrl"
          placeholder="https://github.com/utilisateur/projet"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          required
        />

        <label htmlFor="notes">Notes ou commentaires :</label>
        <textarea
          id="notes"
          name="notes"
          rows="4"
          placeholder="Ajoutez des informations supplémentaires..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        ></textarea>

        <button type="submit">Évaluer</button>
      </form>
    </div>
  );
}

export default App;


