// src/logic/githubClient.js
import { Octokit } from "https://esm.sh/octokit";

let octokitInstance = null;
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getGitHubClient() {
  if (!octokitInstance) {
    const token = import.meta.env.VITE_GH_DEPLOY_TOKEN;
    
    if (!token) {
      throw new Error(
        "⚠️ Missing GitHub token. Please set VITE_GH_DEPLOY_TOKEN in your .env file."
      );
    }
    
    if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
      console.warn("⚠️ Token format seems incorrect. Expected ghp_ or github_pat_ prefix.");
    }
    
    octokitInstance = new Octokit({ auth: token });
    console.log("✅ Octokit client initialized");
  }
  return octokitInstance;
}

export function getCachedData(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Cache HIT: ${key}`);
    return cached.data;
  }
  return null;
}

export function setCachedData(key, data) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

export function clearCache() {
  apiCache.clear();
  console.log("🗑️ API cache cleared");
}

export async function checkRateLimit() {
  const octokit = getGitHubClient();
  try {
    const { data } = await octokit.rest.rateLimit.get();
    const remaining = data.rate.remaining;
    const reset = new Date(data.rate.reset * 1000);
    
    console.log(`🔢 GitHub API: ${remaining} requests remaining (resets at ${reset.toLocaleTimeString()})`);
    
    if (remaining < 10) {
      throw new Error(
        `⚠️ GitHub API rate limit almost exceeded. ` +
        `${remaining} requests remaining. ` +
        `Resets at ${reset.toLocaleTimeString()}`
      );
    }
    
    return { remaining, reset };
  } catch (error) {
    console.error("Failed to check rate limit:", error);
    throw error;
  }
}
