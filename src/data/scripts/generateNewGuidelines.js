// src/data/scripts/generateNewGuidelines.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Utiliser guidelines_v6.json comme nouvelle source
const inputPath = path.resolve(__dirname, "../guidelines_v6.json");
const outputPath = path.resolve(__dirname, "../guidelines_v3.json");
const overridesPath = path.resolve(__dirname, "../metadataOverrides.json");

// Mapping des tests auto (copié de github.js)
const githubCriterionMap = {
  1: "checkVersionControl",
  12: "checkChangesViaPullRequests",
  15: "checkIssuesManagedOnPlatform",
  25: "checkCodeFormatting",
  27: "checkIssuesManagedOnPlatform",
  32: "checkCitationFile",
  33: "checkContributingFile",
  34: "checkHasLicense",
  35: "checkReadmeExists",
  36: "checkReadmeExists",
  37: "checkHasChangelog",
  38: "checkContributingFile",
  39: "checkVersionControl",
  40: "checkHostedOnArgoOrg",
  41: "checkEnglishLanguage",
  45: "checkHasChangelog",
  56: "checkHasLicense",
  57: "checkDependenciesFile",
  58: "checkLanguageAdoptedByArgo",
  59: "checkOpenSourceLanguage",
};

/**
 * AUTO-CHECKABLE CRITERIA (20 total) - Technical verification only
 * Removed semi-auto criteria (now classified as manual)
 */
// const autoIds = [
//   59,  // Uses open-source language
//   58,  // Uses Argo-adopted language
//   25,  // Code formatting standards
//   39,  // Version control system
//   57,  // Dependencies clearly described
//   56, // Has LICENSE file
//   41, // English language
//   1, // Has GitHub topics
//   40, // hosted under an Argo organization/user
//   35, // Protected main branch
//   34, // Has LICENSE file
//   32, // Has CITATION.cff file
//   33, // Has CONTRIBUTING file
//   15, // issues enabled/templates on platform
//   12, // evidence of PR workflow
//   33, // duplicate guideline for CONTRIBUTING file
//   37, // Changelog
//   45, // Changelog
// ];
const autoIds = Object.keys(githubCriterionMap).map(Number);


console.log(`📊 Total auto-checkable criteria: ${autoIds.length}`);

/**
 * Classify criterion by keywords
 */
function classifyCriterion(title) {
  if (!title) return "General";
  const t = title.toLowerCase();

  if (t.includes("published paper") || t.includes("joss")) return "Referencing";
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


  // guidelines_v6.json: tableau d'objets plats
  const nodes = Array.isArray(guidelines) ? guidelines : (guidelines.data?.node?.items?.nodes || []);
  console.log(`📋 Found ${nodes.length} criteria in source file.`);

  const simplified = nodes
    .map((item) => {
      const title = item.content?.title || item.title || "Untitled";
      const url = item.content?.url || null;
      // Extraire le numéro d'issue à la fin de l'URL
      let issueNumber = null;
      if (url) {
        const match = url.match(/\/issues\/(\d+)$/);
        if (match) issueNumber = parseInt(match[1], 10);
      }

      // Récupérer le niveau et autres champs

      // Initialiser tous les champs à string vide
      let level = "";
      let FAIR4RS = "";
      let sdm = "";
      let sdmReq = "";
      let argoFair = "";
      let projectAspects = "";
      let labelPrimary = "";
      let labelSecondary = "";
      let group = "";
      if (item.fieldValues && item.fieldValues.nodes) {
        for (const node of item.fieldValues.nodes) {
          if (node.field?.name === "Skill level") level = node.name || node.text || level;
          if (node.field?.name === "FAIR4RS") FAIR4RS = node.name || node.text || FAIR4RS;
          if (node.field?.name === "Software Development Model (SDM)") sdm = node.name || node.text || sdm;
          if (node.field?.name === "SDM requirement level") sdmReq = node.name || node.text || sdmReq;
          if (node.field?.name === "Argo FAIR tools") argoFair = node.name || node.text || argoFair;
          if (node.field?.name === "Project Aspects") projectAspects = node.name || node.text || projectAspects;
          if (node.field?.name === "Label #1") labelPrimary = node.name || node.text || labelPrimary;
          if (node.field?.name === "Label #2") labelSecondary = node.name || node.text || labelSecondary;
          if (node.field?.name === "Scope") group = node.name || node.text || group;
        }
      }
      // Valeurs par défaut si toujours vide
      // Normaliser level et SDM requirement level pour ne garder que le mot après le tiret
      function normalizeAfterDash(str) {
        if (!str) return str;
        const parts = str.split("-");
        return parts.length > 1 ? parts[1].trim() : str.trim();
      }
      if (level) level = normalizeAfterDash(level);
      else level = "Unknown";
      if (sdmReq) sdmReq = normalizeAfterDash(sdmReq);
      if (!group) group = "General";

      // Type auto ou manuel
      const type = githubCriterionMap[issueNumber] ? "auto" : "manual";
      // Ajout du nom de la fonction de test si auto
      const testFunction = type === "auto" ? githubCriterionMap[issueNumber] : null;

      const baseCriterion = {
        id: issueNumber, // l'id devient le numéro d'issue
        issueId: item.id,
        url,
        title,
        question: generateQuestion(title),
        category: classifyCriterion(title),
        group: normalizeScope(group),
        level,
        type,
        testFunction,
        weight: {
          Novice: 1,
          Beginner: 1.2,
          Intermediate: 1.5,
          Advanced: 2,
          Expert: 2.5,
        }[level] || 1,
        FAIR4RS,
        "Software Development Model (SDM)": sdm,
        "SDM requirement level": sdmReq,
        "Argo FAIR tools": argoFair,
        "Project Aspects": projectAspects,
        ui: {
          inputType: type === "manual" ? "boolean" : "auto",
          editable: type === "manual",
          visible: true,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          sourceFile: "guidelines_v6.json",
          version: "2.0",
          autoCheckable: type === "auto"
        },
      };
      // Merge with metadataOverrides.json if exists
      // Merge avec overrides mais NE SUPPRIME PLUS les champs vides
      return {
        ...baseCriterion,
        ...(overrides[issueNumber] || {}),
      };
    })
    // On ne garde que ceux qui ont un numéro d'issue valide
    .filter(c => typeof c.id === 'number' && !isNaN(c.id))
    // On trie par id (issueNumber) croissant
    .sort((a, b) => a.id - b.id);

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
