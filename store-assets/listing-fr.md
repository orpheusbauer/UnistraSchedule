# Textes pour la fiche française

## Nom

Unistra Schedule

## Résumé court

Masquez des cours et ajoutez vos événements personnels à l’emploi du temps Unistra.

## Description détaillée

Unistra Schedule ajoute des outils de personnalisation au calendrier en ligne de l’Université de Strasbourg.

L’extension permet de :

- masquer automatiquement les cours qui contiennent un mot-clé choisi ;
- ajouter un cours personnel avec sa date, ses horaires, son enseignant, sa salle, une note et une couleur ;
- répéter un cours chaque semaine jusqu’à une date définie ;
- modifier ou supprimer rapidement les cours ajoutés.

Les réglages sont enregistrés uniquement dans le navigateur. L’extension ne contient ni publicité, ni suivi d’audience, ni compte utilisateur, et n’envoie aucune donnée à un service externe.

Elle fonctionne uniquement sur la page du calendrier `monemploidutemps.unistra.fr/consult/calendar`.

Ce projet est indépendant et n’est ni édité, ni approuvé, ni maintenu par l’Université de Strasbourg.

## Objectif unique

Permettre aux utilisateurs du calendrier `monemploidutemps.unistra.fr` de masquer des cours et d’y afficher leurs propres événements.

## Justification de `storage`

La permission `storage` conserve localement les mots-clés et les cours personnels créés par l’utilisateur afin de les restaurer lors des prochaines visites. Ces données ne quittent pas le navigateur.

## Justification de l’accès au site

L’accès à `https://monemploidutemps.unistra.fr/*` est nécessaire pour lire les intitulés affichés, masquer les cours correspondant aux mots-clés et insérer les événements personnels dans la grille. L’extension ne s’exécute sur aucun autre domaine.

## Code distant

Non. Tous les fichiers exécutés sont inclus dans le paquet de l’extension. Aucun script externe n’est téléchargé ou exécuté.

## Instructions de test pour l’équipe de validation

1. Ouvrir `https://monemploidutemps.unistra.fr/consult/calendar` avec un compte autorisé à consulter un calendrier.
2. Cliquer sur **Mon EDT** en bas à droite.
3. Ajouter un mot présent dans un cours et vérifier que le cours disparaît.
4. Ajouter un cours personnel sur une date visible et vérifier son apparition dans la grille.
5. Recharger la page et vérifier que les réglages sont conservés.

L’accès au calendrier dépend de l’authentification de l’Université de Strasbourg. Si l’équipe de validation demande un accès, fournissez uniquement un compte de test dédié dont l’utilisation a été autorisée par l’établissement, dans le champ privé **Test instructions** du Developer Dashboard. Ne partagez jamais vos identifiants personnels et ne publiez aucun identifiant dans GitHub.
