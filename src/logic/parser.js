// src/logic/parser.js
export function parseManualAnswers(formData) {
  const result = {};
  Object.entries(formData).forEach(([id, value]) => {
    result[id] = value === true || value === "true";
  });
  return result;
}
