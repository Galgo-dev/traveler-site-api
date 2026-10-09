# Récapitulatif d'analyse – Réunion n°2 : Commande de voyage
**Projet :** Agence « Horizons Lointains »
**Participants :** Analyste (A) – Mme Nadine Verbeke, gérante (C)
**Objet :** permettre à un client de passer une **demande de voyage** (version 2)
**Prérequis (v1) :** gestion des comptes (client, agent, administrateur) et du catalogue (pays, destinations, activités)

---

## 1. Synthèse

La v2 permet à un **client connecté** de soumettre une demande de voyage portant sur **une seule destination**, avec des activités optionnelles du même pays. **Aucun paiement ni aucune facture** : l'agence rappelle le client. La demande affiche un **prix estimé non contractuel**, figé au moment de la commande. Le personnel (agents et administrateur) consulte, confirme ou annule les demandes, et chaque changement d'état est historisé.

---

## 2. Périmètre

| Inclus (v2) | Exclu / reporté |
|---|---|
| Création d'une demande par un client connecté | Paiement en ligne, facturation |
| Choix d'1 destination + 0..n activités du même pays | Circuits multi-destinations |
| Prix estimé figé | Tarifs saisonniers, prix des vols |
| Cycle de vie : En attente / Confirmée / Annulée | État « Terminée » |
| Consultation client (ses demandes) et personnel (toutes) | Modification d'une demande |
| Historique des changements d'état | Notifications par e-mail |
| Avertissement de doublon | Saisie des noms des autres voyageurs |
| Anonymisation RGPD à la suppression du compte | Vérification de l'âge minimum des activités |
| | Voyages de groupe (> 10 personnes) |

---

## 3. Acteurs et droits

| Action | Visiteur | Client | Agent | Admin |
|---|:-:|:-:|:-:|:-:|
| Passer une demande | ✗ (doit créer un compte) | ✓ | – | – |
| Consulter ses propres demandes | – | ✓ | – | – |
| Annuler sa demande (si « En attente ») | – | ✓ | – | – |
| Modifier une demande | – | ✗ | ✗ | ✗ |
| Consulter toutes les demandes | – | ✗ | ✓ | ✓ |
| Confirmer une demande | – | ✗ | ✓ | ✓ |
| Annuler une demande (avec motif) | – | ✗ | ✓ ⚠️ | ✓ |

⚠️ Annulation par les agents : **à confirmer** (la gérante hésitait à la réserver aux administrateurs).

---

## 4. Données d'une demande de voyage

| Donnée | Obligatoire | Remarque |
|---|:-:|---|
| Client | ✓ | Client connecté (nom et coordonnées issus du compte) |
| Destination | ✓ | Une seule ; doit être active |
| Date de départ | ✓ | Voir règles R1–R3 |
| Date de retour | ✓ | Voir règle R1 |
| Nombre d'adultes | ✓ | ≥ 1 |
| Nombre d'enfants | ✓ | ≥ 0 |
| Activités | ✗ | 0..n, du pays de la destination uniquement |
| Remarques | ✗ | Texte libre (régime, mobilité réduite, événement…) |
| Prix estimé | ✓ (calculé) | Figé à la validation |
| Date de commande | ✓ (auto) | Sert au tri |
| État | ✓ (auto) | « En attente » à la création |
| Motif d'annulation | Si annulée | Obligatoire lors d'une annulation par le personnel |

**Historique d'état** (par changement) : ancien/nouvel état, date, auteur.

---

## 5. Règles métier

| Réf. | Règle | Statut |
|---|---|---|
| R1 | Date de retour **strictement postérieure** à la date de départ | Validé |
| R2 | Date de départ dans le futur | Validé |
| R3 | Départ au moins **7 jours** après la date de commande | **À confirmer** (valeur à paramétrer) |
| R4 | Au moins **1 adulte** | Validé |
| R5 | Maximum **10 voyageurs** (adultes + enfants) | Validé |
| R6 | Activités limitées au **pays de la destination** | Validé |
| R7 | Une demande = **une destination** | Validé |
| R8 | Destination désactivée : non commandable ; les demandes existantes restent inchangées | Validé |
| R9 | Activité désactivée : les demandes existantes la conservent | Validé |
| R10 | L'âge minimum des activités est **affiché**, pas vérifié | Validé |
| R11 | Annulation par le client possible uniquement à l'état « En attente » | Validé |
| R12 | Aucune modification de demande (annuler puis recréer) | Validé |
| R13 | Motif obligatoire pour toute annulation par le personnel | Validé |
| R14 | Avertissement **non bloquant** si le client a déjà une demande « En attente » pour la même destination aux mêmes dates | Validé |
| R15 | Un client ne voit jamais les demandes d'autrui | Validé |

### Calcul du prix estimé
```
Prix unitaire = prix indicatif destination + Σ prix des activités choisies
Prix estimé   = Prix unitaire × (nb adultes + 0,5 × nb enfants)
```
- Mention obligatoire : **« Estimation, non contractuel »**.
- Le prix (et idéalement les prix unitaires utilisés) est **mémorisé** dans la demande : une modification ultérieure des tarifs n'a aucun effet.

---

## 6. Cycle de vie

```
           [validation client]
                   │
                   ▼
            ┌─────────────┐   confirmer (agent/admin)   ┌─────────────┐
            │ En attente  │ ──────────────────────────▶ │  Confirmée  │
            └─────────────┘                             └─────────────┘
                   │                                           │
   annuler (client │ ou personnel + motif)    annuler (personnel + motif)
                   ▼                                           ▼
                        ┌──────────────────────────────┐
                        │           Annulée            │
                        └──────────────────────────────┘
```
- « Annulée » est un état final.
- Une demande « Confirmée » ne peut être annulée que par le personnel (le client doit téléphoner).

---

## 7. Écrans et fonctionnalités

**Côté client**
- Formulaire de demande (destination, dates, voyageurs, activités filtrées par pays avec âge minimum, remarques, prix estimé).
- Message de confirmation immédiat : *« Votre demande a bien été enregistrée, un conseiller vous rappellera sous 48 heures. »*
- Liste de ses demandes : destination, dates, état, prix estimé → détail au clic.
- Bouton « Annuler » visible uniquement à l'état « En attente ».

**Côté personnel**
- Liste de toutes les demandes, triée par **date de commande décroissante**.
- Filtres : état, pays / destination, client, période de départ.
- Détail : toutes les données + **nom, téléphone, e-mail du client** + historique.
- Actions : Confirmer, Annuler (avec motif).

---

## 8. RGPD – Suppression de compte client

- Les données personnelles du client sont effacées.
- Les demandes sont **conservées et anonymisées** (plus de lien nominatif) à des fins statistiques.
- Les remarques en texte libre peuvent contenir des données personnelles (santé, mobilité…) : à purger ou anonymiser également.

---

## 9. Points ouverts / à confirmer

| # | Point | Proposition analyste |
|---|---|---|
| P1 | Délai minimum de 7 jours avant départ | Rendre la valeur paramétrable |
| P2 | Annulation ouverte à tous les agents ou réservée à l'admin | Ouvrir à tout le personnel (décision provisoire) |
| P3 | « Mêmes dates » pour l'avertissement de doublon : dates identiques ou chevauchement ? | Dates identiques en v2 |
| P4 | Historique : l'annulation par le client doit-elle être tracée (auteur = client) ? | Oui, auteur = utilisateur ayant agi |
| P5 | Le client voit-il le motif d'annulation ? | À trancher |
| P6 | Remarques : longueur maximale | Ex. 1 000 caractères |
| P7 | Prix d'activité : par personne ou forfaitaire ? (la formule suppose « par personne ») | À confirmer |
| P8 | Destination sans prix indicatif : comment afficher l'estimation ? | À trancher |
| P9 | Faut-il pouvoir saisir un enfant seul avec d'autres adultes absents ? (couvert par R4) | Clos par R4 |

---

## 10. Évolutions futures identifiées
- Paiement en ligne et facturation
- Circuits multi-destinations
- Notifications e-mail
- État « Terminée »
- Saisie des voyageurs et contrôle de l'âge minimum des activités
- Tarification enfant affinée / saisonnière
- Modification d'une demande
