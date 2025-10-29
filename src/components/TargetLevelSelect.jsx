import PropTypes from "prop-types";


function TargetLevelSelect({ targetLevel, maxLevel, onChange, disabled }) {
  return (
    <div className="target-level-select">
      <label htmlFor="targetLevel">
        <strong>🎯 Target Level:</strong>
      </label>
      <p className="helper-text">
        Select the level you want to achieve (0 = evaluate all levels)
      </p>
      <select
        id="targetLevel"
        value={targetLevel}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      >
        <option value={0}>All Levels (0)</option>
        {Array.from({ length: maxLevel }, (_, i) => i + 1).map((level) => (
          <option key={level} value={level}>
            Level {level}
          </option>
        ))}
      </select>
    </div>
  );
}

TargetLevelSelect.propTypes = {
  targetLevel: PropTypes.number.isRequired,
  maxLevel: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

TargetLevelSelect.defaultProps = {
  disabled: false,
};

export default TargetLevelSelect;
