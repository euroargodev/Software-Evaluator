import { useState } from "react";

export default function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onEvaluate(repoUrl, notes);
  };

  return (
    <form id="evaluation-form" onSubmit={handleSubmit}>
      <label htmlFor="repoUrl">URL du dépôt Git :</label>
      <input
        type="url"
        id="repoUrl"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        placeholder="https://github.com/utilisateur/projet"
        required
      />

      <label htmlFor="notes">Notes ou commentaires :</label>
      <textarea
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows="4"
        placeholder="Ajoutez des informations supplémentaires..."
      ></textarea>

      <button type="submit">Évaluer</button>
    </form>
  );
}
