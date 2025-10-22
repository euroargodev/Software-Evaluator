// src/logic/githubClient.js
import { Octokit } from "https://esm.sh/octokit";

let octokitInstance = null;

export function getGitHubClient() {
  if (!octokitInstance) {
    const token = import.meta.env.VITE_GH_DEPLOY_TOKEN;
    if (!token) throw new Error("Missing GitHub token in environment variables.");
    octokitInstance = new Octokit({ auth: token });
    console.log("✅ Octokit client initialized");
  }
  return octokitInstance;
}
