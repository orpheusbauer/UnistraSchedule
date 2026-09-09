import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const manifestPath = resolve(repositoryRoot, "extension", "manifest.json");
const changelogPath = resolve(repositoryRoot, "CHANGELOG.md");
const requestedVersion = process.argv[2];

if (!requestedVersion) {
  console.error("Usage : node scripts/prepare-release.mjs <patch|minor|major|X.Y.Z>");
  process.exit(1);
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const changelog = await readFile(changelogPath, "utf8");
const currentMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(manifest.version);

if (!currentMatch) {
  console.error(`La version actuelle ${manifest.version} n’utilise pas le format X.Y.Z.`);
  process.exit(1);
}

function nextVersion(kind) {
  const [, majorText, minorText, patchText] = currentMatch;
  const major = Number(majorText);
  const minor = Number(minorText);
  const patch = Number(patchText);

  if (kind === "patch") return `${major}.${minor}.${patch + 1}`;
  if (kind === "minor") return `${major}.${minor + 1}.0`;
  if (kind === "major") return `${major + 1}.0.0`;
  if (/^\d+\.\d+\.\d+$/.test(kind)) return kind;

  console.error("La version demandée doit être patch, minor, major ou X.Y.Z.");
  process.exit(1);
}

function compareVersions(left, right) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

function parisDate() {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const version = nextVersion(requestedVersion);
if (compareVersions(version, manifest.version) <= 0) {
  console.error(`La nouvelle version (${version}) doit être supérieure à ${manifest.version}.`);
  process.exit(1);
}

const unpublishedMatch = /## \[Non publié\]\r?\n([\s\S]*?)(?=\r?\n## \[\d)/.exec(changelog);
if (!unpublishedMatch) {
  console.error("La section « Non publié » de CHANGELOG.md est introuvable.");
  process.exit(1);
}

const notes = unpublishedMatch[1]
  .trim()
  .replace(/^_Aucun changement documenté\._\s*/, "")
  .trim();
if (!notes) {
  console.error("Ajoutez les notes de la prochaine version sous « Non publié » avant de préparer la release.");
  process.exit(1);
}

manifest.version = version;
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
const replacement = `## [Non publié]\n\n_Aucun changement documenté._\n\n## [${version}] - ${parisDate()}\n\n${notes}\n`;
const changelogText = changelog.replace(unpublishedMatch[0], replacement);

await writeFile(manifestPath, manifestText, "utf8");
await writeFile(changelogPath, changelogText, "utf8");

console.log(`Version ${version} préparée. Vérifiez les fichiers, puis lancez les validations.`);
