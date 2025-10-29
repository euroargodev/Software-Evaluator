// src/pages/Results.jsx
import { useState } from "react";
import "./Results.css";

function Results({ repository, evaluationResult, userAnswers, onGoBack }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!evaluationResult) {
    return (
      <div className="results-container">
        <h2>No evaluation data available</h2>
        <button onClick={onGoBack} className="back-btn">
          Back
        </button>
      </div>
    );
  }

  const { validatedLevel, globalScore, details, feedback, stats } = evaluationResult;

  /**
   * Get badge styling and information
   */
  const getBadgeDetails = (level, score) => {
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

  const badge = getBadgeDetails(validatedLevel, globalScore);

  /**
   * Generate downloadable evaluation file
   */
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

  /**
   * Group criteria by category for display
   */
  const criteriaByCategory = {};
  Object.entries(details).forEach(([id, criterion]) => {
    const category = criterion.category || "General";
    if (!criteriaByCategory[category]) {
      criteriaByCategory[category] = [];
    }
    criteriaByCategory[category].push({ id, ...criterion });
  });

  return (
    <div className="results-container max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Evaluation Results
        </h1>
        <p className="text-gray-600">
          {repository.owner}/{repository.repo}
        </p>
      </div>

      {/* Badge Section */}
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

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="stat-card bg-green-50 p-4 rounded-lg text-center border border-green-200">
          <div className="text-3xl font-bold text-green-600">
            {stats?.metCriteria || 0}
          </div>
          <div className="text-gray-600">Criteria Met</div>
        </div>
        <div className="stat-card bg-red-50 p-4 rounded-lg text-center border border-red-200">
          <div className="text-3xl font-bold text-red-600">
            {stats?.unmetCriteria || 0}
          </div>
          <div className="text-gray-600">To Improve</div>
        </div>
        <div className="stat-card bg-blue-50 p-4 rounded-lg text-center border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">
            {stats?.totalCriteria || 0}
          </div>
          <div className="text-gray-600">Total Criteria</div>
        </div>
      </div>

      {/* Feedback Section */}
      {feedback && feedback.length > 0 && (
        <section className="feedback-section mb-8">
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <span className="mr-2">💡</span>
            Improvement Roadmap
          </h3>
          {feedback.map((f, i) => (
            <div
              key={i}
              className={`feedback-card p-4 mb-4 rounded-lg border-l-4 ${
                f.priority === "high"
                  ? "bg-red-50 border-red-400"
                  : f.priority === "info"
                  ? "bg-blue-50 border-blue-400"
                  : "bg-yellow-50 border-yellow-400"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <p className="font-bold text-lg">{f.message}</p>
                {f.priority === "high" && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    PRIORITY
                  </span>
                )}
              </div>
              
              {f.missing && f.missing.length > 0 && (
                <ul className="list-none ml-0 space-y-2">
                  {f.missing.map((m, j) => (
                    <li
                      key={j}
                      className={`pl-4 py-2 rounded ${
                        m.isBlocker ? "bg-white border-l-2 border-red-400" : "opacity-75"
                      }`}
                    >
                      <span className={`font-semibold ${m.isBlocker ? "text-red-600" : "text-gray-600"}`}>
                        [{m.level}]
                      </span>{" "}
                      {m.title}
                      {m.isBlocker && (
                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                          Critical for next level
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Detailed Results (Collapsible) */}
      <section className="details-section mb-8">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full bg-gray-100 hover:bg-gray-200 p-4 rounded-lg font-semibold text-left flex justify-between items-center transition"
        >
          <span>📊 Detailed Criteria Results</span>
          <span>{showDetails ? "▲" : "▼"}</span>
        </button>

        {showDetails && (
          <div className="mt-4 space-y-6">
            {Object.entries(criteriaByCategory).map(([category, criteria]) => (
              <div key={category} className="category-group">
                <h4 className="text-xl font-bold mb-3 text-gray-700 border-b-2 pb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  {criteria.map((crit) => (
                    <div
                      key={crit.id}
                      className={`criterion-item p-3 rounded-lg border ${
                        crit.status === "met"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span
                            className={`inline-block w-3 h-3 rounded-full mr-2 ${
                              crit.status === "met" ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></span>
                          <span className="font-medium">{crit.title}</span>
                          <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                            {crit.level}
                          </span>
                        </div>
                        <span
                          className={`font-bold ${
                            crit.status === "met" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {crit.status === "met" ? "✓ Met" : "✗ Unmet"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
        >
          <span>💾</span>
          Download Evaluation File
        </button>
        <button
          onClick={onGoBack}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
        >
          ← Back to Home
        </button>
      </div>

      {/* File Upload Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>💡 Pro Tip:</strong> Save this evaluation file! You can upload it on your next visit 
          to skip answering manual questions again. We'll only re-run the automatic tests.
        </p>
      </div>
    </div>
  );
}

export default Results;
