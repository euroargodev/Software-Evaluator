// src/components/GroupedManualCriteriaBoard.jsx
// Accordion that groups manual criteria by category and lets users answer them.
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import ManualCriterion from "./ManualCriterion";
import "./GroupedManualCriteriaBoard.css";

export default function GroupedManualCriteriaBoard({ guidelines = [], userAnswers = {}, setUserAnswers }) {
  const manualCriteria = useMemo(
    () => guidelines.filter((c) => c.type === "manual"),
    [guidelines]
  );

  const grouped = useMemo(
    () =>
      manualCriteria.reduce((acc, crit) => {
        const group = crit.group || "Other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(crit);
        return acc;
      }, {}),
    [manualCriteria]
  );

  const [expandedGroups, setExpandedGroups] = useState({});

  // Keep accordion state aligned to available groups
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next = {};
      Object.keys(grouped).forEach((group) => {
        next[group] = prev[group] ?? false; // collapsed by default
      });
      return next;
    });
  }, [grouped]);

  const handleChange = (id, answerObj) => {
    setUserAnswers((prev) => ({
      ...prev,
      [id]: {
        status: (answerObj?.status || "unmet").toLowerCase(),
        evidence: answerObj?.evidence || "",
      },
    }));
  };

  const metCount = Object.values(userAnswers).filter((a) => a?.status === "met").length;
  const totalCount = manualCriteria.length;
  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="grouped-manual-board">
      <div className="manual-header">
        <h2>Manual Criteria</h2>
        <span className="progress-badge">
          {metCount} marked yes / {totalCount} total
        </span>
      </div>
      <p className="instructions">
        Please answer the following questions about your project. 
        Evidence is required for "Yes" answers.
      </p>

      {Object.entries(grouped).map(([group, criteria]) => (
        <div key={group} className="category-group">
          <button
            type="button"
            className={`category-header ${expandedGroups[group] ? "open" : ""}`}
            onClick={() => toggleGroup(group)}
          >
            <div className="category-title">
              <span>{group}</span>
              <span className="category-count">{criteria.length} items</span>
            </div>
            <span className="toggle-icon" aria-hidden="true">
              {expandedGroups[group] ? "−" : "+"}
            </span>
          </button>

          {expandedGroups[group] && (
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
          )}
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
