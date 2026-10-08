# Analyse des besoins – Agence « Horizons Lointains »

> Synthèse de la première réunion analyste / cliente (Mme Nadine Verbeke, gérante).
> Les éléments anecdotiques (café, neveu, logo, voisin, etc.) ont été écartés.

---

## 1. Contexte

- Petite agence de voyage familiale (fondée en 1987), **7 personnes dont 4 conseillers**.
- Situation actuelle : données dispersées dans des classeurs, fichiers Excel et notes papier → informations perdues, clients confondus (homonymes).
- **Objectif de la V1** : une application web centralisant les **comptes** (clients et agents) et un **catalogue** propre (pays, destinations, activités).

---

## 2. Acteurs et rôles

| Rôle | Création du compte | Description |
|---|---|---|
| **Visiteur** (non connecté) | — | Consulte le catalogue *(à confirmer)* |
| **Client** | S'inscrit lui-même | Consulte le catalogue, gère son profil |
| **Agent** | Créé par un administrateur | Gère le catalogue, consulte les clients |
| **Administrateur** | — (actuellement : la gérante uniquement) | Agent + gestion des comptes agents |

> Proposition de l'analyste (à valider) : **deux rôles côté personnel**, *agent* et *administrateur*.

---

## 3. Fonctionnalités

### 3.1 Client

- S'inscrire (nom, prénom, e-mail, téléphone, date de naissance, mot de passe).
- Se connecter avec **e-mail + mot de passe**.
- Récupérer son mot de passe oublié.
- Consulter le catalogue : pays, destinations, activités par pays.
- Modifier ses informations personnelles.
- Demander la **suppression de son compte** (RGPD).
- *(Peut-être)* Gérer des **favoris** (nécessite un compte).

### 3.2 Agent

- Se connecter (identifiants fournis par l'administrateur).
- **CRUD du catalogue** : pays, destinations, activités.
- Masquer / réactiver un élément du catalogue.
- Consulter la liste des clients et leur dossier.
- Modifier les informations d'un client (correction), **sauf son mot de passe**.

### 3.3 Administrateur

- Toutes les fonctionnalités de l'agent.
- Créer les comptes agents.
- Désactiver les comptes agents (départ d'un employé).

### 3.4 Recherche et navigation (côté client)

- Parcourir la liste des pays → voir les destinations et activités d'un pays.
- Recherche par **mot-clé**.
- Filtre par **catégorie d'activité**.
- Filtre par **budget**.
- Interface volontairement simple.

---

## 4. Modèle de données

### 4.1 Entités et attributs

**Client**
- nom, prénom
- e-mail (**unique**, identifiant de connexion)
- téléphone
- date de naissance
- mot de passe

**Agent**
- nom, prénom
- e-mail professionnel (identifiant de connexion)
- mot de passe
- numéro d'employé *(demandé pour la paie, hors besoin logiciel)*
- rôle : agent / administrateur
- statut : actif / désactivé

**Pays**
- nom
- continent
- langue principale
- monnaie
- description courte
- visa requis pour les Belges (oui/non)
- décalage horaire avec la Belgique
- statut actif / masqué

**Destination** (ville ou région où l'on séjourne)
- nom
- description
- période idéale (ex. « de mai à septembre »)
- prix indicatif « à partir de »
- photo (si possible)
- statut actif / masqué

**Activité**
- nom
- description
- catégorie : culture, détente, sport, gastronomie, aventure
- durée (en heures ou en jours)
- prix par personne
- niveau de difficulté (pour les activités sportives)
- âge minimum
- statut actif / masqué

### 4.2 Relations

- **Pays 1 — N Destination** : une destination appartient à **un seul** pays, obligatoire ; un pays a plusieurs destinations.
- **Pays 1 — N Activité** : une activité appartient à **un seul** pays ; une même activité n'est pas partagée entre pays (deux « cours de cuisine » dans deux pays = deux activités distinctes).
- **Destination 0..1 — N Activité** : lien **optionnel** vers une destination précise (évolution possible).
- *(Peut-être)* **Client N — N Destination/Activité** via les favoris.

---

## 5. Règles de gestion

1. Un e-mail = un seul compte client.
2. Un client ne peut pas se déclarer agent ; seul un administrateur crée les comptes agents.
3. Mot de passe avec un **niveau de sécurité minimal** (pas de « 123456 »).
4. Un agent ne peut **jamais** modifier le mot de passe d'un client.
5. Un client ne voit **jamais** les comptes des autres clients ni ceux des agents.
6. Seuls les agents créent / modifient / suppriment pays, destinations et activités.
7. Une destination ne peut pas exister sans pays.
8. Un pays **ne peut pas être supprimé** tant qu'il contient des destinations ou des activités.
9. Préférer le **masquage** (actif / inactif) à la suppression : élément invisible pour les clients mais conservé en base.
10. Suppression de compte client sur demande → **effacement des données personnelles** (RGPD).

---

## 6. Exigences non fonctionnelles

- **Plateformes** : ordinateur et téléphone (responsive).
- **Accessibilité / ergonomie** : grosses polices, gros boutons, navigation simple (clientèle d'environ 58 ans en moyenne).
- **Langue** : français (néerlandais éventuellement plus tard, hors V1).
- **Volumétrie** : ~20 pays, ~50 destinations, ~200 activités, ~1 000 clients (jusqu'à ~2 000 à terme).
- **Conformité** : RGPD.
- **Sécurité** : mots de passe robustes, cloisonnement des données par rôle.

---

## 7. Hors périmètre (V1)

- Paiement en ligne
- Réservation
- Facturation
- E-mails promotionnels
- Version néerlandaise
- Logo / identité visuelle (logo existant : bleu et blanc, avion en papier)

---

## 8. Points à confirmer

| # | Point | Hypothèse actuelle |
|---|---|---|
| 1 | Accès au catalogue sans connexion | Oui (pour donner envie) |
| 2 | Gestion des favoris | « Peut-être » |
| 3 | Deux rôles personnel (agent / administrateur) | Proposé par l'analyste, à valider |
| 4 | Rattachement des activités | Au pays ; destination optionnelle |
| 5 | Âge minimum des activités | « Ça serait bien » → à confirmer comme obligatoire ou non |
| 6 | Règles exactes de complexité du mot de passe | « Un minimum sérieux » → à définir |
| 7 | Utilité du numéro d'employé dans l'application | Hors besoin fonctionnel, à confirmer |
