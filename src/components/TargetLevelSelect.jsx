import { useState } from 'react';
// On importe le JSON de guidelines
import guidelines from '../data/guidelines.json';

export default function TargetLevelSelect({ onLevelChange }) {
  // 🔍 Vérifier le JSON
  console.log('guidelines:', guidelines);

  // 1️⃣ Accéder aux nodes
  const itemsArray = guidelines?.data?.node?.items?.nodes || [];

  // 2️⃣ Extraire tous les niveaux uniques
  const levels = [
    ...new Set(
      itemsArray.flatMap(item =>
        item.fieldValues.nodes
          .filter(fv => fv.field?.name === 'Skill level')
          .map(fv => fv.name)
      )
    )
  ];

  console.log('Extracted levels:', levels); // 🔍 Vérifier les niveaux

  // 3️⃣ State React pour stocker le niveau sélectionné
  const [selectedLevel, setSelectedLevel] = useState('');

  // 4️⃣ Fonction déclenchée au changement du dropdown
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
