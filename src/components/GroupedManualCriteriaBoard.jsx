import React from "react";
import ManualCriterion from "./ManualCriterion";
import "./GroupedManualCriteriaBoard.css";

/**
 * Affiche les critères manuels sous forme de cartes regroupées par thème,
 * disposées en grille 3x3 (layout responsive).
 */
export default function GroupedManualCriteriaBoard({ guidelines = [], userAnswers = {}, setUserAnswers }) {
  const manualCriteria = guidelines.filter((c) => c.type === "manual");

  const grouped = manualCriteria.reduce((acc, crit) => {
    const category = crit.category || "General";
    if (!acc[category]) acc[category] = [];
    acc[category].push(crit);
    return acc;
  }, {});

  const handleChange = (id, answerObj) => {
    setUserAnswers((prev) => ({
      ...prev,
      [id]: {
        status: (answerObj?.status || "unmet").toLowerCase(),
        evidence: answerObj?.evidence || "",
      },
    }));
  };

  return (
    <div className="criteria-grid-container">
      {Object.entries(grouped).map(([category, criteria]) => (
        <div className="criteria-card" key={category}>
          <div className="criteria-header">
            <h3>{category}</h3>
            <span className="criteria-count">{criteria.length}</span>
          </div>

          <div className="criteria-content">
            {criteria.map((crit) => (
              <ManualCriterion
                key={crit.id}
                id={crit.id}
                title={crit.question || crit.title}
                info={crit.info || ""}
                value={userAnswers[crit.id]}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
