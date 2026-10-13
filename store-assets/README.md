# Ressources des stores

Ces fichiers ne sont pas inclus dans le ZIP de l’extension. Ils servent à remplir les fiches du Chrome Web Store et de Firefox Add-ons.

| Fichier | Dimensions | Usage |
| --- | ---: | --- |
| `icon-128.png` | 128×128 | Icône des fiches |
| `screenshots/01-overview.png` | 1280×800 | Capture principale |
| `promo-small-440x280.png` | 440×280 | Petite vignette du Chrome Web Store |
| `logo-master.png` | 512×512 | Source raster pour les déclinaisons |

La capture montre une interface réelle de l’extension avec des données fictives. Aucun nom ou emploi du temps réel d’étudiant ne doit apparaître dans les ressources publiées.

Les textes communs et les champs propres à chaque store se trouvent dans `listing-fr.md`.

Pour reconstruire les icônes et la vignette depuis le logo maître :

```powershell
python -m pip install Pillow
python scripts/build_store_assets.py
```
