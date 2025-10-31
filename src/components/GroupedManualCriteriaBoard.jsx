// src/components/GroupedManualCriteriaBoard.jsx
import React from "react";
import PropTypes from "prop-types";
import ManualCriterion from "./ManualCriterion";
import "./GroupedManualCriteriaBoard.css";

export default function GroupedManualCriteriaBoard({ guidelines = [], userAnswers = {}, setUserAnswers }) {
  // ✅ DEBUG
  console.log("📦 GroupedManualCriteriaBoard received:", guidelines.length, "guidelines");
  console.log("🎯 Levels received:", [...new Set(guidelines.map(g => g.level))]);
  console.log("📝 Types received:", [...new Set(guidelines.map(g => g.type))]);
  
  const manualCriteria = guidelines.filter((c) => c.type === "manual");
  
  console.log("✅ After manual filter:", manualCriteria.length);
  console.log("🎯 Manual levels:", [...new Set(manualCriteria.map(c => c.level))]);

  const grouped = manualCriteria.reduce((acc, crit) => {
    const group = crit.group || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(crit);
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

  // ✅ Statistiques
  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = manualCriteria.length;

  return (
    <div className="grouped-manual-board">
      <div className="manual-header">
        <h2>Manual Criteria</h2>
        <span className="progress-badge">
          {answeredCount} / {totalCount} answered
        </span>
      </div>
      <p className="instructions">
        Please answer the following questions about your project. 
        Evidence is required for "Yes" answers.
      </p>

      {Object.entries(grouped).map(([group, criteria]) => (
        <div key={group} className="category-group">
          <h3>{group}</h3>
          <div className="criteria-grid">
            {criteria.map((crit) => (
              <ManualCriterion
                key={crit.id}
                criterion={crit}
                answer={userAnswers[crit.id] || {}}
                onChange={(answerObj) => handleChange(crit.id, answerObj)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

GroupedManualCriteriaBoard.propTypes = {
  guidelines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      group: PropTypes.string,
    })
  ).isRequired,
  userAnswers: PropTypes.object.isRequired,
  setUserAnswers: PropTypes.func.isRequired,
};
