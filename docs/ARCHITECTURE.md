# Architecture

L’extension utilise Manifest V3 et ne nécessite aucune étape de compilation.

## Composants

- `manifest.json` limite l’exécution à la page du calendrier et déclare la permission `storage`.
- `content.js` ajoute le panneau, filtre les cours existants et place les cours personnels dans la grille.
- `styles.css` contient les styles préfixés `uext-` afin de limiter les conflits avec Vuetify.
- `background.js` relaie le clic sur l’icône de la barre d’outils vers le panneau déjà injecté.

## Données

Une seule entrée, `unistraPersonalSchedule`, est conservée dans `chrome.storage.local` :

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
