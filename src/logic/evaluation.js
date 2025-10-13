/**
 * evaluation
 * Calculates how well a repository meets the evaluation criteria.
 *
 * It combines:
 * - automatic checks from GitHub (autoChecks)
 * - manual answers from the user (userAnswers)
 * - the list of criteria in the JSON (guidelines)
 *
 * Returns a score per skill level (Beginner, Intermediate, etc.)
 * and identifies the highest validated level.
 */
export function evaluateLevels(guidelines, autoChecks, userAnswers) {
  // Juste pour vérifier ce que la fonction reçoit
  console.log("evaluateLevels called with:", {
    guidelineItems: guidelines?.data?.node?.items?.nodes.length,
    autoChecksKeys: Object.keys(autoChecks || {}).length,
    userAnswersKeys: Object.keys(userAnswers || {}).length,
  });

  // Combine tous les critères : automatiques + manuels
  const combined = { ...autoChecks, ...userAnswers };

  // Contiendra les résultats par niveau
  const levelScores = {};

  // Récupération de tous les "items" (critères) du JSON
  const itemsArray = guidelines?.data?.node?.items?.nodes || [];

  // Regroupe les critères selon leur "Skill level"
  const groupedByLevel = {};

  itemsArray.forEach(item => {
    const fields = item.fieldValues.nodes;

    // Trouve le niveau (Beginner, Intermediate, etc.)
    const level = fields.find(fv => fv.field?.name === 'Skill level')?.name || 'Unknown';

    // Trouve le titre du critère
    const title = fields.find(fv => fv.field?.name === 'Title')?.text || 'Untitled';

    // Chaque critère a un identifiant unique
    const id = item.id;

    // On range le critère dans le bon niveau
    if (!groupedByLevel[level]) groupedByLevel[level] = [];
    groupedByLevel[level].push({ id, title, weight: 1 }); // TODO: use real weights if available
  });

  // Calcule les scores pour chaque niveau
  Object.entries(groupedByLevel).forEach(([level, criteria]) => {
    const totalPoints = criteria.reduce((sum, c) => sum + c.weight, 0);
    const earnedPoints = criteria.reduce(
      (sum, c) => sum + (combined[c.id] ? c.weight : 0),
      0
    );

    const ratio = earnedPoints / (totalPoints || 1);

    levelScores[level] = {
      totalPoints,
      earnedPoints,
      ratio,
      validated: ratio >= 2 / 3, // seuil : 66%
      missing: criteria.filter(c => !combined[c.id]), // critères non validés
    };
  });

  // Trouve le niveau le plus élevé validé
  const validatedLevel =
    Object.entries(levelScores)
      .reverse()
      .find(([_, v]) => v.validated)?.[0] || 'Beginner';

  return { levelScores, validatedLevel };
}
