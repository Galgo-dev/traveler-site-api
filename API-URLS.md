# URL d'appel de l'API

URL de base en local : `http://localhost:3000/api` (port défini par `PORT`, 3000 par défaut).

**Authentification** : les routes protégées attendent l'en-tête
`Authorization: Bearer <token>`. Le token est renvoyé par les routes de connexion.

**Niveaux d'accès**

| Accès | Signification |
|---|---|
| Public | Sans connexion |
| Client | Client connecté |
| Personnel | Agent ou administrateur connecté |
| Admin | Administrateur uniquement |
| Connecté | Tout utilisateur connecté (client ou personnel) |

**Erreurs** : réponse JSON uniforme `{ "error": { "status": 400, "message": "..." } }`.

---

## Santé

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/sante` | Public | Vérifie que l'API répond |

---

## Authentification — `/api/auth`

Les routes `POST` ci-dessous sont limitées en nombre de tentatives (réponse 429 au-delà).

| Méthode | URL | Accès | Corps (JSON) |
|---|---|---|---|
| POST | `http://localhost:3000/api/auth/inscription` | Public | `nom`, `prenom`, `email`, `telephone`, `dateNaissance`, `motDePasse` |
| POST | `http://localhost:3000/api/auth/connexion` | Public | `email`, `motDePasse` — connexion client |
| POST | `http://localhost:3000/api/auth/agents/connexion` | Public | `email`, `motDePasse` — connexion du personnel |
| POST | `http://localhost:3000/api/auth/mot-de-passe-oublie` | Public | `email` — envoie un e-mail avec un lien `FRONT_URL/reinitialisation-mot-de-passe?token=…` (en dev : visible sur http://localhost:8025) |
| POST | `http://localhost:3000/api/auth/reinitialisation` | Public | `token` (64 caractères hexadécimaux), `motDePasse` |
| PATCH | `http://localhost:3000/api/auth/mot-de-passe` | Connecté | `motDePasseActuel`, `nouveauMotDePasse` |

Mot de passe : au moins 10 caractères, une majuscule, une minuscule et un chiffre ; les mots de passe trop courants sont refusés.

---

## Clients — `/api/clients`

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/clients/moi` | Client | Voir son profil |
| PATCH | `http://localhost:3000/api/clients/moi` | Client | Modifier son profil (`nom`, `prenom`, `email`, `telephone`, `dateNaissance`) |
| DELETE | `http://localhost:3000/api/clients/moi` | Client | Supprimer son compte (RGPD) — corps : `motDePasse` |
| POST | `http://localhost:3000/api/clients/moi/demande-suppression` | Client | Demander la suppression de son compte, traitée par un agent — corps : `motDePasse` (400 si incorrect). Réponse : le profil avec `suppressionDemandeeLe` |
| DELETE | `http://localhost:3000/api/clients/moi/demande-suppression` | Client | Annuler sa demande de suppression. Réponse : le profil |
| GET | `http://localhost:3000/api/clients` | Personnel | Liste des clients — query : `page`, `limite`, `q`, `suppressionDemandee` (`true` : demandes de suppression en attente, les plus anciennes d'abord) |
| GET | `http://localhost:3000/api/clients/:id` | Personnel | Dossier d'un client |
| GET | `http://localhost:3000/api/clients/:id/favoris` | Personnel | Favoris d'un client, éléments masqués compris |
| PATCH | `http://localhost:3000/api/clients/:id` | Personnel | Corriger un client (jamais le mot de passe) |
| DELETE | `http://localhost:3000/api/clients/:id` | Personnel | Effacement RGPD sur demande du client |

### Favoris du client connecté

`:id` est l'identifiant de la destination ou de l'activité (pas de corps à envoyer).

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/clients/moi/favoris` | Client | Ses favoris visibles — réponse : `{ "destinations": [...], "activites": [...] }` |
| PUT | `http://localhost:3000/api/clients/moi/favoris/destinations/:id` | Client | Ajouter une destination (201 si ajoutée, 200 si déjà présente) |
| DELETE | `http://localhost:3000/api/clients/moi/favoris/destinations/:id` | Client | Retirer une destination (204 ; 404 si absente des favoris) |
| PUT | `http://localhost:3000/api/clients/moi/favoris/activites/:id` | Client | Ajouter une activité (201 si ajoutée, 200 si déjà présente) |
| DELETE | `http://localhost:3000/api/clients/moi/favoris/activites/:id` | Client | Retirer une activité (204 ; 404 si absente des favoris) |

Seuls les éléments visibles du catalogue peuvent être ajoutés (404 sinon). Un élément masqué ensuite disparaît des favoris du client sans être supprimé, et réapparaît s'il est réactivé. Les favoris sont effacés avec le compte du client.

---

## Personnel — `/api/agents`

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/agents/moi` | Personnel | Voir son propre compte |
| GET | `http://localhost:3000/api/agents` | Admin | Liste — query : `page`, `limite`, `q`, `actif`, `role` |
| POST | `http://localhost:3000/api/agents` | Admin | Créer un compte : `nom`, `prenom`, `email`, `motDePasse`, `numeroEmploye`, `role` (`agent` / `administrateur`) |
| GET | `http://localhost:3000/api/agents/:id` | Admin | Détail d'un compte |
| PATCH | `http://localhost:3000/api/agents/:id` | Admin | Modifier : `nom`, `prenom`, `email`, `numeroEmploye`, `role` |
| PATCH | `http://localhost:3000/api/agents/:id/statut` | Admin | Activer / désactiver — corps : `{ "actif": false }` |
| PUT | `http://localhost:3000/api/agents/:id/mot-de-passe` | Admin | Définir un nouveau mot de passe — corps : `motDePasse` |

---

## Pays — `/api/pays`

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/pays` | Public | Liste — query : `page`, `limite`, `q`, `continent`, `inclureMasques` |
| GET | `http://localhost:3000/api/pays/:id` | Public | Détail d'un pays |
| GET | `http://localhost:3000/api/pays/:id/destinations` | Public | Destinations du pays (mêmes filtres que `/api/destinations`) |
| GET | `http://localhost:3000/api/pays/:id/activites` | Public | Activités du pays (mêmes filtres que `/api/activites`) |
| POST | `http://localhost:3000/api/pays` | Personnel | Créer : `nom`, `continent`, `languePrincipale`, `monnaie` (obligatoires), `descriptionCourte`, `visaRequis`, `decalageHoraire`, `actif` |
| PATCH | `http://localhost:3000/api/pays/:id` | Personnel | Modifier (au moins un champ) |
| PATCH | `http://localhost:3000/api/pays/:id/statut` | Personnel | Masquer / réactiver — corps : `{ "actif": false }` |
| DELETE | `http://localhost:3000/api/pays/:id` | Personnel | Supprimer (refusé si le pays contient des destinations ou activités) |

Continents : `Afrique`, `Amérique du Nord`, `Amérique du Sud`, `Asie`, `Europe`, `Océanie`, `Antarctique`.

---

## Destinations — `/api/destinations`

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/destinations` | Public | Liste — query : `page`, `limite`, `q`, `paysId`, `budgetMax`, `inclureMasques` |
| GET | `http://localhost:3000/api/destinations/:id` | Public | Détail d'une destination |
| POST | `http://localhost:3000/api/destinations` | Personnel | Créer : `paysId`, `nom` (obligatoires), `description`, `periodeIdeale`, `prixAPartirDe`, `photoUrl`, `actif` |
| PATCH | `http://localhost:3000/api/destinations/:id` | Personnel | Modifier (au moins un champ) |
| PATCH | `http://localhost:3000/api/destinations/:id/statut` | Personnel | Masquer / réactiver — corps : `{ "actif": false }` |
| DELETE | `http://localhost:3000/api/destinations/:id` | Personnel | Supprimer |

---

## Activités — `/api/activites`

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/activites` | Public | Liste — query : `page`, `limite`, `q`, `paysId`, `destinationId`, `categorie`, `budgetMax`, `inclureMasques` |
| GET | `http://localhost:3000/api/activites/:id` | Public | Détail d'une activité |
| POST | `http://localhost:3000/api/activites` | Personnel | Créer : `paysId`, `nom`, `categorie`, `duree`, `prixParPersonne` (obligatoires), `destinationId`, `description`, `dureeUnite`, `niveauDifficulte`, `ageMinimum`, `actif` |
| PATCH | `http://localhost:3000/api/activites/:id` | Personnel | Modifier (au moins un champ) |
| PATCH | `http://localhost:3000/api/activites/:id/statut` | Personnel | Masquer / réactiver — corps : `{ "actif": false }` |
| DELETE | `http://localhost:3000/api/activites/:id` | Personnel | Supprimer |

Valeurs autorisées :
- `categorie` : `culture`, `detente`, `sport`, `gastronomie`, `aventure`
- `dureeUnite` : `heures`, `jours`
- `niveauDifficulte` : `facile`, `moyen`, `difficile`

---

## Recherche — `/api/recherche`

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `http://localhost:3000/api/recherche` | Public | Recherche dans le catalogue — query : `q`, `categorie`, `budgetMax` |

---

## Exemples d'appels

```
GET  http://localhost:3000/api/pays?continent=Asie
GET  http://localhost:3000/api/pays/3/activites?categorie=gastronomie&budgetMax=100
GET  http://localhost:3000/api/destinations?q=plage&budgetMax=1500
GET  http://localhost:3000/api/recherche?q=cuisine&categorie=gastronomie&budgetMax=80
GET  http://localhost:3000/api/clients?page=2&limite=20&q=dupont
PUT  http://localhost:3000/api/clients/moi/favoris/destinations/12
GET  http://localhost:3000/api/clients/moi/favoris
```

Pagination par défaut : `page=1`, `limite=20` (50 pour le catalogue), `limite` maximum 100.
