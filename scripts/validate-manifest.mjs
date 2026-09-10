import { readFile, access, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const extensionRoot = resolve(repositoryRoot, "extension");
const manifestPath = resolve(extensionRoot, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const changelog = await readFile(resolve(repositoryRoot, "CHANGELOG.md"), "utf8");
const errors = [];
const supportedMatches = [
  "https://monemploidutemps.unistra.fr/*",
  "https://monedt.unistra.fr/*"
];

function check(condition, message) {
  if (!condition) errors.push(message);
}

check(manifest.manifest_version === 3, "manifest_version doit valoir 3");
check(typeof manifest.name === "string" && manifest.name.length > 0, "name est obligatoire");
check(typeof manifest.description === "string" && manifest.description.length <= 132, "description doit contenir au maximum 132 caractères");
check(/^\d+\.\d+\.\d+$/.test(manifest.version || ""), "version doit respecter le format X.Y.Z");
check(changelog.includes(`## [${manifest.version}] - `), `CHANGELOG.md doit contenir une section datée pour la version ${manifest.version}`);
check(JSON.stringify(manifest.permissions) === JSON.stringify(["storage", "scripting"]), "seules les permissions storage et scripting sont attendues");
check(JSON.stringify(manifest.host_permissions) === JSON.stringify(supportedMatches), "les accès hôtes doivent être limités aux deux domaines d’emploi du temps Unistra");
check(manifest.content_scripts?.length === 1, "un seul content script est attendu");
check(JSON.stringify(manifest.content_scripts?.[0]?.matches) === JSON.stringify(supportedMatches), "le content script doit couvrir les navigations internes des deux domaines Unistra");

const packagedFiles = new Set([
  "background.js",
  "content.js",
  "styles.css",
  ...Object.values(manifest.icons || {}),
  ...Object.values(manifest.action?.default_icon || {})
]);

for (const relativePath of packagedFiles) {
  try {
    await access(resolve(extensionRoot, relativePath));
  } catch {
    errors.push(`fichier manquant : ${relativePath}`);
  }
}

for (const [declaredSize, relativePath] of Object.entries(manifest.icons || {})) {
  try {
    const image = await readFile(resolve(extensionRoot, relativePath));
    const isPng = image.subarray(1, 4).toString("ascii") === "PNG";
    const width = image.readUInt32BE(16);
    const height = image.readUInt32BE(20);
    check(isPng, `${relativePath} doit être un fichier PNG`);
    check(width === Number(declaredSize) && height === Number(declaredSize), `${relativePath} doit mesurer ${declaredSize}×${declaredSize} pixels`);
  } catch {
    // L’absence du fichier est déjà signalée ci-dessus.
  }
}

const allowedRootEntries = new Set(["background.js", "content.js", "icons", "manifest.json", "styles.css"]);
const rootEntries = await readdir(extensionRoot);
for (const entry of rootEntries) {
  check(allowedRootEntries.has(entry), `fichier résiduel dans extension/ : ${entry}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Manifest ${manifest.version} valide (${packagedFiles.size} fichiers référencés).`);
}
