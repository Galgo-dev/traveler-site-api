// Instance Sequelize partagée par toute l'application.
const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(config.db.database, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: config.db.logging ? (sql) => console.log(sql) : false,
  timezone: 'Europe/Brussels',
  define: {
    underscored: true, // colonnes en snake_case (created_at, pays_id…)
    freezeTableName: true,
  },
});

module.exports = sequelize;
