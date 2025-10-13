import { useState } from 'react';
import guidelines from '../data/guidelines.json';

/**
 * TargetLevelSelect
 * Dropdown component that lets the user select their target skill level.
 * Extracts unique levels from the guidelines JSON and notifies the parent
 * component of the selection via `onLevelChange`.
 */
export default function TargetLevelSelect({ onLevelChange }) {
  // Extract all items from the JSON safely
  const itemsArray = guidelines?.data?.node?.items?.nodes || [];

  // Get unique skill levels from the JSON
  const levels = [
    ...new Set(
      itemsArray.flatMap(item =>
        item.fieldValues.nodes
          .filter(fv => fv.field?.name === 'Skill level')
          .map(fv => fv.name)
      )
    )
  ];

  const criteria = [
    ...new Set(
      itemsArray.flatMap(item =>
        item.fieldValues.nodes
          .filter(fv => fv.field?.name === 'Title')
          .map(fv => fv.text)
      )
    )
  ];
  console.log("Criteria :", criteria); 

  // React state to store the selected level
  const [selectedLevel, setSelectedLevel] = useState('');

  // When the user selects a level, update state and notify parent
  const handleChange = (event) => {
    const level = event.target.value;
    setSelectedLevel(level);
    if (onLevelChange) {
      onLevelChange(level); // Callback to App.jsx
    }
  };

  return (
    <div className="target-level-container">
      <label htmlFor="targetLevel">
        Select the target skill level you want to achieve:
      </label>
      <select
        id="targetLevel"
        value={selectedLevel}
        onChange={handleChange}
      >
        <option value="" disabled>-- Choose a level --</option>
        {levels.map((level) => (
          <option key={level} value={level}>{level}</option>
        ))}
      </select>
    </div>
  );
}
