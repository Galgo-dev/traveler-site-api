// Chargement des modèles et déclaration des associations.
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pays = require('./pays.model')(sequelize, DataTypes);
const Destination = require('./destination.model')(sequelize, DataTypes);
const Activite = require('./activite.model')(sequelize, DataTypes);
const Agent = require('./agent.model')(sequelize, DataTypes);
const Client = require('./client.model')(sequelize, DataTypes);

// Pays 1 — N Destination (obligatoire, suppression du pays bloquée si non vide)
Pays.hasMany(Destination, { foreignKey: 'paysId', as: 'destinations', onDelete: 'RESTRICT' });
Destination.belongsTo(Pays, { foreignKey: 'paysId', as: 'pays' });

// Pays 1 — N Activité (obligatoire, suppression du pays bloquée si non vide)
Pays.hasMany(Activite, { foreignKey: 'paysId', as: 'activites', onDelete: 'RESTRICT' });
Activite.belongsTo(Pays, { foreignKey: 'paysId', as: 'pays' });

// Destination 0..1 — N Activité (lien optionnel)
Destination.hasMany(Activite, { foreignKey: 'destinationId', as: 'activites', onDelete: 'SET NULL' });
Activite.belongsTo(Destination, { foreignKey: 'destinationId', as: 'destination' });

module.exports = { sequelize, Pays, Destination, Activite, Agent, Client };
