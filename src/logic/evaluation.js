export function evaluateLevels(guidelines, autoChecks, userAnswers) {
  const combined = { ...autoChecks, ...userAnswers };
  const levelScores = {};
  const itemsArray = guidelines?.data?.node?.items?.nodes || [];

  itemsArray.forEach(item => {
    const levelField = item.fieldValues.nodes.find(fv => fv.field?.name === 'Skill level');
    const level = levelField ? levelField.name : 'Unknown';
    const criteria = item.fieldValues.nodes.filter(fv => fv.field?.name === '');

    const totalPoints = criteria.reduce((sum, c) => sum + (c.weight || 1), 0);
    const earnedPoints = criteria.reduce(
      (sum, c) => sum + (combined[c.id] ? (c.weight || 1) : 0),
      0
    );

    const ratio = earnedPoints / (totalPoints || 1);

    levelScores[level] = {
      totalPoints,
      earnedPoints,
      ratio,
      validated: ratio >= 2 / 3,
      missing: criteria.filter(c => !combined[c.id]),
    };
  });

  const validatedLevel = Object.entries(levelScores)
    .reverse()
    .find(([_, v]) => v.validated)?.[0] || "Beginner";

  return { levelScores, validatedLevel };
}
