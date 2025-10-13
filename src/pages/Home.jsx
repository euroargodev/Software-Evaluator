import { useState } from "react";
import Form from "../components/Form";
import { evaluateLevels } from "../logic/evaluation";
import guidelines from "../data/guidelines.json";
import "./Home.css";

/**
 * Home.jsx
 * This component is the main page of the app.
 * It displays the evaluation form and processes the results.
 */
function Home({ onEvaluate }) {
  // Store user's answers to questions (manual input)
  const [userAnswers, setUserAnswers] = useState({});

  /**
   * Called when the form is submitted.
   * Receives:
   * - repoData: GitHub data fetched in Form.jsx
   * - userInputAnswers: answers to manual questions
   */
  const handleFormSubmit = async (repoData, userInputAnswers) => {
    try {
      // Merge GitHub info + user answers
      const allAnswers = { ...userAnswers, ...userInputAnswers };

      // Evaluate levels using guidelines + answers
      const result = evaluateLevels(guidelines, allAnswers);

      // Send everything back to App.jsx
      onEvaluate(repoData, result);
    } catch (error) {
      console.error("Error during evaluation:", error);
      alert("Failed to complete evaluation.");
    }
  };

  return (
    <div className="home-page">
      <h1>Repository Evaluation</h1>
      <p>Enter your GitHub repository and answer a few quick questions.</p>

      {/* Form handles GitHub input + manual questions */}
      <Form onEvaluate={handleFormSubmit} />
    </div>
  );
}

export default Home;
