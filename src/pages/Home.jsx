// Landing page that wraps the evaluation form with Euro-Argo branding.
import PropTypes from "prop-types";
import Form from "../components/Form";
import logo_1 from "../img/logo_euroargo_square.png"; 
import "./Home.css";

function Home({ onEvaluate }) {
  return (
    <div className="home-page">
      {/* Hero header with Euro-Argo logo */}
      <header className="home-header">
        <div className="header-title">
          <img src={logo_1} alt="Euro-Argo Logo" className="header-logo" />
          <h1>Software Evaluator</h1>
          <span className="beta-pill">Beta</span>
        </div>
        <p className="header-subtitle">
          Evaluate your software against Euro-Argo software development guidelines.
        </p>
        <p className="header-guidelines">
          <a
            href="https://github.com/euroargodev/software_guidelines"
            target="_blank"
            rel="noopener noreferrer"
            className="header-guidelines-link"
          >
            Click here for detailed guidelines descriptions <span className="header-link-icon">↗</span>
          </a>
        </p>
      </header>

      {/* Evaluation form */}
      <main className="home-content">
        <Form onEvaluate={onEvaluate} />
      </main>

      {/* Footer with funding info and logo */}
      <footer className="results-footer">
        <div className="footer-funding">
          <p className="footer-project">
            This repository is developed within the framework of the Euro-Argo ONE project.
          </p>
          <p className="footer-grant">
            This project has received funding from the European Union's Horizon 2020 research and innovation programme under project no <strong>101188133</strong>.
          </p>
          <p className="footer-call">
            Call <em>HORIZON-INFRA-2024-DEV-03</em>: Developing, consolidating and optimising the European research infrastructures landscape, maintaining global leadership.
          </p>
        </div>

        <div className="footer-links">
          <a href="https://www.euro-argo.eu" target="_blank" rel="noopener noreferrer">
            Euro-Argo Website
          </a>
          <span>|</span>
          <a href="https://github.com/euroargodev" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </div>
      </footer>

    </div>
  );
}

Home.propTypes = {
  onEvaluate: PropTypes.func.isRequired,
};

export default Home;
