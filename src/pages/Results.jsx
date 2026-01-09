// Results screen that renders evaluation summary, stats, and grouped criteria.
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import logo_1 from "../img/logo_euroargo_square.png"; 
import logo_2 from "../img/EAONE_2.png"; 
import "./Results.css";

function Results({ repository, evaluationResult, userAnswers, onGoBack }) {
  // Guard against direct navigation without data
  if (!evaluationResult || !repository) {
    return (
      <div className="results-container">
        <h2>No evaluation data available</h2>
        <button onClick={onGoBack} className="back-btn">
          Back
        </button>
      </div>
    );
  }

  // Safe destructuring with defaults
  const {
    validatedLevel = "Novice",
    achievedLevel = "Novice",
    globalScore = 0,
    details = {},
    stats = { metCriteria: 0, unmetCriteria: 0, totalCriteria: 0, targetLevel: null },
    feedback = []
  } = evaluationResult;

  const rateLimitErrors = Object.values(details || {}).filter(
    (item) => item?.error && /rate limit/i.test(item.error)
  );

  const categoryEntries = useMemo(() => {
    const groups = {};
    if (details && typeof details === "object") {
      Object.entries(details).forEach(([id, criterion]) => {
        if (!criterion) return;
        const category = criterion.category || "General";
        if (!groups[category]) groups[category] = [];
        groups[category].push({ id: Number(id), ...criterion });
      });
    }

    return Object.entries(groups)
      .map(([category, items]) => [
        category,
        items.sort((a, b) => (a.id || 0) - (b.id || 0)),
      ])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [details]);

  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    setExpandedCategories((prev) => {
      const next = {};
      categoryEntries.forEach(([category]) => {
        next[category] = prev[category] ?? false;
      });
      return next;
    });
  }, [categoryEntries]);

  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const getBadgeDetails = (level) => {
    const badges = {
      Expert: {
        emoji: "🏆",
        color: "#FFD700",
        bgColor: "#FFF9E6",
        message: "Outstanding! Production-ready software",
        description: "Your project exemplifies software engineering excellence"
      },
      Advanced: {
        emoji: "🥇",
        color: "#C0C0C0",
        bgColor: "#F5F5F5",
        message: "Great work! Almost perfect",
        description: "Your project follows most best practices"
      },
      Intermediate: {
        emoji: "🥈",
        color: "#CD7F32",
        bgColor: "#FFF4E6",
        message: "Good foundation, keep improving",
        description: "You're on the right track"
      },
      Beginner: {
        emoji: "🥉",
        color: "#0a6b83",
        bgColor: "#e8f1f5",
        message: "On the right track",
        description: "Keep building on this foundation"
      },
      Novice: {
        emoji: "🌱",
        color: "#95A5A6",
        bgColor: "#F0F0F0",
        message: "Starting out, lots of potential",
        description: "Every expert was once a beginner"
      }
    };

    return badges[level] || badges.Novice;
  };

  const badge = getBadgeDetails(validatedLevel);
  const targetLevel = repository?.targetLevel || stats?.targetLevel;

  const handleDownload = () => {
    const evaluationFile = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: "1.0",
        tool: "EuroArgo Software Evaluator"
      },
      repository: {
        owner: repository.owner,
        repo: repository.repo,
        url: repository.url || `https://github.com/${repository.owner}/${repository.repo}`
      },
      evaluation: {
        level: validatedLevel,
        achievedLevel,
        score: globalScore,
        stats: stats,
        evaluatedAt: new Date().toISOString()
      },
      details: details,
      userAnswers: userAnswers || {},
      feedback: feedback || []
    };

    const blob = new Blob([JSON.stringify(evaluationFile, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${repository.owner}_${repository.repo}_evaluation_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ Evaluation file downloaded");
  };

  return (
    <div className="results-page">
      {/* Header with Euro-Argo branding */}
      <header className="results-header">
        <div className="header-title">
          <img src={logo_1} alt="Euro-Argo Logo" className="header-logo" />
          <h1>Evaluation Results</h1>
        </div>
        <p className="repo-name">
          {repository.owner}/{repository.repo}
        </p>
      </header>

      {/* Main content */}
      <main className="results-container max-w-5xl mx-auto p-6">
        {rateLimitErrors.length > 0 && (
          <div className="rate-limit-banner">
            Some automatic checks could not run due to GitHub API rate limits. Try again later.
          </div>
        )}
        {/* Badge */}
        <div
          className="badge-card p-8 rounded-2xl shadow-lg mb-8 text-center"
          style={{
            backgroundColor: badge.bgColor,
            borderLeft: `6px solid ${badge.color}`
          }}
        >
          <div className="text-6xl mb-4">{badge.emoji}</div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: badge.color }}>
            {validatedLevel} Level
          </h2>
          <div className="text-5xl font-bold mb-2 text-gray-800">
            {(globalScore * 100).toFixed(1)}%
          </div>
          <p className="text-xl text-gray-700 mb-2">{badge.message}</p>
          <p className="text-gray-600 italic">{badge.description}</p>
          <div className="mt-3 flex justify-center gap-3 flex-wrap text-sm">
            {targetLevel && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                🎯 Target: {targetLevel}
              </span>
            )}
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              📈 Achieved (raw): {achievedLevel}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="stat-card bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <div className="text-3xl font-bold text-green-600">
              {stats.metCriteria}
            </div>
            <div className="text-gray-600">Criteria Met</div>
          </div>
          <div className="stat-card bg-red-50 p-4 rounded-lg text-center border border-red-200">
            <div className="text-3xl font-bold text-red-600">
              {stats.unmetCriteria}
            </div>
            <div className="text-gray-600">To Improve</div>
          </div>
          <div className="stat-card bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalCriteria}
            </div>
            <div className="text-gray-600">Total Criteria</div>
          </div>
        </div>

      <section className="criteria-section">
        <h2 className="section-title">See which criteria are met</h2>
        {categoryEntries.map(([category, items]) => (
          <div key={category} className="category-group">
            <button
              type="button"
              className={`category-header ${expandedCategories[category] ? "open" : ""}`}
              onClick={() => toggleCategory(category)}
            >
              <div className="category-title">
                <span>{category}</span>
                <span className="category-count">{items.length} items</span>
              </div>
              <span className="toggle-icon" aria-hidden="true">
                {expandedCategories[category] ? "−" : "+"}
              </span>
            </button>
            {expandedCategories[category] && (
              <div className="criteria-list">
                {items.map((criterion) => (
                  <div
                    key={criterion.id}
                    className={`criteria-item ${criterion.status === "met" ? "met" : "unmet"}`}
                  >
                    <span
                      className={`status-indicator ${
                        criterion.status === "met" ? "validated" : "missing"
                      }`}
                    >
                      {criterion.status === "met" ? "Validated" : "Missing"}
                    </span>
                    <div className="criteria-text">
                      <span className="criterion-title">{criterion.title}</span>
                      {criterion.evidence && criterion.evidence.length > 0 && (
                        <span className="criteria-evidence">
                          Evidence: {Array.isArray(criterion.evidence) ? criterion.evidence.join(", ") : criterion.evidence}
                        </span>
                      )}
                    </div>
                    <span className="criteria-meta">
                      {criterion.type === "auto" ? "Auto" : "Manual"} · {criterion.level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* BUTTONS */}
      <div className="action-buttons">
        <button onClick={handleDownload} className="btn-primary">
          Download Evaluation Report
        </button>
        <button onClick={onGoBack} className="btn-secondary">
          Return to Form
        </button>
      </div>

        {/* PRO TIP */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Pro Tip:</strong> Save this evaluation file! You can upload it on your next visit 
            to skip answering manual questions again. We'll only re-run the automatic tests.
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="results-footer">
        <div className="footer-funding">
          <p className="footer-project">
            This repository is developed within the framework of the Euro-Argo ONE project.
          </p>
          <p className="footer-grant">
            This project has received funding from the European Union's Horizon 2020 research and innovation programme under project no <strong>101188133</strong>.
          </p>
          <p className="footer-call">
            Call <em>HORIZON-INFRA-2024-DEV-03</em>: Developing, consolidating and optimising the European research infrastructures landscape, maintaining global leadership.
          </p>
        </div>

        <img src={logo_2} alt="Euro-Argo Logo" className="footer-logo" />
        
        <div className="footer-links">
          <a href="https://www.euro-argo.eu" target="_blank" rel="noopener noreferrer">
            Euro-Argo Website
          </a>
          <span>|</span>
          <a href="https://github.com/euroargodev" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </footer>

    </div>
  );
}

Results.propTypes = {
  repository: PropTypes.shape({
    owner: PropTypes.string.isRequired,
    repo: PropTypes.string.isRequired,
    url: PropTypes.string,
  }).isRequired,
  evaluationResult: PropTypes.shape({
    validatedLevel: PropTypes.string,
    globalScore: PropTypes.number,
    details: PropTypes.object,
    feedback: PropTypes.array,
    stats: PropTypes.object,
  }),
  userAnswers: PropTypes.object,
  onGoBack: PropTypes.func.isRequired,
};

Results.defaultProps = {
  evaluationResult: null,
  userAnswers: {},
};

export default Results;
