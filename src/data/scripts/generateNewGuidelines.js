// src/data/scripts/generateNewGuidelines.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, "../guidelines.json");
const outputPath = path.resolve(__dirname, "../guidelines_v2.json");
const overridesPath = path.resolve(__dirname, "../metadataOverrides.json");

// Critères automatiquement détectables
const autoIds = [
  4, 5,        // langage utilisé (open-source / adopté Argo)
  8,           // hébergé sur GitHub/GitLab
  9,           // dépendances (requirements.txt, setup.py, etc.)
  10, 33,      // LICENSE
  11, 32,      // README
  13,          // doc hébergée (doc site détectable ? optionnel)
  15, 16, 17,  // CI, tests, CD
  18, 52, 53,  // distribution / registre public ou Argo
  19, 51, 55,  // DOI / identifiants / CITATION
  29, 31,      // version control / hébergement Argo
  34, 35, 36, 37, 38, 39, 41, 42, // collaboration et gestion issues/PRs
  47, 49, 50, 59, // doc OS support / changelog / releases / code of conduct
  54, // respect licence Argo (à estimer heuristiquement via LICENSE)
];


//Classification par mots-clés
function classifyCriterion(title) {
  if (!title) return "General";
  const t = title.toLowerCase();
  if (t.includes("readme") || t.includes("documentation")) return "Documentation";
  if (t.includes("license") || t.includes("licence")) return "Licensing";
  if (t.includes("doi") || t.includes("identifier") || t.includes("citation")) return "FAIR Data";
  if (t.includes("community") || t.includes("contributor")) return "Community";
  if (t.includes("version") || t.includes("release")) return "Versioning";
  if (t.includes("test") || t.includes("ci") || t.includes("workflow")) return "Continuous Integration";
  if (t.includes("guideline") || t.includes("contribution")) return "Governance";
  return "General";
}

// Regroupement par thème logique
function getCriterionGroup(id) {
  if ([0, 1, 19, 21, 51, 52, 53].includes(id)) return "Metadata & Identification";
  if ([3, 11, 12, 13, 14, 47, 48, 50].includes(id)) return "Documentation";
  if ([4, 5, 6, 7, 56, 57, 58].includes(id)) return "Code Quality & Standards";
  if ([15, 16, 17].includes(id)) return "Testing & Integration";
  if ([10, 33, 55, 59].includes(id)) return "Licensing & Citation";
  if ([27, 28, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 62].includes(id))
    return "Community & Collaboration";
  if ([8, 9, 29, 30, 31, 32, 49].includes(id)) return "Version Control & Hosting";
  if ([20, 22, 23, 24, 25, 54, 60, 61].includes(id)) return "Data & FAIR Compliance";
  if ([26].includes(id)) return "Language & Accessibility";
  return "Other";
}

//Génère une question à poser à l’utilisateur à partir du titre
function generateQuestion(title) {
  if (!title) return "Is this criterion met by your project?";
  const formatted = title.trim();
  return formatted.endsWith("?")
    ? formatted
    : `${formatted}`;
}

//Génération du fichier enrichi
function generateNewGuidelines() {
  if (!fs.existsSync(inputPath)) {
    console.error("❌ guidelines.json not found at:", inputPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(inputPath, "utf-8");
  const guidelines = JSON.parse(raw);
  const overrides = fs.existsSync(overridesPath)
    ? JSON.parse(fs.readFileSync(overridesPath, "utf-8"))
    : {};

  const nodes = guidelines.data?.node?.items?.nodes || [];
  console.log(`Found ${nodes.length} criteria in source file.`);

  const simplified = nodes.map((item, i) => {
    const fields = Object.fromEntries(
      item.fieldValues.nodes.map(fv => [fv.field?.name || "unknown", fv.text || fv.name])
    );

    const title = fields["Title"] || "Untitled";
    const id = i;
    const level = fields["Skill level"] || "Unknown";
    const type = autoIds.includes(id) ? "auto" : "manual";

    const baseCriterion = {
      id,
      title,
      question: generateQuestion(title),
      category: classifyCriterion(title),
      group: getCriterionGroup(id), 
      level,
      type,
      weight: {
        Novice: 1,
        Beginner: 1.2,
        Intermediate: 1.5,
        Advanced: 2,
        Expert: 2.5,
      }[level] || 1,
      FAIR4RS: fields["FAIR4RS"] || "",
      "Software Development Model (SDM)": fields["Software Development Model (SDM)"] || "",
      "SDM requirement level": fields["SDM requirement level"] || "",
      "Argo FAIR tools": fields["Argo FAIR tools"] || "",
      "Project Aspects": fields["Project Aspects"] || "",
      ui: {
        inputType: type === "manual" ? "boolean" : "auto",
        editable: type === "manual",
        visible: true,
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        sourceFile: "guidelines.json",
        version: "2.0",
      },
    };

    // Fusion avec metadataOverrides.json s’il existe
    return {
      ...baseCriterion,
      ...(overrides[id] || {}),
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2), "utf-8");
  console.log(`guidelines_v2.json generated successfully!`);
  console.log(`Total: ${simplified.length} enriched criteria`);
  console.log(`Groups detected: ${[...new Set(simplified.map(c => c.group))].join(", ")}`);
}

generateNewGuidelines();
