import { useState } from 'react';
// On importe le JSON de guidelines
import guidelines from '../data/guidelines.json';

export default function TargetLevelSelect({ onLevelChange }) {
  
  console.log('guidelines:', guidelines);

  const itemsArray = guidelines?.data?.node?.items?.nodes || [];

  const levels = [
    ...new Set(
      itemsArray.flatMap(item =>
        item.fieldValues.nodes
          .filter(fv => fv.field?.name === 'Skill level')
          .map(fv => fv.name)
      )
    )
  ];

  console.log('Extracted levels:', levels);

  const [selectedLevel, setSelectedLevel] = useState('');

  const handleChange = (event) => {
    const level = event.target.value;
    setSelectedLevel(level);
    if (onLevelChange) {
      onLevelChange(level);
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
