export default function Results({ badge, suggestions }) {
  return (
    <div className="results-page">
      <h2>Résultats de l’évaluation</h2>
      <p><strong>Badge :</strong> {badge}</p>
      <p><strong>Suggestions :</strong> {suggestions}</p>
    </div>
  );
}
