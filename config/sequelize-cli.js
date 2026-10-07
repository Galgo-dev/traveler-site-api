// Configuration utilisée par sequelize-cli (migrations / seeders).
const config = require('./config');

const base = {
  username: config.db.user,
  password: config.db.password,
  database: config.db.database,
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect,
  logging: false,
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
};

module.exports = { development: base, test: base, production: base };
