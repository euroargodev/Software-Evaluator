import React from "react";
import "./Results.css";

const badgeColors = {
  Novice: "#b0b0b0",
  Beginner: "#cd7f32",
  Intermediate: "#c0c0c0",
  Advanced: "#ffd700",
  Expert: "#4b0082",
};

function Results({ repoData, evaluationResult, targetLevel, onGoBack }) {
  console.log("📦 Results props:", { repoData, evaluationResult, targetLevel });
  if (!evaluationResult)
    return <p>No results available. Please run an evaluation first.</p>;

  const {
    validatedLevel = "Novice",
    globalScore = 0,
    details = {},
    feedback = [],
  } = evaluationResult;

  const handleDownload = () => {
    const fileData = {
      repository: repoData?.name || "Unknown",
      evaluatedAt: new Date().toISOString(),
      validatedLevel,
      globalScore,
      details,
      feedback,
    };
    const blob = new Blob([JSON.stringify(fileData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${repoData?.name || "evaluation-result"}.json`;
    link.click();
  };

  return (
    <div className="results-container">
      <h2 className="text-2xl font-bold mb-4 text-center">🎯 Evaluation Results</h2>

      <div
        className="badge-box text-center p-4 rounded-lg shadow-md mb-6"
        style={{ backgroundColor: badgeColors[validatedLevel] }}
      >
        <h3 className="text-xl font-semibold text-white">
          Final Level: {validatedLevel}
        </h3>
        <p className="text-white text-sm">
          Global Score: {(globalScore * 100).toFixed(1)}%
        </p>
      </div>

      <h4 className="font-semibold text-lg mb-2">Details:</h4>

      <table className="table-auto w-full border-collapse border border-gray-300 mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">Criterion</th>
            <th className="border p-2">Level</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {evaluationResult?.details &&
            Object.entries(evaluationResult.details).map(([id, info]) => (
              <tr key={id}>
                <td className="border p-2">{id}</td>
                <td className="border p-2">{info.title}</td>
                <td className="border p-2">{info.level}</td>
                <td className="border p-2">
                  {info.status === "met" ? "✅ Met" : "❌ Unmet"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {feedback?.length > 0 && (
        <section className="feedback-section mb-6">
          <h4 className="font-semibold text-lg mb-2">
            🔍 Improvement Suggestions
          </h4>
          {feedback.map((f, i) => (
            <div
              key={i}
              className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3 rounded"
            >
              <p className="font-semibold">{f.message}</p>
              <ul className="list-disc ml-6">
                {f.missing.map((m, j) => (
                  <li key={j}>{m}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <div className="text-center">
        <button
          onClick={handleDownload}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        >
          💾 Download Evaluation File
        </button>
        <button onClick={onGoBack} className="back-btn ml-3">
          Back
        </button>
      </div>
    </div>
  );
}

export default Results;
