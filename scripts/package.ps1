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

$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$archivePath = Join-Path $outputRoot "mon-emploi-du-temps-unistra-$($manifest.version).zip"

if (Test-Path -LiteralPath $archivePath) {
  Remove-Item -LiteralPath $archivePath -Force
}

Compress-Archive -Path (Join-Path $extensionRoot "*") -DestinationPath $archivePath -CompressionLevel Optimal
Write-Host "Paquet créé : $archivePath"
