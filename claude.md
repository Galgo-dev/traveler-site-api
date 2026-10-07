# API de site de voyage

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



## Commandes


## Git

- Dépôt : https://github.com/Galgo-dev/traveler-site-api — branche principale `main`.
- **Chaque nouvelle fonctionnalité se développe sur une nouvelle branche** (`feature/<nom-court>`,
  `docs/<nom>` pour la documentation), jamais directement sur `main`. Intégration par pull request.
- Messages de commit en français.
- Ne push jamais sans ma permission
- Ne supprime aucun commit
- Ne jamais pas la branche main

## Technologies
- Express
- Node.js
- Sequelize

## Structure

Architecture en couches : **routes → middlewares → controllers → services → models**.
Chaque couche n'appelle que la couche immédiatement inférieure.

```
old-traveler-api/
├── bin/
│   └── www                      # Démarrage du serveur HTTP (port, écoute)
├── config/
│   ├── config.js                # Lecture centralisée des variables d'environnement (.env)
│   └── database.js              # Instance Sequelize (connexion à la base)
├── models/
│   ├── index.js                 # Chargement des modèles + déclaration des associations
│   ├── client.model.js
│   ├── agent.model.js           # rôle : agent / administrateur, statut actif / désactivé
│   ├── pays.model.js
│   ├── destination.model.js
│   ├── activite.model.js
│   └── favori.model.js          # (optionnel) table de liaison client ↔ destination/activité
├── migrations/                  # Migrations Sequelize (évolution du schéma)
├── seeders/                     # Données initiales (admin par défaut, pays de test…)
├── routes/
│   ├── index.js                 # Routeur principal : monte tous les routeurs sous /api
│   ├── auth.routes.js           # inscription, connexion, mot de passe oublié
│   ├── clients.routes.js
│   ├── agents.routes.js
│   ├── pays.routes.js
│   ├── destinations.routes.js
│   └── activites.routes.js
├── controllers/                 # Lit req, appelle le service, renvoie la réponse HTTP
│   ├── auth.controller.js
│   ├── clients.controller.js
│   ├── agents.controller.js
│   ├── pays.controller.js
│   ├── destinations.controller.js
│   └── activites.controller.js
├── services/                    # Logique métier et règles de gestion (aucune notion de req/res)
│   ├── auth.service.js
│   ├── clients.service.js       # ex. effacement RGPD des données personnelles
│   ├── agents.service.js
│   ├── pays.service.js          # ex. interdiction de supprimer un pays non vide
│   ├── destinations.service.js
│   └── activites.service.js
├── middlewares/
│   ├── auth.middleware.js       # Vérifie le token (JWT) et charge l'utilisateur
│   ├── role.middleware.js       # Contrôle d'accès : client / agent / administrateur
│   ├── validate.middleware.js   # Applique un schéma de validation au body / query / params
│   └── error.middleware.js      # Gestionnaire d'erreurs global (dernier middleware)
├── validators/                  # Schémas de validation des entrées (un fichier par ressource)
│   ├── auth.validator.js        # dont règles de complexité du mot de passe
│   ├── clients.validator.js
│   ├── pays.validator.js
│   ├── destinations.validator.js
│   └── activites.validator.js
├── utils/
│   ├── ApiError.js              # Classe d'erreur avec code HTTP
│   ├── asyncHandler.js          # Enveloppe les contrôleurs async (évite les try/catch répétés)
│   └── password.js              # Hachage / comparaison (bcrypt)
├── tests/
│   ├── unit/                    # Tests des services
│   └── integration/             # Tests des routes (supertest)
├── public/                      # Fichiers statiques éventuels
├── app.js                       # Création de l'app Express : middlewares globaux, routes, erreurs
├── .env                         # Secrets locaux — jamais commité
├── .env.example                 # Modèle des variables attendues — commité
├── .gitignore
├── package.json
└── claude.md
```

### Conventions

- **Nommage des fichiers** : `<ressource>.<couche>.js` (ex. `pays.service.js`), ressources en français et au pluriel pour les routes.
- **Routes** : préfixe `/api`, noms de ressources au pluriel (`/api/pays`, `/api/destinations/:id`, `/api/pays/:id/activites`).
- **Controllers** : minces — pas de requête Sequelize directe, pas de règle métier.
- **Services** : toute la logique métier et les règles de gestion (section 5) ; ils lèvent des `ApiError`.
- **Models** : définition des champs et contraintes uniquement ; les associations sont déclarées dans `models/index.js`.
- **Masquage plutôt que suppression** : champ `actif` (booléen) sur pays, destinations et activités ; les routes publiques filtrent `actif = true`.
- **Erreurs** : toujours propagées via `next(err)` vers `error.middleware.js`, réponse JSON uniforme `{ error: { status, message } }`.
- **Configuration** : aucune lecture directe de `process.env` hors de `config/config.js`.


## Règles du projet
- Ne lis jamais toi-même le fichier .env
- Accède a la DB postrgres depuis un docker.
- Utilise pour les appel en DB. DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT