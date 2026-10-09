# Récapitulatif d'analyse – Réunion n°3 : Avis clients
**Projet :** Agence « Horizons Lointains »
**Participants :** Analyste (A) – Mme Nadine Verbeke, gérante (C)
**Objet :** permettre aux clients de laisser un **avis** sur leurs voyages, modéré par le personnel et consultable par le public (version 3)
**Prérequis :** comptes (client, agent, administrateur), catalogue (pays, destinations, activités), commandes (En attente, Confirmée, Annulée)

---

## 1. Synthèse

Un client ayant **réellement effectué** un voyage peut publier **un avis par commande** sur la destination : une note de 1 à 5 étoiles, un titre et un commentaire facultatif. Chaque avis passe par une **modération** du personnel avant publication. L'agence peut y apporter **une réponse publique**. Les fiches et la liste des destinations affichent la **note moyenne** et le **nombre d'avis publiés**. Le client peut modifier ou supprimer son avis pendant **30 jours**.

**Décision importante :** l'état « Terminée » d'une commande reste inutile. Un voyage terminé se **déduit** d'une commande « Confirmée » dont la date de retour est dépassée.

---

## 2. Périmètre

| Inclus (v3) | Exclu / reporté |
|---|---|
| Avis sur la destination d'une commande terminée | Photos dans les avis |
| Modération (validation / refus avec motif) | Signalement d'avis par les autres clients |
| Modification et suppression par le client (30 jours) | Notifications par e-mail |
| Réponse unique de l'agence | Discussion / fil de réponses (forum) |
| Note moyenne et nombre d'avis par destination | Modification du texte d'un client par le personnel |
| Tri et filtre des avis côté public | Ajout d'un état « Terminée » aux commandes |
| Liste de modération et compteur pour le personnel | |
| Anonymat au choix du client | |
| *Souhaitable :* notes facultatives sur les activités | |
| *Souhaitable :* 5 derniers avis 5★ en page d'accueil | |

---

## 3. Acteurs et droits

| Action | Visiteur | Client | Agent | Admin |
|---|:-:|:-:|:-:|:-:|
| Lire les avis publiés, notes moyennes | ✓ | ✓ | ✓ | ✓ |
| Rédiger un avis (commande éligible) | ✗ | ✓ | – | – |
| Modifier / supprimer son avis (≤ 30 jours) | – | ✓ | – | – |
| Voir l'état et le motif de refus de ses avis | – | ✓ | – | – |
| Valider / refuser un avis en attente | – | ✗ | ✓ | ✓ |
| Masquer un avis publié (→ Refusé, avec motif) | – | ✗ | ✓ | ✓ |
| Rédiger / modifier la réponse de l'agence | – | ✗ | ✓ | ✓ |
| Voir l'identité réelle d'un auteur anonyme | – | ✗ | ✓ | ✓ |
| Modifier le texte d'un client | ✗ | – | ✗ | ✗ |

---

## 4. Données

### 4.1 Avis
| Donnée | Obligatoire | Remarque |
|---|:-:|---|
| Commande | ✓ | Lien 1–1 : un seul avis par commande |
| Destination | ✓ (déduite) | Celle de la commande |
| Client | ✓ (déduit) | Anonymisé si le compte est supprimé |
| Note | ✓ | Entier de 1 à 5 |
| Titre | ✓ | Court (longueur à préciser) |
| Commentaire | Conditionnel | Max 1 000 caractères ; obligatoire si note ≤ 2 |
| Anonyme | ✓ | Booléen, faux par défaut |
| État | ✓ (auto) | En attente de validation / Publié / Refusé |
| Motif de refus | Si Refusé | Visible par le client |
| Date de création | ✓ (auto) | Point de départ du délai de 30 jours (à confirmer) |
| Date de publication | Si publié | Affichée au public |
| Date de dernière modification | ✓ (auto) | |
| Modérateur et date de modération | Si modéré | Traçabilité (recommandé, cohérent avec l'historique des commandes) |

### 4.2 Réponse de l'agence (0..1 par avis)
| Donnée | Remarque |
|---|---|
| Texte | Longueur max à préciser |
| Agent auteur | Affiché par son prénom (ou nom) |
| Date de réponse / de modification | |

### 4.3 Note d'activité (souhaitable, 0..n par avis)
| Donnée | Remarque |
|---|---|
| Activité | Une activité choisie dans la commande |
| Note | 1 à 5 |

---

## 5. Règles métier

| Réf. | Règle | Statut |
|---|---|---|
| R1 | Seul un client **connecté** peut rédiger un avis | Validé |
| R2 | La commande doit être à l'état **« Confirmée »** | Validé |
| R3 | La **date de retour** de la commande doit être **dépassée** | Validé |
| R4 | **Un seul avis par commande** (un nouveau voyage = une nouvelle commande = un nouvel avis) | Validé |
| R5 | L'avis porte sur la **destination** de la commande | Validé |
| R6 | Note **obligatoire**, entière, de **1 à 5** | Validé |
| R7 | Commentaire de **1 000 caractères** maximum | Validé |
| R8 | Commentaire **obligatoire si note ≤ 2** | Validé |
| R9 | Le client peut modifier ou supprimer son avis pendant **30 jours** ; ensuite l'avis est figé | Validé |
| R10 | À sa création, l'avis est **« En attente de validation »** | Validé |
| R11 | Tout refus ou masquage par le personnel exige un **motif** | Validé |
| R12 | Toute modification par le client (avis publié ou refusé) renvoie l'avis **« En attente de validation »** et le **retire de l'affichage public** | Validé |
| R13 | Le personnel ne modifie **jamais** le texte d'un client | Validé |
| R14 | **Une seule réponse** de l'agence par avis, modifiable | Validé |
| R15 | Seuls les avis **« Publié »** comptent dans la moyenne et le nombre d'avis | Validé |
| R16 | Destination sans avis publié : afficher **« Pas encore d'avis »** (jamais « 0 étoile ») | Validé |
| R17 | Avis anonyme : le public voit **« Voyageur anonyme »**, le personnel voit toujours le vrai client et la commande | Validé |
| R18 | Destination désactivée : ses avis sont conservés mais invisibles ; ils réapparaissent à la réactivation | Validé |
| R19 | Suppression du compte client : ses avis sont conservés et anonymisés (« Voyageur anonyme », sans lien avec le client) | Validé |
| R20 | Notes d'activités : facultatives, limitées aux activités de la commande | Souhaitable |

---

## 6. Cycle de vie d'un avis

```
                 [soumission client]
                         │
                         ▼
          ┌──────────────────────────────┐
   ┌────▶ │  En attente de validation    │ ◀───────────┐
   │      └──────────────────────────────┘             │
   │           │ valider            │ refuser + motif  │
   │           ▼                    ▼                  │
   │     ┌───────────┐  masquer  ┌───────────┐         │
   │     │  Publié   │ ────────▶ │  Refusé   │         │
   │     └───────────┘  + motif  └───────────┘         │
   │           │                       │               │
   └───────────┘                       └───────────────┘
   modification client (≤ 30 j)    correction client (≤ 30 j)

   Suppression par le client : possible depuis tout état, pendant 30 jours.
   Après 30 jours : plus aucune action du client ; l'état devient définitif
   (le personnel peut encore masquer un avis publié).
```

---

## 7. Écrans et fonctionnalités

**Public (visiteur et client)**
- **Liste des destinations** : « Marrakech ★ 4,6 (23 avis) » ou « Pas encore d'avis ».
- **Fiche destination** : note moyenne sur 5, nombre d'avis, liste des avis publiés.
  - Chaque avis affiche : note, titre, commentaire, auteur (« Julie D. » ou « Voyageur anonyme »), date du séjour (mois et année), date de publication et réponse de l'agence (texte et prénom de l'agent).
  - Tri : plus récents (par défaut) ou meilleures notes.
  - Filtre : nombre d'étoiles.
- *Souhaitable :* page d'accueil avec les **5 derniers avis publiés à 5★**.

**Espace client**
- Sur chaque commande éligible : bouton « Donner mon avis ».
- Formulaire : note, titre, commentaire, case « Rester anonyme », *(souhaitable)* notes des activités.
- Liste de ses avis avec leur état et le motif de refus éventuel.
- Actions « Modifier » et « Supprimer » visibles pendant 30 jours.

**Personnel (agents et administrateur)**
- **Compteur sur le tableau de bord** : « N avis à modérer ».
- **File de modération** : avis en attente, **les plus anciens d'abord**.
- **Liste de tous les avis** avec filtres (état, destination, pays, note, période) et affichage prioritaire des **avis négatifs**.
- **Détail** : avis, client réel (y compris s'il est anonyme), commande liée, coordonnées pour le rappeler.
- Actions : Valider, Refuser (motif), Masquer (motif), Répondre ou modifier la réponse.

---

## 8. RGPD et conservation

- Si le client supprime son avis (dans les 30 jours), l'avis est effacé. La gérante l'accepte, bien que cela permette à un client de retirer un avis négatif.
- Si le client supprime son compte, ses avis sont conservés mais anonymisés : le lien vers le client est rompu et son nom effacé. Ce traitement est cohérent avec celui des commandes.
- Le titre et le commentaire peuvent contenir des données personnelles. La modération sert notamment à refuser les avis qui contiennent des coordonnées.

---

## 9. Points ouverts / à confirmer

| # | Point | Proposition analyste |
|---|---|---|
| P1 | Point de départ du délai de 30 jours : date de création, de publication ou de dernière modification ? | Date de **création** de l'avis |
| P2 | Délai maximal pour **rédiger** un avis après le retour (6 mois, 1 an, illimité ?) | À trancher |
| P3 | Le client voit le motif de refus, alors que la gérante l'a d'abord décrit comme « interne » | Le motif est visible : prévoir une liste de motifs standard formulés pour le client |
| P4 | Longueur maximale du titre et de la réponse de l'agence | Titre ≤ 100 caractères ; réponse ≤ 1 000 caractères |
| P5 | Changer uniquement l'option d'anonymat déclenche-t-il une nouvelle modération ? | Non (pas de changement de contenu) |
| P6 | Une réponse peut-elle porter sur un avis non publié ? Est-elle conservée quand l'avis est masqué ? | Réponse uniquement sur un avis publié, conservée mais masquée avec lui |
| P7 | Qui peut modifier une réponse : son auteur seulement ou tout agent ? Quel nom afficher ensuite ? | Tout agent ; affiche le dernier auteur |
| P8 | Définition d'un « avis négatif » pour l'affichage prioritaire | Note ≤ 2 |
| P9 | Format de la moyenne | Une décimale, virgule (« 4,6 ») |
| P10 | Date de séjour affichée : départ ou retour ? | Mois et année de **départ** |
| P11 | Notes d'activités : y a-t-il une moyenne par activité ? Où l'afficher ? Sont-elles modérées ? | Note seule (sans texte), sans modération ; moyenne affichée sur l'activité |
| P12 | Une destination désactivée peut-elle encore recevoir des avis de clients ayant fait le voyage ? | Oui, mais ils restent invisibles tant que la destination est désactivée |
| P13 | Que devient l'avis d'un client qui modifie un avis « Refusé » après 30 jours ? | Impossible : l'avis reste « Refusé » définitivement |
| P14 | Historique des actions de modération (qui a validé, refusé ou masqué, et quand) | Oui, comme pour les commandes |

---

## 10. Impacts sur l'existant

- **Commandes :** aucun nouvel état ; ajouter la notion calculée « voyage terminé » (Confirmée et date de retour < aujourd'hui).
- **Catalogue :** la liste et la fiche des destinations affichent la note moyenne et le nombre d'avis (prévoir un calcul optimisé ou une valeur mise à jour à chaque modération).
- **Tableau de bord du personnel :** nouveau compteur « avis à modérer ».
- **Suppression de compte :** étendre l'anonymisation aux avis.

---

## 11. Évolutions futures identifiées
- Photos dans les avis (avec modération dédiée)
- Signalement d'avis par les utilisateurs
- Notifications e-mail (avis validé ou refusé, réponse de l'agence)
- Notes et avis détaillés sur les activités, s'ils ne sont pas faits en v3
