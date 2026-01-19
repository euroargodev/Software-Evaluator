// src/data/scripts/generateNewGuidelines.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, "../guidelines.json");
const outputPath = path.resolve(__dirname, "../guidelines_v2.json");
const overridesPath = path.resolve(__dirname, "../metadataOverrides.json");

/**
 * AUTO-CHECKABLE CRITERIA (20 total) - Technical verification only
 * Removed semi-auto criteria (now classified as manual)
 */
const autoIds = [
  4,  // Uses open-source language
  5,  // Uses Argo-adopted language
  7,  // Code formatting standards
  8,  // Version control system
  9,  // Dependencies clearly described
  10, // Has LICENSE file
  11, // Has README
  26, // English language
  29, // Has GitHub topics
  30, // Uses GDAC servers
  31, // Has .gitignore
  32, // Protected main branch
  33, // Has GitHub description
  37, // Repo URL in code
  38, // Has CITATION file
  41, // Has CONTRIBUTING file
  46, // Has tests
  49, // Has releases/tags
  60, // Assumes GDAC folder structure
  61, // Uses official Argo sources
];

console.log(`📊 Total auto-checkable criteria: ${autoIds.length}`);

/**
 * Classify criterion by keywords
 */
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
  if (t.includes("argo") || t.includes("data")) return "Argo Compliance";

  return "General";
}

const scopeAliases = {
  "Argo specific": "Argo specific",
  "General guideline": "General"
};

function normalizeScope(label) {
  if (!label) return "";
  return scopeAliases[label] || label;
}

function buildScopeLabel(fields) {
  const secondary = normalizeScope(fields["Label #2"]);
  return secondary || "General";
}

/**
 * Get criterion group (logical theme)
 */
function getCriterionGroup(id) {
  if ([0, 1, 19, 21, 51, 52, 53].includes(id)) return "Metadata & Identification";
  if ([3, 11, 12, 13, 14, 47, 48, 50].includes(id)) return "Documentation";
  if ([4, 5, 6, 7, 56, 57, 58].includes(id)) return "Code Quality & Standards";
  if ([15, 16, 17].includes(id)) return "Testing & Integration";
  if ([10, 33, 54, 55, 59].includes(id)) return "Licensing & Citation";
  if ([27, 28, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 62].includes(id))
    return "Community & Collaboration";
  if ([8, 9, 29, 31, 32, 49].includes(id)) return "Version Control & Hosting";
  if ([20, 22, 23, 24, 25, 30, 60, 61].includes(id)) return "Data & FAIR Compliance";
  if ([26].includes(id)) return "Language & Accessibility";
  if ([18, 52].includes(id)) return "Distribution & Registry";
  return "Other";
}

/**
 * Generate question from criterion title
 */
function generateQuestion(title) {
  if (!title) return "Is this criterion met by your project?";
  const formatted = title.trim();
  return formatted.endsWith("?") ? formatted : `${formatted}`;
}

/**
 * Main generation function
 */
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
  console.log(`📋 Found ${nodes.length} criteria in source file.`);

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
      group: buildScopeLabel(fields),
      labelPrimary: fields["Label #1"] || "",
      labelSecondary: fields["Label #2"] || "",
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
        autoCheckable: type === "auto"
      },
    };

    // Merge with metadataOverrides.json if exists
    return {
      ...baseCriterion,
      ...(overrides[id] || {}),
    };
  });

  // Statistics
  const autoCount = simplified.filter(c => c.type === "auto").length;
  const manualCount = simplified.filter(c => c.type === "manual").length;
  const groups = [...new Set(simplified.map(c => c.group))];

  fs.writeFileSync(outputPath, JSON.stringify(simplified, null, 2), "utf-8");

  console.log("\n✅ guidelines_v2.json generated successfully!");
  console.log(`📊 Statistics:`);
  console.log(`   • Total criteria: ${simplified.length}`);
  console.log(`   • Auto-checkable: ${autoCount} (${Math.round(autoCount/simplified.length*100)}%)`);
  console.log(`   • Manual: ${manualCount} (${Math.round(manualCount/simplified.length*100)}%)`);
  console.log(`\n📁 Groups detected:`);
  groups.forEach(g => {
    const count = simplified.filter(c => c.group === g).length;
    console.log(`   • ${g}: ${count} criteria`);
  });
}

generateNewGuidelines();
