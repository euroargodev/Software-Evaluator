import Form from '../components/Form';
import './Home.css';

/**
 * Home page
 * ----------
 * This is the main entry page of the app, showing the evaluation form.
 */
function Home({ onEvaluate }) {
  return (
    <div className="home-page">
      <h1>Software Evaluator</h1>
      <p>Enter a public GitHub repository URL to start the evaluation.</p>
      <Form onEvaluate={onEvaluate} />
    </div>
  );
}

export default Home;
