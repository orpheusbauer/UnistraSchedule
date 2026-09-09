# Contribuer

Merci de vouloir améliorer le projet.

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

## Pull requests

Une pull request doit expliquer le problème, la solution et les vérifications réalisées. Pour un changement d’interface, ajoutez une capture avant/après sans donnée personnelle.

Une version destinée au Chrome Web Store doit également augmenter le champ `version` de `extension/manifest.json`.
