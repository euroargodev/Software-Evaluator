// Single manual criterion card with yes/no toggle and optional evidence input.
import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import "./ManualCriterion.css";

export default function ManualCriterion({ criterion, answer, onChange }) {
  const [evidence, setEvidence] = useState(answer?.evidence || "");
  const isMet = useMemo(() => answer?.status === "met", [answer]);

  useEffect(() => {
    setEvidence(answer?.evidence || "");
  }, [answer]);

  const handleStatusChange = (newStatus) => {
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
    <div className="manual-criterion">
      <div className="mc-header">
        <div>
          <h4 className="mc-title">{criterion.title}</h4>
          {criterion.description && <p className="mc-info">{criterion.description}</p>}
        </div>
        <span className={`level-badge ${criterion.level.toLowerCase()}`}>
          {criterion.level}
        </span>
      </div>

      <div className="mc-controls">
        <button
          type="button"
          className={`mc-btn mc-unmet ${!isMet ? "active" : ""}`}
          onClick={() => handleStatusChange(false)}
        >
          <span className="mc-icon unmet" />
          No
        </button>
        <button
          type="button"
          className={`mc-btn mc-met ${isMet ? "active" : ""}`}
          onClick={() => handleStatusChange(true)}
        >
          <span className="mc-icon met" />
          Yes
        </button>
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
