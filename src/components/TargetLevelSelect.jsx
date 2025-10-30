// src/components/TargetLevelSelect.jsx
import React from "react";
import PropTypes from "prop-types";

function TargetLevelSelect({ targetLevel, maxLevel, onChange, disabled }) {
  const levels = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];

  return (
    <div className="target-level-select">
      <label>
        Target Level <span className="optional">(optional)</span>
      </label>
      <select
        value={targetLevel}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">-- Select Target Level --</option>
        {levels.slice(0, maxLevel).map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <p className="text-sm text-gray-600 mt-1">
        Optional: Choose a target level to focus feedback on specific criteria
      </p>
    </div>
  );
}

TargetLevelSelect.propTypes = {
  targetLevel: PropTypes.string.isRequired,
  maxLevel: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

TargetLevelSelect.defaultProps = {
  disabled: false,
};

export default TargetLevelSelect;
