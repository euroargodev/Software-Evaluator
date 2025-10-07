// src/pages/Home.jsx
import Form from "../components/Form";

/**
 * Home page
 * ----------------------------------------------------------
 * - Displays the title, short description, and the form
 * - Receives `onEvaluate` from App.jsx and passes it to Form
 */
export default function Home({ onEvaluate, onLogin, isAuthenticated, user }) {
  return (
    <main className="home-page">
      <header>
        <h1>EuroArgoOne Software Evaluator</h1>
        <p>
          Enter a GitHub repository URL to evaluate it according to the
          EuroArgoOne guidelines.
        </p>

        {/* Authentication controls */}
        <div className="auth-section">
          {isAuthenticated ? (
            <>
              <p>🔒 Logged in as {user?.login}</p>
              <button onClick={() => onLogin("logout")}>Logout</button>
            </>
          ) : (
            <button onClick={() => onLogin("login")}>Sign in with GitHub</button>
          )}
        </div>
      </header>

      {/* Main form */}
      <Form onEvaluate={onEvaluate} />
    </main>
  );
}

