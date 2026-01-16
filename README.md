# EuroArgoDev Software Evaluator

## Overview

EuroArgoDev Software Evaluator is a web-based tool that checks a public GitHub repository against the EuroArgo software guidelines. It combines manual answers with automated GitHub API checks to assign a maturity level and suggest improvements.

## Goals

- Check compliance with EuroArgoDev software guidelines
- Assign a maturity badge (Novice, Beginner, Intermediate, Advanced, Expert)
- Provide actionable feedback to reach a chosen target level
- Keep the tool easy to run locally and hostable on GitHub Pages

## Key Features

- Manual and automatic criteria sourced from `src/data/guidelines_v2.json`
- Target level selection filters criteria and caps the displayed maturity
- Grouped manual questions with evidence fields
- Automatic checks via GitHub REST API (Octokit)
- Progress indicator during auto tests
- Downloadable evaluation report (JSON) and re-upload flow that reuses manual answers

## Tech Stack

| Layer                  | Technology                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| Frontend Framework     | [React](https://react.dev)                                                |
| Build Tool             | [Vite](https://vitejs.dev)                                                |
| API Integration        | [Octokit](https://github.com/octokit/octokit.js) (GitHub REST API client) |
| Styling                | Vanilla CSS (per-component styles + shared variables)                     |
| Hosting                | GitHub Pages                                                              |
| Version Control        | Git & GitHub                                                              |

## Getting Started

Clone and install:

```bash
git clone https://github.com/euroargodev/Software-Evaluator.git
cd Software-Evaluator
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Environment Variables

Automatic checks call the GitHub API. Without a token you are limited to low rate limits; set a personal access token for smoother runs.

Create `.env` at the project root:

```
VITE_GH_DEPLOY_TOKEN=your_personal_access_token_here
```

Also add the same secret to GitHub Actions if you deploy from CI (`Settings → Secrets and variables → Actions`).

## Project Structure (key files)

```
src/
├── App.jsx                  # View switcher (Home / Results)
├── App.css
├── components/              # Form, grouped manual board, manual cards, target selector
├── data/
│   ├── guidelines_v2.json   # Source of criteria (manual + auto)
│   └── scripts/generateNewGuidelines.js
├── logic/                   # Evaluation, GitHub client, auto tests
├── pages/                   # Home and Results pages
├── styles/                  # Global styles and color variables
└── main.jsx                 # Entry point
```

## Updating Criteria

The app reads criteria from `src/data/guidelines_v2.json`, which is generated from `src/data/guidelines.json`.
To update criteria safely, follow this workflow:

1. Update the source file:
   - Edit `src/data/guidelines.json`.
2. Regenerate the compiled file:
   - Run `node src/data/scripts/generateNewGuidelines.js`.
   - This rewrites `src/data/guidelines_v2.json`.
3. Verify auto checks:
   - Ensure auto-checkable IDs are correct in `src/data/scripts/generateNewGuidelines.js` (`autoIds` list).
   - Map any new auto criteria in `src/logic/github.js` (`githubCriterionMap`).
   - Add or update tests in `src/logic/githubTests.js` if needed.
4. Run a quick smoke test locally to confirm the results screen renders and auto checks run.

Do:
- Keep criterion IDs stable. IDs come from the order in `guidelines.json`, so reordering nodes changes IDs.
- Update mappings when IDs change or new auto criteria are added.
- Commit `guidelines_v2.json` with the updated source.

Do not:
- Edit `guidelines_v2.json` by hand.
- Reorder criteria in `guidelines.json` unless you also update IDs and mappings.
- Mark a criterion as auto if no test exists.

## How It Works

1. User selects a target level and pastes a GitHub repository URL.
2. Manual criteria (filtered by level) are answered and evidence is captured.
3. Automatic criteria run via Octokit against the repository.
4. Scores are weighted by level and combined into a maturity badge.
5. Results page shows badge, stats, grouped recommendations, and lets the user download the evaluation JSON.
6. On the next visit the user can upload the JSON to restore manual answers; only automatic checks run again.

## Contributing

Pull requests are welcome. For major changes, open an issue to discuss what you plan to add or modify.

## License

MIT (see `LICENSE`).

## Live Demo

[Software Evaluator on GitHub Pages](https://euroargodev.github.io/Software-Evaluator/)
