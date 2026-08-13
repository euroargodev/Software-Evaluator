// src/components/TargetLevelSelect.jsx
import PropTypes from "prop-types";

// Dropdown letting users cap the level they want to be evaluated against.
function TargetLevelSelect({ targetLevel, maxLevel, onChange, disabled }) {
  const levels = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];

  return (
    <div className="target-level-select">
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
    </div>
  );
}

TargetLevelSelect.propTypes = {
  targetLevel: PropTypes.string.isRequired,
  maxLevel: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

TargetLevelSelect.defaultProps = {
  disabled: false,
  maxLevel: 5,
};

export default TargetLevelSelect;