import { useState } from 'react';
// On importe le JSON de guidelines
import guidelines from '../data/guidelines.json';

export default function TargetLevelSelect({ onLevelChange }) {
  // 🔍 Vérifier le contenu du JSON
  console.log('guidelines:', guidelines);

  // 1️⃣ Extraire tous les niveaux uniques depuis le fichier JSON
  const levels = [...new Set(guidelines.map(item => item['skill level']))];

  // 🔍 Vérifier ce qui est extrait
  console.log('levels:', levels);

  // 2️⃣ State React pour stocker le niveau sélectionné
  const [selectedLevel, setSelectedLevel] = useState('');

  // 3️⃣ Fonction déclenchée au changement du dropdown
  const handleChange = (event) => {
    const level = event.target.value;
    setSelectedLevel(level);           // mettre à jour le state local
    if (onLevelChange) {
      onLevelChange(level);           // passer le niveau au parent si besoin
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
