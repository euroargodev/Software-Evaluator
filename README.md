# EuroArgoDev Software Evaluator

## Overview

**EuroArgoDev Software Evaluator** is a web-based tool designed to **evaluate software repositories** according to the **EuroArgoDev software_guidelines**.
The application analyzes a public GitHub repository, assigns a **maturity badge**, and provides **suggestions for improvement** based on standardized criteria.

---

## Goals

* Automatically check the compliance of a software repository with **EuroArgodev software guidelines**
* Assign a **maturity badge** (e.g., *Beginner*, *Intermediate*, *Advanced*)
* Suggest **improvements** to reach your desired level
* Make the tool **easily accessible** via **GitHub Pages**

---

## Key Features

*  **Automated Evaluation**: Fetches repository data via the GitHub API (Octokit)
*  **Scoring System**: Evaluates based on predefined criteria
*  **Maturity Levels**: Displays a badge representing the repository’s current level
*  **Target Level Selection**: Lets users choose the level they want to achieve
*  **Actionable Feedback**: Highlights strengths and improvement areas

---

## Tech Stack

| Layer                  | Technology                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| **Frontend Framework** | [React](https://react.dev)                                                |
| **Build Tool**         | [Vite](https://vitejs.dev)                                                |
| **API Integration**    | [Octokit](https://github.com/octokit/octokit.js) (GitHub REST API client) |
| **Styling**            | Vanilla CSS (with modular component styles)                               |
| **Hosting**            | [GitHub Pages](https://pages.github.com)                                  |
| **Version Control**    | Git & GitHub                                                              |

---

## Getting Started

###  Clone the repository

```bash
git clone https://github.com/euroargodev/Software-Evaluator.git
cd Software-Evaluator
```

###  Install dependencies

```bash
npm install
```

###  Run the development server

```bash
npm run dev
```

Then open your browser at **[http://localhost:5173/](http://localhost:5173/)**

###  Build for production

```bash
npm run build
```

###  Deploy to GitHub Pages

Deployment is handled automatically through **GitHub Actions** (`.github/workflows/deploy.yml`).

---

## Environment Variables

You’ll need a **GitHub Personal Access Token (PAT)** to authenticate API requests.

Create a `.env` file in the project root:

```
VITE_GH_DEPLOY_TOKEN=your_personal_access_token_here
```

Then make sure the same secret exists in your GitHub repository settings under
`Settings → Secrets and variables → Actions → New repository secret`.

---

## Project Structure

```
software-evaluator/
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── public
│   └── vite.svg
├── README.md
├── src
│   ├── App.css
│   ├── App.jsx
│   ├── assets
│   │   └── react.svg
│   ├── components
│   │   ├── critères_software_guidelines
│   │   ├── Form.css
│   │   ├── Form.jsx
│   │   ├── GroupedManualCriteriaBoard.css
│   │   ├── GroupedManualCriteriaBoard.jsx
│   │   ├── ManualCriterion.css
│   │   ├── ManualCriterion.jsx
│   │   └── TargetLevelSelect.jsx
│   ├── data
│   │   ├── guidelines.json
│   │   ├── guidelines_v2.json
│   │   ├── miniGuidelines.json
│   │   └── scripts
│   │       └── generateNewGuidelines.js
│   ├── img
│   │   ├── EAONE_2.png
│   │   ├── EAONE.png
│   │   └── scientists.png
│   ├── index.css
│   ├── logic
│   │   ├── evaluation.js
│   │   ├── githubClient.js
│   │   ├── github.js
│   │   └── githubTests.js
│   ├── main.jsx
│   ├── pages
│   │   ├── Home.css
│   │   ├── Home.jsx
│   │   ├── Results.css
│   │   └── Results.jsx
│   └── styles
│       ├── global.css
│       ├── theme.css
│       └── variables.css
├── structure.txt
└── vite.config.js
```

---

## How It Works

1. **User inputs a GitHub repository URL**
2. **Form component** calls the GitHub API via **Octokit**
3. The app retrieves repository metadata (README, LICENSE, contributors, etc.)
4. **Evaluation logic** (in `evaluation.js`) checks against the `guidelines.json` criteria
5. A **score** and **maturity level** are generated
6. Results are displayed on the **Results page**
7. User can compare their current level to their **target level** (selected earlier)

---

## Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to change.

---

## License

...
---

## Live Demo

 [**Software Evaluator on GitHub Pages**](https://euroargodev.github.io/Software-Evaluator/)
