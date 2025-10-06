import { Octokit } from "octokit";

const octokit = new Octokit({
auth:" ",
});
 
function parseGitHubUrl(url) {
//https://github.com/owner/repo
  try {
    // On prend ce qu’il y a après "github.com/"
    const s_url = url.split("github.com/")[1].split("/");

    if (!s_url[0] || !s_url[1]) {
      console.error("URL GitHub invalide :", url);
      return null;
    }

    const owner = s_url[0];
    // Supprime ".git" si présent
    const repo = s_url[1].replace(/\.git$/, "");

    return { owner, repo };
  } catch (e) {
    console.error("Erreur dans parseGitHubUrl :", e);
    return null;
  }
}

document.getElementById("evaluation-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const repoUrl = document.getElementById("repo-url").value;
  const notes = document.getElementById("notes").value;

  console.log("Repo URL :", repoUrl);
  console.log("Notes :", notes);

  const parsed = parseGitHubUrl(repoUrl);

  if (!parsed) {
    document.getElementById("badge").textContent = "⚠️ URL GitHub invalide.";
    document.getElementById("suggestions").textContent = "";
    document.getElementById("results").classList.remove("hidden");
    return;
  }

  document.getElementById("badge").textContent = `Owner : ${parsed.owner}`;
  document.getElementById("suggestions").textContent = `Repo : ${parsed.repo}`;

  document.getElementById("results").classList.remove("hidden");
});
