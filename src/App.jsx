import { useState } from 'react';
import Home from './pages/Home';
import Results from './pages/Results';
import TargetLevelSelect from './components/TargetLevelSelect';
import './App.css';

/**
 * App component
 * -------------
 * Handles navigation between the Home and Results pages
 * and keeps track of evaluation data.
 */
function App() {
  const [repoData, setRepoData] = useState(null);
  const [notes, setNotes] = useState('');
  const [view, setView] = useState('home');
  const [targetLevel, setTargetLevel] = useState('');

  // Callback passed to Form (through Home)
  const handleEvaluation = (data, userNotes) => {
    setRepoData(data);
    setNotes(userNotes);
    setView('results');
  };

  return (
    <div className="App">
      {view === 'home' && <Home onEvaluate={handleEvaluation} />}
      {view === 'results' && <Results repoData={repoData} notes={notes} />}
    
      <div>
      	<TargetLevelSelect onLevelChange={setTargetLevel} />
      	<p>Selected level: {targetLevel}</p>
      </div>
    </div>
  );
}

export default App;
