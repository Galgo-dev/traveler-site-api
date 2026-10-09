# API Old Traveler — Horizons Lointains

API REST (Node.js, Express, Sequelize, PostgreSQL sous Docker) du site de l'agence : comptes clients et agents, catalogue pays / destinations / activités. Le cahier des charges est dans `claude.md`.

## Démarrage

1. `npm install`
2. Copier `.env.example` en `.env` et renseigner les valeurs (`DB_*`, `JWT_SECRET`, `ADMIN_*`).
3. Lancer Docker Desktop.
4. Première fois : `npm run db:start:seed` (crée l'administrateur et un catalogue de démo).
5. `npm start` : démarre les conteneurs PostgreSQL et Mailpit, applique les migrations puis lance l'API sur `http://localhost:3000/api`.

| Commande | Effet |
|---|---|
| `npm start` | Base + migrations + API |
| `npm test` | Tests unitaires et d'intégration (base séparée `<DB_DATABASE>_test`) |
| `npm run db:stop` | Arrête le conteneur |
| `npm run db:reset` | Efface la base et la recrée avec les données de démo |
| `npm run db:psql` | Console SQL dans le conteneur |

## E-mails

Le lien « mot de passe oublié » est envoyé par SMTP (nodemailer), configuré par les variables `SMTP_*` et `MAIL_FROM` du `.env` (voir `.env.example`).

- **Développement** : `npm start` lance aussi **Mailpit** (conteneur `old-traveler-mailpit`), qui capture les mails sans les envoyer. Avec `SMTP_HOST=localhost` et `SMTP_PORT=1025`, les mails sont visibles sur http://localhost:8025.
- **Production** : renseigner le serveur SMTP réel (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`).
- Sans `SMTP_HOST`, les mails sont simplement affichés dans la console du serveur.

Si l'envoi échoue, l'erreur est journalisée côté serveur et la réponse reste la même, pour ne pas révéler si un compte existe.

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
| POST | `/mot-de-passe-oublie` | Public | Envoie un e-mail avec un lien de réinitialisation (voir « E-mails ») |
| POST | `/reinitialisation` | Public | `{ token, motDePasse }` |
| PATCH | `/mot-de-passe` | Client, Personnel | Changer son propre mot de passe `{ motDePasseActuel, nouveauMotDePasse }` |

Mot de passe : au moins 10 caractères, une majuscule, une minuscule, un chiffre, et pas un mot de passe courant.

### Clients — `/api/clients`
| Méthode | Route | Accès | Description |
|---|---|---|---|
| GET / PATCH | `/moi` | Client | Consulter / modifier son profil |
| DELETE | `/moi` | Client | Supprimer son compte (RGPD), `{ motDePasse }` |
| GET | `/moi/favoris` | Client | Ses favoris visibles : `{ destinations, activites }` |
| PUT | `/moi/favoris/destinations/:id` | Client | Ajouter une destination (201 créé, 200 déjà présent) |
| DELETE | `/moi/favoris/destinations/:id` | Client | Retirer une destination |
| PUT | `/moi/favoris/activites/:id` | Client | Ajouter une activité (201 créé, 200 déjà présent) |
| DELETE | `/moi/favoris/activites/:id` | Client | Retirer une activité |
| GET | `/` | Personnel | Liste des clients (`q` : nom, prénom, e-mail, téléphone) |
| GET | `/:id` | Personnel | Dossier d'un client |
| GET | `/:id/favoris` | Personnel | Favoris d'un client, éléments masqués compris |
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

### Demandes de voyage (v2) — `/api/demandes`
| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/estimation` | Client | Prix estimé et avertissement de doublon, sans rien enregistrer |
| POST | `/` | Client | Passer une demande (`destinationId`, `dateDepart`, `dateRetour`, `nbAdultes`, `nbEnfants`, `activiteIds`, `remarques`) |
| GET | `/` | Client / Personnel | Client : ses demandes. Personnel : toutes, filtres `etat`, `paysId`, `destinationId`, `clientId`, `q` (client), `departDu`, `departAu` |
| GET | `/:id` | Client / Personnel | Détail (personnel : coordonnées du client et historique) |
| POST | `/:id/confirmation` | Personnel | En attente → Confirmée |
| POST | `/:id/annulation` | Client / Personnel | Client : si en attente. Personnel : `motif` obligatoire |

- **Prix estimé** = (prix indicatif destination + Σ prix des activités) × (adultes + 0,5 × enfants), figé à la commande, toujours accompagné de « Estimation, non contractuel ». Sans prix indicatif pour la destination, aucune estimation n'est calculée (`prixEstime: null`).
- **Règles** : départ au moins `DEMANDE_DELAI_MIN_JOURS` jours après la commande (7 par défaut), retour après le départ, 1 à 10 voyageurs dont au moins 1 adulte, destination active et activités actives du même pays. Une demande ne se modifie pas : on l'annule puis on en crée une nouvelle.
- **RGPD** : à la suppression d'un compte, ses demandes sont conservées mais anonymisées, et leurs remarques sont effacées.
