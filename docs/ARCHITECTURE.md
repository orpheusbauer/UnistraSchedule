# Architecture

L’extension utilise Manifest V3, un manifeste commun aux navigateurs Chromium et à Firefox, et ne nécessite aucune étape de compilation.

## Composants

- `manifest.json` limite l’exécution à la page du calendrier, déclare les permissions nécessaires et contient l’identifiant stable utilisé par Firefox Add-ons.
- `content.js` ajoute le panneau, filtre les cours existants et place les cours personnels dans la grille.
- `styles.css` contient les styles préfixés `uext-` afin de limiter les conflits avec Vuetify.
- `background.js` relaie le clic sur l’icône de la barre d’outils vers le panneau déjà injecté. Chromium le charge comme service worker et Firefox comme script d’événement.

Le manifeste déclare à la fois `background.service_worker` et `background.scripts`. Cette combinaison est volontaire : Chromium utilise le premier, tandis que Firefox utilise le second. La version minimale de Firefox est 140, qui prend en charge sa déclaration intégrée de collecte des données.

## Données

Une seule entrée, `unistraPersonalSchedule`, est conservée dans le stockage local WebExtension (`storage.local`) :

```json
{
  "hiddenKeywords": ["Architecture"],
  "customEvents": [
    {
      "id": "uuid",
      "title": "Cours optionnel",
      "date": "2026-09-09",
      "start": "10:30",
      "end": "12:00",
      "teacher": "",
      "room": "",
      "notes": "",
      "color": "#78c6c9",
      "recurrence": "weekly",
      "repeatUntil": "2026-12-16"
    }
  ]
}
```

Le calendrier est observé avec `MutationObserver` afin de réappliquer les personnalisations lorsque Vue change de semaine ou reconstruit la grille.
