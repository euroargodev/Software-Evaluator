import { Octokit } from "@octokit/rest";
import fs from "fs";
import dotenv from "dotenv";

import { evaluateProject } from "../src/logic/evaluation.js";

import guidelines from "../src/data/guidelines_v3.json" assert { type: "json" };

import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), "../.env")
});

const ORG = "euroargodev";
const OUTPUT_FILE = "./data.json";

const octokit = new Octokit({
  auth:
    process.env.GITHUB_TOKEN ||
    process.env.GH_DEPLOY_TOKEN ||
    process.env.VITE_GH_DEPLOY_TOKEN,
});
``

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


async function getAllRepos() {
  let page = 1;
  const per_page = 100;
  let repos = [];

  while (true) {
    const res = await octokit.rest.repos.listForOrg({
      org: ORG,
      per_page,
      page,
    });

    if (res.data.length === 0) break;

    repos = repos.concat(res.data);
    page++;
  }

  return repos;
}


async function run() {
  try {
    console.log("🔍 Fetching repositories...");

    let repos = await getAllRepos();

    console.log(`✅ ${repos.length} repositories found\n`);

    const results = [];

    for (const r of repos) {
      const owner = r.owner.login;
      const repo = r.name;

      console.log(`⚙️ Evaluating ${owner}/${repo}`);

      try {
        const evaluation = await evaluateProject(
          guidelines,        
          owner,
          repo,
          {},                
          null,              
          "Expert"           
        );

        results.push({
          repository: {
            owner,
            repo,
            url: r.html_url,
          },
          details: evaluation.details,
          stats: evaluation.stats,
        });

      } catch (err) {
        console.error(`❌ Error on ${repo}:`, err.message);
      }

      await sleep(300);
    }

    console.log("\n💾 Writing data.json...");

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));

    console.log("✅ Dashboard data generated!");

  } catch (err) {
    console.error("❌ Fatal error:", err);
  }
}

run();