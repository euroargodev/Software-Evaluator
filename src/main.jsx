import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/variables.css';
import './index.css'
import './styles/global.css';
import App from './App.jsx'

const telemetryDeckAppId = import.meta.env.VITE_TELEMETRYDECK_APP_ID;
const telemetryDeckScript =
  import.meta.env.VITE_TELEMETRYDECK_SCRIPT_URL ||
  "https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js";

if (telemetryDeckAppId) {
  const script = document.createElement("script");
  script.defer = true;
  script.src = telemetryDeckScript;
  script.dataset.appId = telemetryDeckAppId;
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
