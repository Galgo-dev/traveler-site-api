// Chargement des modèles et déclaration des associations.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pays = require('./pays.model')(sequelize, DataTypes);
const Destination = require('./destination.model')(sequelize, DataTypes);
const Activite = require('./activite.model')(sequelize, DataTypes);
const Agent = require('./agent.model')(sequelize, DataTypes);
const Client = require('./client.model')(sequelize, DataTypes);
const Favori = require('./favori.model')(sequelize, DataTypes);
const Demande = require('./demande.model')(sequelize, DataTypes);
const DemandeActivite = require('./demande-activite.model')(sequelize, DataTypes);
const HistoriqueDemande = require('./historique-demande.model')(sequelize, DataTypes);

// Pays 1 — N Destination (obligatoire, suppression du pays bloquée si non vide)
Pays.hasMany(Destination, { foreignKey: 'paysId', as: 'destinations', onDelete: 'RESTRICT' });
Destination.belongsTo(Pays, { foreignKey: 'paysId', as: 'pays' });

// Pays 1 — N Activité (obligatoire, suppression du pays bloquée si non vide)
Pays.hasMany(Activite, { foreignKey: 'paysId', as: 'activites', onDelete: 'RESTRICT' });
Activite.belongsTo(Pays, { foreignKey: 'paysId', as: 'pays' });

// Destination 0..1 — N Activité (lien optionnel)
Destination.hasMany(Activite, { foreignKey: 'destinationId', as: 'activites', onDelete: 'SET NULL' });
Activite.belongsTo(Destination, { foreignKey: 'destinationId', as: 'destination' });

// Client N — N Destination / Activité via les favoris (supprimés avec le client : RGPD)
Client.hasMany(Favori, { foreignKey: 'clientId', as: 'favoris', onDelete: 'CASCADE' });
Favori.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Favori.belongsTo(Destination, { foreignKey: 'destinationId', as: 'destination' });
Favori.belongsTo(Activite, { foreignKey: 'activiteId', as: 'activite' });
Client.belongsToMany(Destination, {
  through: { model: Favori, unique: false },
  foreignKey: 'clientId',
  otherKey: 'destinationId',
  as: 'destinationsFavorites',
});
Client.belongsToMany(Activite, {
  through: { model: Favori, unique: false },
  foreignKey: 'clientId',
  otherKey: 'activiteId',
  as: 'activitesFavorites',
});

// V2 — Client 1 — N Demande (conservée et anonymisée à la suppression du compte : RGPD)
Client.hasMany(Demande, { foreignKey: 'clientId', as: 'demandes', onDelete: 'SET NULL' });
Demande.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Destination 1 — N Demande (une destination commandée ne peut pas être supprimée)
Destination.hasMany(Demande, { foreignKey: 'destinationId', as: 'demandes', onDelete: 'RESTRICT' });
Demande.belongsTo(Destination, { foreignKey: 'destinationId', as: 'destination' });

// Demande N — N Activité, avec le prix par personne figé dans la table de liaison
Demande.belongsToMany(Activite, {
  through: DemandeActivite,
  foreignKey: 'demandeId',
  otherKey: 'activiteId',
  as: 'activites',
});
Activite.belongsToMany(Demande, {
  through: DemandeActivite,
  foreignKey: 'activiteId',
  otherKey: 'demandeId',
  as: 'demandes',
});
Demande.hasMany(DemandeActivite, { foreignKey: 'demandeId', as: 'lignesActivites', onDelete: 'CASCADE' });
DemandeActivite.belongsTo(Demande, { foreignKey: 'demandeId', as: 'demande' });
DemandeActivite.belongsTo(Activite, { foreignKey: 'activiteId', as: 'activite', onDelete: 'RESTRICT' });

// Demande 1 — N HistoriqueDemande ; auteur = client ou membre du personnel
Demande.hasMany(HistoriqueDemande, { foreignKey: 'demandeId', as: 'historique', onDelete: 'CASCADE' });
HistoriqueDemande.belongsTo(Demande, { foreignKey: 'demandeId', as: 'demande' });
HistoriqueDemande.belongsTo(Client, { foreignKey: 'auteurClientId', as: 'auteurClient', onDelete: 'SET NULL' });
HistoriqueDemande.belongsTo(Agent, { foreignKey: 'auteurAgentId', as: 'auteurAgent', onDelete: 'SET NULL' });

module.exports = {
  sequelize, Pays, Destination, Activite, Agent, Client, Favori, Demande, DemandeActivite, HistoriqueDemande,
};
