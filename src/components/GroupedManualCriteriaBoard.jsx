// src/components/GroupedManualCriteriaBoard.jsx
// Accordion that groups manual criteria by category and lets users answer them.
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import ManualCriterion from "./ManualCriterion";
import "./GroupedManualCriteriaBoard.css";

export default function GroupedManualCriteriaBoard({ guidelines = [], userAnswers = {}, setUserAnswers }) {
  const levelOrder = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];
  const manualCriteria = useMemo(
    () => guidelines.filter((c) => c.type === "manual"),
    [guidelines]
  );

  const grouped = useMemo(
    () =>
      manualCriteria.reduce((acc, crit) => {
        const scope = crit.group || crit.labelSecondary || "General";
        const level = crit.level || "Unknown";
        if (!acc[scope]) acc[scope] = {};
        if (!acc[scope][level]) acc[scope][level] = [];
        acc[scope][level].push(crit);
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

  const scopeOrder = ["Argo specific", "General"];
  const scopeEntries = Object.entries(grouped).sort(([a], [b]) => {
    const aIndex = scopeOrder.indexOf(a);
    const bIndex = scopeOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

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

      <div className="category-groups">
        {scopeEntries.map(([group, levels]) => {
          const allCriteria = Object.values(levels).flat();
          const metInGroup = allCriteria.filter((crit) => userAnswers[crit.id]?.status === "met").length;
          const groupTone =
            metInGroup > allCriteria.length - metInGroup
              ? "positive"
              : metInGroup < allCriteria.length - metInGroup
                ? "negative"
                : "neutral";

          return (
          <div key={group} className="category-group">
            <button
              type="button"
              className={`category-header ${groupTone} ${expandedGroups[group] ? "open" : ""}`}
              onClick={() => toggleGroup(group)}
            >
              <div className="category-title">
                <span>{group}</span>
                <span className="category-count">{metInGroup}/{allCriteria.length} met</span>
              </div>
              <span className="toggle-icon" aria-hidden="true">
                {expandedGroups[group] ? "−" : "+"}
              </span>
            </button>

            {expandedGroups[group] && (
              <div className="level-groups">
                {Object.entries(levels)
                  .sort(([a], [b]) => levelOrder.indexOf(a) - levelOrder.indexOf(b))
                  .map(([level, criteria]) => {
                    const metCount = criteria.filter(
                      (crit) => userAnswers[crit.id]?.status === "met"
                    ).length;
                    const levelTone =
                      metCount > criteria.length - metCount
                        ? "positive"
                        : metCount < criteria.length - metCount
                          ? "negative"
                          : "neutral";
                    return (
                      <div key={`${group}-${level}`} className={`level-group ${levelTone}`}>
                        <div className="level-header">
                          <span className="level-title">{level}</span>
                          <span className="level-count">{metCount}/{criteria.length} met</span>
                        </div>
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
                    );
                  })}
              </div>
            )}
          </div>
        );
        })}
      </div>
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
      labelSecondary: PropTypes.string,
    })
  ).isRequired,
  userAnswers: PropTypes.object.isRequired,
  setUserAnswers: PropTypes.func.isRequired,
};
