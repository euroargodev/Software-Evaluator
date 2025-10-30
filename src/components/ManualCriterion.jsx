// src/components/ManualCriterion.jsx
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./ManualCriterion.css";

export default function ManualCriterion({ criterion, answer, onChange }) {
  const [isMet, setIsMet] = useState(answer?.status === "met");
  const [evidence, setEvidence] = useState(answer?.evidence || "");

  useEffect(() => {
    setIsMet(answer?.status === "met");
    setEvidence(answer?.evidence || "");
  }, [answer]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value === "yes";
    setIsMet(newStatus);
    onChange({
      status: newStatus ? "met" : "unmet",
      evidence: newStatus ? evidence : "",
    });
  };

  const handleEvidenceChange = (e) => {
    const newEvidence = e.target.value;
    setEvidence(newEvidence);
    onChange({
      status: "met",
      evidence: newEvidence,
    });
  };

  return (
    <div className="manual-criterion-card">
      <div className="mc-header">
        <h4>{criterion.title}</h4>
        <span className={`level-badge ${criterion.level.toLowerCase()}`}>
          {criterion.level}
        </span>
      </div>

      <div className="mc-body">
        <label>
          Does your project meet this criterion?
          <select value={isMet ? "yes" : "no"} onChange={handleStatusChange}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      </div>

      {isMet && (
        <div className="mc-evidence">
          <label>
            Evidence (URL or short explanation) <span className="required">*</span>
            <input
              type="text"
              placeholder="https://example.com or short note"
              value={evidence}
              onChange={handleEvidenceChange}
              required
            />
          </label>
        </div>
      )}
    </div>
  );
}

ManualCriterion.propTypes = {
  criterion: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    level: PropTypes.string.isRequired,
    category: PropTypes.string,
  }).isRequired,
  answer: PropTypes.shape({
    status: PropTypes.string,
    evidence: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

ManualCriterion.defaultProps = {
  answer: {},
};
