import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const tag = process.argv[2];
const match = /^v(\d+\.\d+\.\d+)$/.exec(tag || "");

if (!match) {
  console.error("Le tag doit respecter le format vX.Y.Z.");
  process.exit(1);
}

const version = match[1];
const manifest = JSON.parse(await readFile(resolve(repositoryRoot, "extension", "manifest.json"), "utf8"));
const changelog = await readFile(resolve(repositoryRoot, "CHANGELOG.md"), "utf8");

if (manifest.version !== version) {
  console.error(`Le tag ${tag} ne correspond pas à la version ${manifest.version} du manifeste.`);
  process.exit(1);
}

if (!changelog.includes(`## [${version}] - `)) {
  console.error(`CHANGELOG.md ne contient pas de section datée pour ${version}.`);
  process.exit(1);
}

console.log(`Release ${tag} cohérente avec le manifeste et le changelog.`);
