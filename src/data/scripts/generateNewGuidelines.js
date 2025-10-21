// src/data/scripts/generateNewGuidelines.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, "../guidelines.json");
const newGuidelinesPath = path.resolve(__dirname, "../newGuidelines.json");
const manualPath = path.resolve(__dirname, "../manualQuestions.json");
const autoMapPath = path.resolve(__dirname, "../autoCheckMap.js");

// Liste des critères vérifiables automatiquement
const autoIds = [
  8, 10, 11, 29, 32, 34, 35, 36, 37, 38, 39,
  41, 42, 49, 50, 55, 59, 15, 17
];

function generateNewGuidelines() {
  if (!fs.existsSync(inputPath)) {
    console.error("❌ guidelines.json not found at:", inputPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, "utf-8");
  const guidelines = JSON.parse(raw);

  // Adapté à la structure typique du fichier guidelines.json
  const nodes = guidelines.data?.node?.items?.nodes || [];

  const simplified = nodes.map((item, i) => {
    const fields = Object.fromEntries(
      item.fieldValues.nodes.map(fv => [fv.field?.name || "unknown", fv.text || fv.name])
    );

    const id = i;
    return {
      id,
      title: fields["Title"] || "Untitled",
      level: fields["Skill level"] || "Unknown",
      "Software Development Model (SDM)": fields["Software Development Model (SDM)"] || "",
      scope: fields["Scope"] || "",
      "SDM requirement level": fields["SDM requirement level"] || "",
      FAIR4RS: fields["FAIR4RS"] || "",
      "Argo FAIR tools": fields["Argo FAIR tools"] || "",
      "Project Aspects": fields["Project Aspects"] || "",
      type: autoIds.includes(id) ? "auto" : "manual"
    };
  });

  // Écriture du fichier principal
  fs.writeFileSync(newGuidelinesPath, JSON.stringify(simplified, null, 2), "utf-8");

  // Génération de manualQuestions.json
  const manualQuestions = simplified
    .filter(item => item.type === "manual")
    .map(item => ({
      id: item.id,
      title: item.title,
      level: item.level,
      category: item["Project Aspects"],
      SDM: item["Software Development Model (SDM)"]
    }));
  fs.writeFileSync(manualPath, JSON.stringify(manualQuestions, null, 2), "utf-8");

  // Génération de autoCheckMap.js
  const autoChecks = simplified
    .filter(item => item.type === "auto")
    .map(item => ({
      id: item.id,
      title: item.title,
      check: `${item.id}`
    }));

  const autoJsContent = `// Auto-generated file — DO NOT EDIT MANUALLY
export const autoCheckMap = {
${autoChecks.map(c => `  ${c.id}: { title: "${c.title}", check: "${c.check}" }`).join(",\n")}
};`;

  fs.writeFileSync(autoMapPath, autoJsContent, "utf-8");

  // Résumé console
  const autoCount = simplified.filter(c => c.type === "auto").length;
  const manualCount = simplified.length - autoCount;

  console.log(" newGuidelines.json generated successfully!");
  console.log(` Total: ${simplified.length}`);
  console.log(`   - Auto: ${autoCount}`);
  console.log(`   - Manual: ${manualCount}`);
  console.log(` manualQuestions.json and autoCheckMap.js created.`);
}

generateNewGuidelines();
