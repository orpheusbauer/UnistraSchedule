import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const version = (process.argv[2] || "").replace(/^v/, "");

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error("Usage : node scripts/release-notes.mjs <vX.Y.Z|X.Y.Z>");
  process.exit(1);
}

const changelog = await readFile(resolve(repositoryRoot, "CHANGELOG.md"), "utf8");
const heading = `## [${version}] - `;
const start = changelog.indexOf(heading);

if (start === -1) {
  console.error(`Notes introuvables pour la version ${version}.`);
  process.exit(1);
}

const bodyStart = changelog.indexOf("\n", start) + 1;
const nextHeading = changelog.indexOf("\n## [", bodyStart);
const notes = changelog.slice(bodyStart, nextHeading === -1 ? undefined : nextHeading).trim();

if (!notes) {
  console.error(`Les notes de la version ${version} sont vides.`);
  process.exit(1);
}

console.log(notes);
