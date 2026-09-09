# Publication sur le Chrome Web Store

Ce guide accompagne la version indiquée dans `extension/manifest.json`.

## 1. Préparer GitHub

1. Vérifiez que le dépôt public <https://github.com/orpheusbauer/UnistraSchedule> est à jour.
2. Vérifiez que la branche principale et la dernière GitHub Release sont publiques.
3. Activez **Settings → Security → Code security and analysis → Private vulnerability reporting**.
4. Vérifiez que `PRIVACY.md` est accessible publiquement.

La politique de confidentialité à fournir au Web Store pourra utiliser une URL de cette forme :

```text
https://github.com/orpheusbauer/UnistraSchedule/blob/main/PRIVACY.md
```

## 2. Tester et créer le paquet

Chargez d’abord le dossier `extension` comme extension non empaquetée et réalisez un dernier test sur le vrai calendrier.

Puis lancez :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

Téléversez le ZIP créé dans `dist/`. Ne compressez pas le dépôt entier : `manifest.json` doit être directement à la racine du ZIP.

## 3. Créer l’élément

1. Ouvrez le [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Cliquez sur **Add new item / Ajouter un nouvel élément**.
3. Sélectionnez le ZIP de `dist/`, puis cliquez sur **Upload / Importer**.
4. Complétez les onglets **Store listing**, **Privacy**, **Distribution** et, uniquement si demandé, **Test instructions**.

## 4. Fiche du Store

Les textes prêts à copier se trouvent dans [`store-assets/listing-fr.md`](../store-assets/listing-fr.md).

Paramètres conseillés :

- langue principale : français ;
- catégorie : Productivité ;
- visibilité : **Public** pour une publication ouverte, ou **Unlisted** pour un premier test par lien ;
- achats intégrés : non ;
- URL de la page d’accueil : `https://github.com/orpheusbauer/UnistraSchedule` ;
- URL d’assistance : `https://github.com/orpheusbauer/UnistraSchedule/issues`.

Importez :

- `store-assets/icon-128.png` comme icône ;
- les fichiers de `store-assets/screenshots/` comme captures ;
- `store-assets/promo-small-440x280.png` comme petite vignette promotionnelle.

## 5. Confidentialité

Dans **Privacy practices** :

- utilisez le texte « Objectif unique » fourni dans `store-assets/listing-fr.md` ;
- justifiez la permission `storage` et l’accès au domaine avec les textes fournis ;
- indiquez **Non** pour l’utilisation de code distant ;
- déclarez honnêtement le traitement local du contenu du site et des contenus saisis par l’utilisateur ;
- certifiez que les données ne sont ni vendues, ni utilisées hors de l’objectif unique, ni utilisées pour du crédit ;
- fournissez l’URL publique de `PRIVACY.md` sur GitHub.

Même sans transmission vers un serveur, le calendrier lu et les cours saisis sont des données traitées localement et doivent être décrits dans la politique de confidentialité.

## 6. Envoyer en révision

Relisez la fiche, vérifiez l’adresse de contact du compte développeur et l’authentification à deux facteurs, puis cliquez sur **Submit for review**. L’option de publication différée permet de valider manuellement la mise en ligne après acceptation.

## Publier une mise à jour

1. Préparez et publiez une nouvelle version en suivant [`RELEASING.md`](RELEASING.md).
2. Récupérez le ZIP attaché à la GitHub Release, ou recréez-le avec `scripts/package.ps1`.
3. Dans l’onglet **Package**, utilisez **Upload new package**.
4. Envoyez la nouvelle version en révision.
