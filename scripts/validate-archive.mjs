import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const archivePath = process.argv[2];
if (!archivePath) {
  console.error("Usage : node scripts/validate-archive.mjs <archive.zip>");
  process.exit(1);
}

const archive = await readFile(archivePath);
const endSignature = 0x06054b50;
const centralSignature = 0x02014b50;
const minimumEndSize = 22;
const maximumCommentSize = 0xffff;
let endOffset = -1;

for (
  let offset = archive.length - minimumEndSize;
  offset >= Math.max(0, archive.length - minimumEndSize - maximumCommentSize);
  offset -= 1
) {
  if (archive.readUInt32LE(offset) === endSignature) {
    endOffset = offset;
    break;
  }
}

if (endOffset < 0) {
  console.error("La fin de la table centrale du ZIP est introuvable.");
  process.exit(1);
}

const entryCount = archive.readUInt16LE(endOffset + 10);
let centralOffset = archive.readUInt32LE(endOffset + 16);
const entryNames = [];

for (let index = 0; index < entryCount; index += 1) {
  if (centralOffset + 46 > archive.length || archive.readUInt32LE(centralOffset) !== centralSignature) {
    console.error(`Entrée ZIP ${index + 1} invalide dans la table centrale.`);
    process.exit(1);
  }

  const nameLength = archive.readUInt16LE(centralOffset + 28);
  const extraLength = archive.readUInt16LE(centralOffset + 30);
  const commentLength = archive.readUInt16LE(centralOffset + 32);
  const nameStart = centralOffset + 46;
  const nameEnd = nameStart + nameLength;

  if (nameEnd > archive.length) {
    console.error(`Nom de l’entrée ZIP ${index + 1} tronqué.`);
    process.exit(1);
  }

  entryNames.push(archive.subarray(nameStart, nameEnd).toString("utf8"));
  centralOffset = nameEnd + extraLength + commentLength;
}

const invalidNames = entryNames.filter((name) => {
  const segments = name.split("/").filter(Boolean);
  return (
    name.includes("\\") ||
    name.startsWith("/") ||
    name.startsWith("./") ||
    /^[A-Za-z]:/.test(name) ||
    name.includes("//") ||
    segments.includes("..")
  );
});

if (invalidNames.length) {
  console.error(`Noms de fichiers invalides dans l’archive : ${invalidNames.join(", ")}`);
  process.exit(1);
}

const files = entryNames.filter((name) => !name.endsWith("/"));
const duplicateFiles = files.filter((name, index) => files.indexOf(name) !== index);
if (duplicateFiles.length) {
  console.error(`Fichiers dupliqués dans l’archive : ${[...new Set(duplicateFiles)].join(", ")}`);
  process.exit(1);
}

const expectedFiles = [
  "background.js",
  "content.js",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
  "manifest.json",
  "styles.css"
].sort();
const sortedFiles = [...files].sort();

if (JSON.stringify(sortedFiles) !== JSON.stringify(expectedFiles)) {
  console.error(`Contenu inattendu dans l’archive : ${sortedFiles.join(", ")}`);
  process.exit(1);
}

console.log(`Archive ${basename(archivePath)} valide (${files.length} fichiers, chemins avec /).`);
