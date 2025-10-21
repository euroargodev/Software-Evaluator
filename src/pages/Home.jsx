import { useState } from "react";
import Form from "../components/Form";
import { evaluateProject } from "../logic/evaluation";
import guidelines from "../data/miniGuidelines.json";
import "./Home.css";

/**
 * Home.jsx
 * This component is the main page of the app.
 * It displays the evaluation form and processes the results.
 */
function Home({ onEvaluate, setTargetLevel, isFirstEvaluation, setIsFirstEvaluation }) {
  // Store user's answers to questions (manual input)
  const [userAnswers, setUserAnswers] = useState({});

  /**
   * Called when the form is submitted.
   * Receives:
   * - repoData: GitHub data fetched in Form.jsx (avec autoChecks déjà inclus)
   * - userInputAnswers: answers to manual questions
   */
  const handleFormSubmit = (repoData, userInputAnswers) => {
    try {
      // Combine user answers + autoChecks already computed in Form
      const result = evaluateProject(
        guidelines,
        repoData.autoChecks || {},
        userInputAnswers
      );

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

      <Form 
        onEvaluate={handleFormSubmit} 
        setTargetLevel={setTargetLevel}
        isFirstEvaluation={isFirstEvaluation}
        setIsFirstEvaluation={setIsFirstEvaluation}  
      />
    </div>
  );
}

export default Home;
