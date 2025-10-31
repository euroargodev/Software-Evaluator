// src/pages/Results.jsx
import { useState } from "react";
import PropTypes from "prop-types";
import logo_1 from "../img/logo_euroargo_square.png"; 
import logo_2 from "../img/EAONE_2.png"; 
import "./Results.css";

function Results({ repository, evaluationResult, userAnswers, onGoBack }) {
  const [showDetails, setShowDetails] = useState(false);

  // ✅ VÉRIFICATION ROBUSTE
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

  // ✅ EXTRACTION SÉCURISÉE AVEC VALEURS PAR DÉFAUT
  const {
    validatedLevel = "Novice",
    globalScore = 0,
    details = {},
    feedback = [],
    stats = { metCriteria: 0, unmetCriteria: 0, totalCriteria: 0 }
  } = evaluationResult;

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
        color: "#4A90E2",
        bgColor: "#E8F4FD",
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

  // ✅ VÉRIFICATION AVANT OBJECT.ENTRIES
  const criteriaByCategory = {};
  if (details && typeof details === 'object') {
    Object.entries(details).forEach(([id, criterion]) => {
      if (!criterion) return;
      
      const category = criterion.category || "General";
      if (!criteriaByCategory[category]) {
        criteriaByCategory[category] = [];
      }
      criteriaByCategory[category].push({ id, ...criterion });
    });
  }

  return (
    <div className="results-page">
      {/* ⭐ HEADER AVEC LOGO */}
      <header className="results-header">
        <img src={logo_1} alt="Euro-Argo Logo" className="header-logo" />
        <h1>Evaluation Results</h1>
        <p className="repo-name">
          {repository.owner}/{repository.repo}
        </p>
      </header>

      {/* CONTENU PRINCIPAL */}
      <main className="results-container max-w-5xl mx-auto p-6">
        {/* BADGE */}
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
        </div>

        {/* STATISTIQUES */}
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

      {/* RECOMMANDATIONS */}
      {feedback && feedback.length > 0 && (
        <section className="recommendations-section">
          <h2 className="section-title">Recommendations for Improvement</h2>
          
          <div className="recommendations-container">
            {feedback.map((item, idx) => (
              <div
                key={idx}
                className={`recommendation-block ${
                  item.priority === "high"
                    ? "priority-high"
                    : item.priority === "info"
                    ? "priority-info"
                    : "priority-normal"
                }`}
              >
                <h3 className="recommendation-header">{item.message}</h3>
                
                {item.missing && item.missing.length > 0 && (
                  <table className="criteria-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Criterion</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.missing.map((m) => (
                        <tr key={m.id} className={m.isBlocker ? "blocker-row" : ""}>
                          <td className="status-cell">
                            <span className={`status-indicator ${m.checked ? "validated" : "missing"}`}>
                              {m.checked ? "Validated" : "Missing"}
                            </span>
                          </td>
                          <td className="criterion-title">{m.title}</td>
                          <td className="priority-cell">
                            {m.isBlocker && !m.checked && (
                              <span className="badge-required">Required</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BOUTONS D'ACTION */}
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

      {/* ⭐ FOOTER AVEC LOGO */}
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
