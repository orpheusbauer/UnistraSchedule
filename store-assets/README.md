# Ressources Chrome Web Store

Ces fichiers ne sont pas inclus dans le ZIP de l’extension. Ils servent à remplir la fiche du Chrome Web Store.

| Fichier | Dimensions | Usage |
| --- | ---: | --- |
| `icon-128.png` | 128×128 | Icône de la fiche |
| `screenshots/01-overview.png` | 1280×800 | Capture principale obligatoire |
| `promo-small-440x280.png` | 440×280 | Petite vignette promotionnelle |
| `logo-master.png` | 512×512 | Source raster pour les déclinaisons |

La capture montre une interface réelle de l’extension avec des données fictives. Aucun nom ou emploi du temps réel d’étudiant ne doit apparaître dans les ressources publiées.

Pour reconstruire les icônes et la vignette depuis le logo maître :

```powershell
python -m pip install Pillow
python scripts/build_store_assets.py
```
