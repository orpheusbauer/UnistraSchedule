# Historique des versions

Ce fichier suit les principes de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet utilise la [gestion sémantique de version](https://semver.org/lang/fr/).

## [Non publié]

_Aucun changement documenté._

## [1.0.3] - 2026-09-10

### Ajouté

- prise en charge de `https://monedt.unistra.fr` en complément de `https://monemploidutemps.unistra.fr` ;
- partage automatique des filtres et des cours personnels entre les deux adresses du calendrier.

### Modifié

- l’autorisation d’accès aux sites inclut désormais le second sous-domaine Unistra ; le navigateur peut demander aux utilisateurs existants de confirmer cette nouvelle autorisation lors de la mise à jour.

## [1.0.2] - 2026-09-10

### Corrigé

- le panneau est désormais chargé après le retour de l’authentification, même lorsque le calendrier est ouvert par une navigation interne sans rechargement de page ;
- un clic sur l’icône injecte et ouvre le panneau si l’onglet était déjà ouvert lors de l’installation ou de la mise à jour de l’extension.

## [1.0.1] - 2026-09-09

### Modifié

- le nom de l’extension passe de **Mon emploi du temps Unistra** à **Unistra Schedule**.

### Ajouté

- un processus documenté de gestion des versions et des publications ;
- des contrôles automatiques entre la version du manifeste, le changelog et le tag Git ;
- la création automatique d’une GitHub Release et de son paquet Chrome Web Store lors de l’envoi d’un tag de version ;
- des liens vers le dépôt public et le suivi des problèmes dans la documentation et la fiche Chrome Web Store.

## [1.0.0] - 2026-09-09

### Ajouté

- masquage des cours par mots-clés, insensible aux majuscules et aux accents ;
- création, modification et suppression de cours personnels ;
- choix de la date, des horaires, de la couleur, de l’enseignant, de la salle et d’une note ;
- répétition hebdomadaire avec date de fin ;
- stockage local des réglages ;
- prise en charge des changements dynamiques du calendrier Unistra ;
- interface accessible depuis la page et l’icône de l’extension.
