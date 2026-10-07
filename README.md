# API Old Traveler — Horizons Lointains

API REST (Node.js, Express, Sequelize, PostgreSQL sous Docker) du site de l'agence : comptes clients et agents, catalogue pays / destinations / activités. Le cahier des charges est dans `claude.md`.

## Démarrage

1. `npm install`
2. Copier `.env.example` en `.env` et renseigner les valeurs (`DB_*`, `JWT_SECRET`, `ADMIN_*`).
3. Lancer Docker Desktop.
4. Première fois : `npm run db:start:seed` (crée l'administrateur et un catalogue de démo).
5. `npm start` : démarre le conteneur PostgreSQL, applique les migrations puis lance l'API sur `http://localhost:3000/api`.

| Commande | Effet |
|---|---|
| `npm start` | Base + migrations + API |
| `npm test` | Tests unitaires et d'intégration (base séparée `<DB_DATABASE>_test`) |
| `npm run db:stop` | Arrête le conteneur |
| `npm run db:reset` | Efface la base et la recrée avec les données de démo |
| `npm run db:psql` | Console SQL dans le conteneur |

## Authentification

`POST /api/auth/connexion` (client) ou `POST /api/auth/agents/connexion` (personnel) renvoie `{ token, utilisateur }`.
Envoyer ensuite l'en-tête `Authorization: Bearer <token>`.

Erreurs : toujours `{ "error": { "status", "message", "details?" } }`.
Listes : `{ "donnees": [...], "pagination": { page, limite, total, pages } }` (paramètres `page`, `limite`).

## Routes

Accès : **Public** (sans connexion), **Client**, **Personnel** (agent ou administrateur), **Admin** (administrateur).

### Authentification — `/api/auth`
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/inscription` | Public | Inscription client (nom, prenom, email, telephone, dateNaissance, motDePasse) |
| POST | `/connexion` | Public | Connexion client |
| POST | `/agents/connexion` | Public | Connexion du personnel |
| POST | `/mot-de-passe-oublie` | Public | Envoie un lien de réinitialisation (affiché dans la console en V1) |
| POST | `/reinitialisation` | Public | `{ token, motDePasse }` |
| PATCH | `/mot-de-passe` | Client, Personnel | Changer son propre mot de passe `{ motDePasseActuel, nouveauMotDePasse }` |

Mot de passe : au moins 10 caractères, une majuscule, une minuscule, un chiffre, et pas un mot de passe courant.

### Clients — `/api/clients`
| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET / PATCH | `/moi` | Client | Consulter / modifier son profil |
| DELETE | `/moi` | Client | Supprimer son compte (RGPD), `{ motDePasse }` |
| GET | `/` | Personnel | Liste des clients (`q` : nom, prénom, e-mail, téléphone) |
| GET | `/:id` | Personnel | Dossier d'un client |
| PATCH | `/:id` | Personnel | Corriger un client (jamais le mot de passe) |
| DELETE | `/:id` | Personnel | Suppression RGPD sur demande du client |

### Personnel — `/api/agents`
| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/moi` | Personnel | Son propre compte |
| GET | `/` | Admin | Liste (`q`, `actif`, `role`) |
| POST | `/` | Admin | Créer un agent ou un administrateur |
| GET / PATCH | `/:id` | Admin | Consulter / modifier |
| PATCH | `/:id/statut` | Admin | `{ actif: false }` désactive (départ), `true` réactive |
| PUT | `/:id/mot-de-passe` | Admin | Définir un nouveau mot de passe pour un agent |

### Catalogue — `/api/pays`, `/api/destinations`, `/api/activites`
| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET | `/` | Public | Liste des éléments actifs (le personnel peut ajouter `inclureMasques=true`) |
| GET | `/:id` | Public | Détail (pays → ses destinations ; destination → ses activités) |
| POST | `/` | Personnel | Créer |
| PATCH | `/:id` | Personnel | Modifier |
| PATCH | `/:id/statut` | Personnel | Masquer `{ actif: false }` / réactiver `{ actif: true }` |
| DELETE | `/:id` | Personnel | Supprimer (un pays non vide est refusé : 409) |
| GET | `/api/pays/:id/destinations` | Public | Destinations d'un pays |
| GET | `/api/pays/:id/activites` | Public | Activités d'un pays |

Filtres : `q` (mot-clé, insensible aux accents), `continent` (pays), `paysId`, `budgetMax` (destinations et activités), `destinationId`, `categorie` (`culture`, `detente`, `sport`, `gastronomie`, `aventure`).

### Recherche — `GET /api/recherche` (public)
`q`, `categorie`, `budgetMax` → `{ pays, destinations, activites }` (éléments visibles uniquement).
