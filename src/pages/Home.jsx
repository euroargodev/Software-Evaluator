import Form from "../components/Form";
import "./Home.css";

function Home({ onEvaluate, setTargetLevel, isFirstEvaluation, setIsFirstEvaluation }) {
  return (
    <div className="home-page">
      <h1>Repository Evaluation</h1>
      <p>Enter your GitHub repository and answer a few quick questions.</p>

      <Form 
        onEvaluate={onEvaluate} 
        setTargetLevel={setTargetLevel}
        isFirstEvaluation={isFirstEvaluation}
        setIsFirstEvaluation={setIsFirstEvaluation}  
      />
    </div>
  );
}

export default Home;
