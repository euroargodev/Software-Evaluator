import Form from "../components/Form";

export default function Home({ onEvaluate }) {
  return (
    <div className="home-page">
      <h1>Software Evaluator</h1>
      <p>Évaluez rapidement un dépôt GitHub selon vos critères.</p>
      <Form onEvaluate={onEvaluate} />
    </div>
  );
}
