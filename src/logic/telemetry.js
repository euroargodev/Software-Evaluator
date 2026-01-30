export function trackEvent(type, payload = {}) {
  if (typeof window === "undefined") return;
  const td = window.td || window.telemetryDeck;
  if (td && typeof td.signal === "function") {
    try {
      td.signal(type, payload);
    } catch (error) {
      console.warn("TelemetryDeck signal failed:", error);
    }
  }
}
