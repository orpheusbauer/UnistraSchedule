# Publication sur Firefox Add-ons

Ce guide concerne la publication publique sur [Firefox Add-ons (AMO)](https://addons.mozilla.org/developers/). La version `1.0.5` utilise le même dossier `extension` et le même ZIP que Chrome, Brave et Edge. Il n’est pas nécessaire de maintenir une seconde branche.

## 1. Identité et compatibilité

Le manifeste contient l’identifiant Firefox stable suivant :

```text
unistra-schedule@orpheusbauer.github.io
```

Cet identifiant rattache les mises à jour au même module complémentaire. Ne le modifiez pas après la première publication sur AMO. La version minimale déclarée est Firefox 140.

Le manifeste déclare également :

- `background.service_worker` pour Chrome, Brave et Edge ;
- `background.scripts` pour Firefox ;
- `data_collection_permissions.required: ["none"]`, car aucune donnée n’est collectée ou transmise en dehors de l’extension ou du navigateur local.

## 2. Tester dans Firefox

Pour un test manuel :

1. ouvrez `about:debugging#/runtime/this-firefox` ;
2. cliquez sur **Charger un module complémentaire temporaire** ;
3. sélectionnez `extension/manifest.json` ;
4. testez le bouton **Mon EDT**, l’icône de la barre d’outils, les filtres et les cours personnels sur les deux adresses Unistra ;
5. vérifiez que les données créées sur une adresse sont disponibles sur l’autre.

Pour reproduire le validateur Mozilla avec Node.js 22 ou une version ultérieure :

```powershell
npx.cmd --yes web-ext@10.6.0 lint --source-dir extension --output=json --boring |
  node scripts/check-firefox-report.mjs
```

La commande doit annoncer une validation réussie. Mozilla signale encore `BACKGROUND_SERVICE_WORKER_IGNORED` : cet unique avertissement est attendu avec un manifeste commun, car Firefox ignore le service worker destiné à Chromium et charge `background.scripts`. Le script de contrôle refuse toute erreur et tout autre avertissement.

## 3. Créer le paquet commun

À la racine du dépôt, lancez :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

Le fichier `dist/unistra-schedule-X.Y.Z.zip` obtenu est le paquet à envoyer aussi bien au Chrome Web Store qu’à Firefox Add-ons. Le fichier `manifest.json` doit se trouver directement à la racine de l’archive.

Le script utilise `web-ext build` afin que les noms internes emploient toujours `/`, même lorsque le paquet est créé sous Windows. Il relit ensuite la table centrale du ZIP et refuse notamment un nom comme `icons\icon-128.png`, rejeté par le validateur AMO. Enfin, il exécute `addons-linter` directement sur l’archive finale.

## 4. Créer la fiche publique sur AMO

1. Connectez-vous au [Developer Hub de Firefox Add-ons](https://addons.mozilla.org/developers/).
2. Choisissez l’envoi d’un nouveau module complémentaire.
3. Sélectionnez la distribution publique sur Firefox Add-ons, et non l’auto-distribution.
4. Importez `dist/unistra-schedule-X.Y.Z.zip`.
5. Consultez le rapport de validation. N’envoyez la version en révision que s’il ne reste aucune erreur.
6. Complétez la fiche en français à partir de [`store-assets/listing-fr.md`](../store-assets/listing-fr.md).
7. Ajoutez l’icône et la capture stockées dans `store-assets/`.
8. Indiquez comme page d’accueil `https://github.com/orpheusbauer/UnistraSchedule` et comme assistance `https://github.com/orpheusbauer/UnistraSchedule/issues`.
9. Fournissez l’URL publique de [`PRIVACY.md`](../PRIVACY.md) si le formulaire la demande.
10. Envoyez la version en révision.

Le projet ne comporte aucune étape de compilation : les fichiers du paquet sont directement le code source lisible. Si Mozilla demande les sources, indiquez le dépôt public et expliquez qu’aucun fichier généré n’est exécuté par l’extension.

## 5. Déclaration relative aux données

Dans les questions de confidentialité, indiquez qu’aucune donnée n’est collectée ou transmise en dehors de l’extension ou du navigateur local. Les mots-clés et les cours personnels sont uniquement conservés dans `storage.local` sur l’appareil de l’utilisateur.

Cette déclaration doit rester cohérente avec :

- `browser_specific_settings.gecko.data_collection_permissions` dans le manifeste ;
- [`PRIVACY.md`](../PRIVACY.md) ;
- les textes de la fiche dans [`store-assets/listing-fr.md`](../store-assets/listing-fr.md).

## Publier une mise à jour

1. Préparez et publiez une nouvelle version en suivant [`RELEASING.md`](RELEASING.md).
2. Ouvrez la fiche AMO déjà créée pour Unistra Schedule. Ne créez pas une seconde fiche.
3. Ajoutez une nouvelle version et importez le ZIP attaché à la GitHub Release.
4. Copiez les notes de version correspondantes depuis `CHANGELOG.md`.
5. Vérifiez le rapport de validation, puis envoyez la mise à jour en révision.

Mozilla signe le module après validation. Le fichier signé distribué aux utilisateurs est un XPI, mais le fichier à téléverser dans le Developer Hub peut rester le ZIP commun produit par le projet.
