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

  const scopeEntries = useMemo(() => {
    const scopes = {};
    if (details && typeof details === "object") {
      Object.entries(details).forEach(([id, criterion]) => {
        if (!criterion) return;
        const scope = criterion.group || "General";
        const level = criterion.level || "Unknown";
        if (!scopes[scope]) scopes[scope] = {};
        if (!scopes[scope][level]) scopes[scope][level] = [];
        scopes[scope][level].push({ id: Number(id), ...criterion });
      });
    }

    const levelOrder = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
    const scopeOrder = ["Argo specific", "General"];

    return Object.entries(scopes)
      .map(([scope, levels]) => {
        const levelEntries = Object.entries(levels)
          .map(([level, items]) => [
            level,
            items.sort((a, b) => (a.id || 0) - (b.id || 0)),
          ])
          .sort(
            (a, b) => levelOrder.indexOf(a[0]) - levelOrder.indexOf(b[0])
          );
        return [scope, levelEntries];
      })
      .sort(([a], [b]) => {
        const aIndex = scopeOrder.indexOf(a);
        const bIndex = scopeOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
  }, [details]);

  const [expandedCategories, setExpandedCategories] = useState({});
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [badgeCopyStatus, setBadgeCopyStatus] = useState("");

  useEffect(() => {
    setExpandedCategories((prev) => {
      const next = {};
      scopeEntries.forEach(([scope]) => {
        next[scope] = prev[scope] ?? false;
      });
      return next;
    });
  }, [scopeEntries]);

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
  const autoCount = Number.isFinite(stats?.autoCriteria) ? stats.autoCriteria : null;
  const manualCount = Number.isFinite(stats?.manualCriteria) ? stats.manualCriteria : null;
  const levelOrder = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
  const scoreValue = Number.isFinite(globalScore) ? globalScore : 0;
  const scorePercent = Number.isFinite(globalScore)
    ? (globalScore * 100).toFixed(1)
    : "0.0";
  const progressTier =
    scoreValue >= 0.8 ? "high" : scoreValue >= 0.6 ? "mid" : "low";
  const scoreTier =
    globalScore >= 0.8 ? "high" : globalScore >= 0.6 ? "mid" : "low";
  const scoreNote =
    scoreTier === "high"
      ? "Great job - strong alignment with the selected scope."
      : scoreTier === "mid"
        ? "Good progress - a few key wins can lift your level."
        : "Solid start - focus on the most impactful criteria first.";
  const progressBadgeColor =
    progressTier === "high" ? "16a34a" : progressTier === "mid" ? "f59e0b" : "dc2626";

  const badgeLogoUrl =
    "https://raw.githubusercontent.com/euroargodev/Software-Evaluator/main/public/badges/euroargo-logo.svg";
  const makeShieldUrl = (label, message, color, options = {}) => {
    const params = new URLSearchParams({
      style: "flat",
      ...(options.logo ? { logo: options.logo } : {}),
      ...(options.logoWidth ? { logoWidth: String(options.logoWidth) } : {}),
      ...(options.labelColor ? { labelColor: options.labelColor } : {})
    });
    return `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color}?${params.toString()}`;
  };

  const progressLabel = targetLevel ? `Target ${targetLevel}` : "Progress";
  const progressBadgeUrl = makeShieldUrl(
    progressLabel,
    `${scorePercent}% complete`,
    progressBadgeColor,
    {
      logo: badgeLogoUrl,
      logoWidth: 14
    }
  );
  const badgeMarkdown = `![${progressLabel}: ${scorePercent}% complete](${progressBadgeUrl})`;

  const nextWins = Object.values(details || {})
    .filter((criterion) => criterion?.status === "unmet")
    .sort((a, b) => {
      const levelDelta =
        levelOrder.indexOf(a.level || "Novice") - levelOrder.indexOf(b.level || "Novice");
      if (levelDelta !== 0) return levelDelta;
      return (a.id || 0) - (b.id || 0);
    })
    .slice(0, 3);

  const handleCopyBadges = async () => {
    try {
      await navigator.clipboard.writeText(badgeMarkdown);
      setBadgeCopyStatus("Badge snippet copied.");
      setTimeout(() => setBadgeCopyStatus(""), 2500);
    } catch (error) {
      console.error("Failed to copy badge snippet:", error);
      setBadgeCopyStatus("Copy failed. Use the image URL instead.");
      setTimeout(() => setBadgeCopyStatus(""), 3000);
    }
  };

  const downloadBadge = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download badge:", error);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

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
          <p className={`score-note ${scoreTier}`}>
            {scoreNote} You met {stats.metCriteria} of {stats.totalCriteria} criteria.
          </p>
          <div className="score-explain">
            <button
              type="button"
              className="score-explain-btn"
              onClick={() => setShowScoreDetails((prev) => !prev)}
              aria-expanded={showScoreDetails}
            >
              Understand my score
              <span className="score-explain-icon">{showScoreDetails ? "-" : "+"}</span>
            </button>
            {showScoreDetails && (
              <div className="score-explain-panel">
                <p>
                  The score reflects the share of criteria met within the evaluated scope
                  {autoCount !== null && manualCount !== null
                    ? ` (${stats.totalCriteria} criteria: ${autoCount} auto, ${manualCount} manual).`
                    : ` (${stats.totalCriteria} criteria).`}
                </p>
                <ul>
                  <li>The scope depends on the chosen target level.</li>
                  <li>
                    The displayed level is capped by the target level (if you choose "Beginner",
                    you cannot reach "Intermediate").
                  </li>
                  <li>Higher-level criteria carry more weight in the final score.</li>
                  <li>Auto checks can fail if GitHub rate limits the API.</li>
                </ul>
              </div>
            )}
          </div>
          <p className="text-xl text-gray-700 mb-2">{badge.message}</p>
          <p className="text-gray-600 italic">{badge.description}</p>
          <div className="badge-chips">
            <span className={`badge-pill badge-progress ${progressTier}`}>
              {progressLabel}: {scorePercent}% complete
            </span>
          </div>
          <div className="badge-downloads">
            <div className="badge-downloads-header">
              <span>Badge for your README</span>
              <span className="badge-downloads-note">Copy or download as SVG</span>
            </div>
            <div className="badge-preview">
              <img src={progressBadgeUrl} alt={`${progressLabel} ${scorePercent}% complete`} />
            </div>
            <div className="badge-actions">
              <button type="button" className="btn-tertiary" onClick={handleCopyBadges}>
                Copy Markdown
              </button>
              <button
                type="button"
                className="btn-tertiary"
                onClick={() =>
                  downloadBadge(
                    progressBadgeUrl,
                    `${repository.owner}_${repository.repo}_progress_badge.svg`
                  )
                }
              >
                Download Badge
              </button>
            </div>
            {badgeCopyStatus && (
              <div className="badge-copy-status">{badgeCopyStatus}</div>
            )}
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

        <section className="next-wins">
          <div className="next-wins-header">
            <h3>Next wins</h3>
            <span className="next-wins-subtitle">Quick improvements with the biggest impact</span>
          </div>
          {nextWins.length > 0 ? (
            <ul className="next-wins-list">
              {nextWins.map((criterion) => (
                <li key={criterion.id} className="next-wins-item">
                  <span className="next-wins-title">{criterion.title}</span>
                  <span className="next-wins-meta">
                    {criterion.type === "auto" ? "Auto" : "Manual"} · {criterion.level}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="next-wins-empty">
              All criteria are met. Great job!
            </div>
          )}
        </section>

      <section className="criteria-section">
        <h2 className="section-title">See which criteria are met</h2>
        <div className="criteria-grid">
        {scopeEntries.map(([scope, levelEntries]) => {
          const flatItems = levelEntries.flatMap(([, items]) => items);
          const metCount = flatItems.filter((criterion) => criterion.status === "met").length;
          const unmetCount = flatItems.length - metCount;
          const scopeTone =
            metCount > unmetCount ? "positive" : metCount < unmetCount ? "negative" : "neutral";

          const progress = flatItems.length > 0 ? Math.round((metCount / flatItems.length) * 100) : 0;
          return (
          <div key={scope} className="category-group">
            <button
              type="button"
              className={`category-header ${scopeTone} ${expandedCategories[scope] ? "open" : ""}`}
              onClick={() => toggleCategory(scope)}
            >
              <div className="category-title">
                <span>{scope}</span>
                <span className="category-count">
                  {metCount}/{flatItems.length} met
                </span>
                <div className={`category-progress ${scopeTone}`} aria-hidden="true">
                  <div
                    className="category-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="toggle-icon" aria-hidden="true">
                {expandedCategories[scope] ? "−" : "+"}
              </span>
            </button>
            {expandedCategories[scope] && (
              <div className="level-groups">
                {levelEntries.map(([level, items]) => {
                  const levelMet = items.filter((criterion) => criterion.status === "met").length;
                  const levelUnmet = items.length - levelMet;
                  const levelTone =
                    levelMet > levelUnmet ? "positive" : levelMet < levelUnmet ? "negative" : "neutral";
                  return (
                    <div key={`${scope}-${level}`} className={`level-group ${levelTone}`}>
                      <div className="level-header">
                        <span className="level-title">{level}</span>
                        <span className="level-count">{levelMet}/{items.length} met</span>
                      </div>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
        })}
        </div>
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
