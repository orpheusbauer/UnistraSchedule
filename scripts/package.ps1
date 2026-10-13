param(
  [string]$OutputDirectory = "dist"
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$extensionRoot = Join-Path $repositoryRoot "extension"
$manifestPath = Join-Path $extensionRoot "manifest.json"
$outputRoot = Join-Path $repositoryRoot $OutputDirectory

node --check (Join-Path $extensionRoot "content.js")
if ($LASTEXITCODE -ne 0) { throw "content.js contient une erreur de syntaxe" }

node --check (Join-Path $extensionRoot "background.js")
if ($LASTEXITCODE -ne 0) { throw "background.js contient une erreur de syntaxe" }

node (Join-Path $PSScriptRoot "validate-manifest.mjs")
if ($LASTEXITCODE -ne 0) { throw "Le manifeste n'est pas valide" }

$npxCommand = Get-Command npx.cmd -ErrorAction SilentlyContinue
if (-not $npxCommand) { throw "npx.cmd est requis pour lancer le validateur Firefox web-ext" }

& $npxCommand.Source --yes web-ext@10.6.0 lint --source-dir $extensionRoot --output=json --boring |
  node (Join-Path $PSScriptRoot "check-firefox-report.mjs")
if ($LASTEXITCODE -ne 0) { throw "Le validateur Firefox web-ext a signalé un problème" }

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$archiveName = "unistra-schedule-$($manifest.version).zip"
$archivePath = Join-Path $outputRoot $archiveName

& $npxCommand.Source --yes web-ext@10.6.0 build --source-dir $extensionRoot --artifacts-dir $outputRoot --filename $archiveName --overwrite-dest
if ($LASTEXITCODE -ne 0) { throw "La création du paquet avec web-ext a échoué" }

node (Join-Path $PSScriptRoot "validate-archive.mjs") $archivePath
if ($LASTEXITCODE -ne 0) { throw "Le contenu de l'archive n'est pas valide" }

& $npxCommand.Source --yes addons-linter@10.10.0 $archivePath --output=json --boring |
  node (Join-Path $PSScriptRoot "check-firefox-report.mjs")
if ($LASTEXITCODE -ne 0) { throw "Le paquet final a été refusé par le linter Firefox Add-ons" }

Write-Host "Paquet créé : $archivePath"
