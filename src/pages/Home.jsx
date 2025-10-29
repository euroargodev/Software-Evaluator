// src/pages/Home.jsx
import { useState } from "react";
import Form from "../components/Form";
import "./Home.css";

function Home({ onEvaluate }) {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>🌊 Software Evaluator</h1>
        <p>Evaluate your software against EuroArgo development guidelines</p>
      </header>

      <Form onEvaluate={onEvaluate} />
    </div>
  );
}

export default Home;
