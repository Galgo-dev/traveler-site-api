// Chargement des modèles et déclaration des associations.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pays = require('./pays.model')(sequelize, DataTypes);
const Destination = require('./destination.model')(sequelize, DataTypes);
const Activite = require('./activite.model')(sequelize, DataTypes);
const Agent = require('./agent.model')(sequelize, DataTypes);
const Client = require('./client.model')(sequelize, DataTypes);
const Favori = require('./favori.model')(sequelize, DataTypes);

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

module.exports = { sequelize, Pays, Destination, Activite, Agent, Client, Favori };
