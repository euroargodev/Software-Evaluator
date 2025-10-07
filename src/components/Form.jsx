import { useState } from "react";

/**
 * Form component
 * ----------------------------------------------------------
 * - Controlled React form (uses internal component state)
 * - User enters a GitHub repository URL (https://github.com/owner/repo)
 * - Optional notes can be added
 * - On submit → calls the `onEvaluate` function passed by the parent
 */
export default function Form({ onEvaluate }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [notes, setNotes] = useState("");

  /**
   * Extracts the `owner` and `repo` name from a GitHub URL.
   * Example: "https://github.com/octocat/Hello-World" → { owner: "octocat", repo: "Hello-World" }
   */
  const parseGitHubUrl = (url) => {
    try {
      const path = new URL(url).pathname; // returns "/owner/repo"
      const parts = path.replace(/^\/+/, "").split("/");
      if (parts.length < 2) return null;
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/, ""); // remove ".git" if present
      return { owner, repo };
    } catch {
      return null;
    }
  };

  /** Handles form submission */
  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      alert("Invalid GitHub URL. Please use a format like: https://github.com/user/repo");
      return;
    }
    // Pass data up to parent (App.jsx)
    onEvaluate(parsed.owner, parsed.repo, notes);
  };

  return (
    <form id="evaluation-form" onSubmit={handleSubmit}>
      <label htmlFor="repoUrl">GitHub Repository URL</label>
      <input
        id="repoUrl"
        type="url"
        placeholder="https://github.com/user/repo"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        required
      />

      <label htmlFor="notes">Notes (optional)</label>
      <textarea
        id="notes"
        rows="4"
        placeholder="Add any relevant information..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <button type="submit">Evaluate</button>
    </form>
  );
}

