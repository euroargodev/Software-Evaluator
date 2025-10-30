// src/logic/githubClient.js
import { Octokit } from "octokit";

let octokitInstance = null;
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize or get GitHub client
 */
export function getGitHubClient() {
  if (!octokitInstance) {
    const token = import.meta.env.VITE_GH_DEPLOY_TOKEN;
    
    octokitInstance = new Octokit({
      auth: token,
      userAgent: 'EuroArgo-Software-Evaluator/1.0',
      throttle: {
        onRateLimit: (retryAfter, options) => {
          console.warn(`Rate limit hit. Retrying after ${retryAfter} seconds`);
          return true;
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          console.warn(`Secondary rate limit hit. Retrying after ${retryAfter} seconds`);
          return true;
        }
      }
    });

    if (!token) {
      console.warn(
        "⚠️ No GitHub token found. API requests will be limited to 60/hour.\n" +
        "Set VITE_GITHUB_TOKEN in your .env file for 5000 requests/hour."
      );
    } else {
      console.log("✅ GitHub client initialized with token");
    }
  }

  return octokitInstance;
}

/**
 * Get cached API data
 */
export function getCachedData(key) {
  const cached = apiCache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    apiCache.delete(key);
    return null;
  }

  console.log(`♻️ Using cached data for: ${key}`);
  return cached.data;
}

/**
 * Set cached API data
 */
export function setCachedData(key, data) {
  apiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear API cache
 */
export function clearCache() {
  apiCache.clear();
  console.log("🗑️ API cache cleared");
}

/**
 * Check GitHub API rate limit
 */
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
