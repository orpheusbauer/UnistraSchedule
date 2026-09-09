# Publier une nouvelle version

Le dépôt utilise la gestion sémantique de version. Toute modification destinée aux utilisateurs doit être associée à une version encore jamais publiée.

- `patch` (`1.0.1` → `1.0.2`) : correction ou petit ajustement compatible ;
- `minor` (`1.0.1` → `1.1.0`) : nouvelle fonctionnalité compatible ;
- `major` (`1.0.1` → `2.0.0`) : changement incompatible.

Le numéro n’a pas de préfixe dans `extension/manifest.json`. Le tag Git correspondant commence par `v` : la version `1.0.1` utilise le tag `v1.0.1`.

## Préparer la version

1. Décrivez les changements dans la section `Non publié` de `CHANGELOG.md`.
2. Lancez l’une des commandes suivantes :

```powershell
node scripts/prepare-release.mjs patch
node scripts/prepare-release.mjs minor
node scripts/prepare-release.mjs major
```

Le script augmente la version du manifeste, date la nouvelle section du changelog et recrée une section `Non publié` vide. Il accepte aussi une version explicite, par exemple `node scripts/prepare-release.mjs 1.2.0`.

3. Vérifiez les fichiers modifiés, puis validez et créez le paquet :

```powershell
node scripts/validate-manifest.mjs
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

## Commiter, vérifier et publier

Remplacez `X.Y.Z` par la version préparée :

```powershell
git add .
git commit -m "Release vX.Y.Z"
git push origin main

gh run watch (gh run list --workflow validate.yml --branch main --event push --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status

git tag -a vX.Y.Z -m "Unistra Schedule vX.Y.Z"
git push origin vX.Y.Z

gh run watch (gh run list --workflow release.yml --event push --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
gh release view vX.Y.Z --web
```

Si GitHub n’a pas encore affiché le nouveau workflow au moment de la commande `gh run list`, attendez quelques secondes puis relancez uniquement la ligne `gh run watch (...)` concernée.

Le workflow `Validation` contrôle le code et fabrique un artefact de test à chaque push. Le workflow `Release` se déclenche au push du tag, vérifie que le tag, le manifeste et le changelog concordent, puis publie automatiquement une GitHub Release avec le ZIP destiné au Chrome Web Store.

## Mettre à jour le Chrome Web Store

Téléchargez `unistra-schedule-X.Y.Z.zip` depuis la GitHub Release, puis suivez la section « Publier une mise à jour » du [guide Chrome Web Store](CHROME_WEB_STORE.md).

Un tag publié est immuable : en cas d’erreur, préparez une nouvelle version au lieu de déplacer ou de réutiliser le tag.
