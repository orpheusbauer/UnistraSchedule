process.stdin.setEncoding("utf8");
let input = "";
for await (const chunk of process.stdin) input += chunk;
const reportLine = input
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find((line) => line.startsWith("{\"count\":"));

if (!reportLine) {
  console.error("Le rapport JSON de web-ext est absent ou illisible.");
  process.exit(1);
}

let report;
try {
  report = JSON.parse(reportLine);
} catch (error) {
  console.error(`Le rapport JSON de web-ext est invalide : ${error.message}`);
  process.exit(1);
}

const allowedWarningCodes = new Set(["BACKGROUND_SERVICE_WORKER_IGNORED"]);
const errors = Array.isArray(report.errors) ? report.errors : [];
const warnings = Array.isArray(report.warnings) ? report.warnings : [];
const unexpectedWarnings = warnings.filter((warning) => !allowedWarningCodes.has(warning.code));

if (errors.length || unexpectedWarnings.length) {
  for (const issue of [...errors, ...unexpectedWarnings]) {
    console.error(`- ${issue.code || issue._type || "PROBLEME"} : ${issue.message || issue.description || "problème non décrit"}`);
  }
  process.exit(1);
}

const expectedWarningCount = warnings.length - unexpectedWarnings.length;
console.log(
  `Validation Firefox réussie : ${errors.length} erreur, ${expectedWarningCount} avertissement de compatibilité attendu.`
);
