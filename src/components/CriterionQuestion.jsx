import { useState } from "react";
import "./CriterionQuestion.css";

/**
 * CriterionQuestion component
 * ----------------------------
 * Displays a single criterion with four answer options:
 *  - Met ✅
 *  - Unmet ❌
 *  - N/A ⚪ (not applicable)
 *  - ? ❓ (uncertain)
 *
 * If the user selects "Met", they must provide an evidence (URL or description).
 */
export default function CriterionQuestion({ id, title, info, onAnswerChange }) {
  const [answer, setAnswer] = useState("");
  const [evidence, setEvidence] = useState("");

  // Handle change of radio selection
  const handleChange = (value) => {
    setAnswer(value);

    // If "Met" → evidence required
    if (value !== "Met") {
      setEvidence(""); // reset if not needed
      onAnswerChange(id, value, "");
    } else {
      onAnswerChange(id, value, evidence);
    }
  };

  // Handle evidence field change
  const handleEvidenceChange = (e) => {
    const value = e.target.value;
    setEvidence(value);
    onAnswerChange(id, answer, value);
  };

  // Evidence is mandatory only if "Met" is selected
  const isEvidenceRequired = answer === "Met";

  return (
    <div className="criterion-question">
      <h4>{title}</h4>
      {info && <p className="criterion-info">{info}</p>}

      <div className="criterion-options">
        {["Met", "Unmet", "N/A", "?"].map((opt) => (
          <label key={opt}>
            <input
              type="radio"
              name={id}
              value={opt}
              checked={answer === opt}
              onChange={() => handleChange(opt)}
              required
            />
            {opt}
          </label>
        ))}
      </div>

      {isEvidenceRequired && (
        <div className="evidence-section">
          <label>
            🔗 Please provide evidence (URL or description):
            <input
              type="text"
              placeholder="https://example.com/doc or explanation"
              value={evidence}
              onChange={handleEvidenceChange}
              required={isEvidenceRequired}
            />
          </label>
        </div>
      )}
    </div>
  );
}
