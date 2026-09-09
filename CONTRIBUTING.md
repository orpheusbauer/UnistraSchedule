# Contribuer

Merci de vouloir améliorer le projet.

- dépôt public : <https://github.com/orpheusbauer/UnistraSchedule> ;
- problèmes et suggestions : <https://github.com/orpheusbauer/UnistraSchedule/issues>.

## Avant de commencer

- vérifiez qu’une issue similaire n’existe pas déjà ;
- gardez l’extension centrée sur un objectif unique : personnaliser le calendrier Unistra ;
- n’ajoutez pas de suivi, de publicité, de code distant ou de permission sans justification claire ;
- ne commitez jamais de compte, cookie, donnée d’étudiant ou page de calendrier enregistrée.

## Développement

1. Créez une branche courte et descriptive.
2. Modifiez les fichiers du dossier `extension`.
3. Rechargez l’extension depuis `chrome://extensions`.
4. Testez le masquage, l’ajout, l’édition, la suppression, la répétition et un changement de semaine.
5. Lancez les contrôles :

```powershell
node --check extension/content.js
node --check extension/background.js
node scripts/validate-manifest.mjs
```

6. Mettez à jour `CHANGELOG.md` si le changement est visible par les utilisateurs.

## Gestion des versions

Toute modification destinée aux utilisateurs doit recevoir une nouvelle version avant son commit. Le projet suit la gestion sémantique de version :

- `patch` pour une correction ou un petit ajustement compatible ;
- `minor` pour une nouvelle fonctionnalité compatible ;
- `major` pour un changement incompatible.

Décrivez d’abord le changement sous `Non publié` dans `CHANGELOG.md`, puis utilisez `node scripts/prepare-release.mjs patch`, `minor` ou `major`. La version du manifeste, la section datée du changelog et le tag Git doivent rester identiques, avec le préfixe `v` réservé au tag. Une version ou un tag déjà publié ne doit jamais être réutilisé.

Consultez le [guide de publication](docs/RELEASING.md) pour les contrôles, le commit, le tag et la GitHub Release.

## Pull requests

Une pull request doit expliquer le problème, la solution et les vérifications réalisées. Pour un changement d’interface, ajoutez une capture avant/après sans donnée personnelle.

Avant toute publication, exécutez `node scripts/validate-manifest.mjs` et `powershell -ExecutionPolicy Bypass -File scripts/package.ps1`.
