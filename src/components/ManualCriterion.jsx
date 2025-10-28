// src/components/ManualCriterion.jsx
import React, { useState, useEffect } from "react";
import "./ManualCriterion.css";

export default function ManualCriterion({ id, title, info, value = {}, onChange }) {
  const [status, setStatus] = useState(value.status || null);
  const [evidence, setEvidence] = useState(value.evidence || "");

  // Met à jour le parent uniquement quand il y a un changement
  useEffect(() => {
    if (status) {
      onChange?.(id, { status, evidence });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, evidence]);

  const handleSetStatus = (newStatus) => {
    setStatus(newStatus);
    // Réinitialiser l’évidence si on passe à Unmet
    if (newStatus === "unmet") {
      setEvidence("");
    }
  };

  const handleEvidenceChange = (e) => {
    setEvidence(e.target.value);
  };

  const isMet = status === "met";
  const isUnmet = status === "unmet";

  return (
    <div className="manual-criterion">
      <div className="mc-header">
        <div className="mc-title">{title}</div>
        {info && <div className="mc-info">{info}</div>}
      </div>

      <div className="mc-controls">
        <button
          type="button"
          className={`mc-btn mc-met ${isMet ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            handleSetStatus("met");
          }}
        >
          <span className="mc-icon met" aria-hidden="true"></span>
          Met
        </button>

        <button
          type="button"
          className={`mc-btn mc-unmet ${isUnmet ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            handleSetStatus("unmet");
          }}
        >
          <span className="mc-icon unmet" aria-hidden="true"></span>
          Unmet
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
