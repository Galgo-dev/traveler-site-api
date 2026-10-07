// Lecture centralisée des variables d'environnement.
// Règle du projet : aucun autre fichier ne lit process.env directement.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  port: process.env.PORT || '3000',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: env === 'development',
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    nom: process.env.ADMIN_NOM || 'Administrateur',
    prenom: process.env.ADMIN_PRENOM || 'Admin',
  },
};

const manquantes = ['database', 'user', 'password'].filter((k) => !config.db[k]);
if (manquantes.length) {
  const noms = { database: 'DB_DATABASE', user: 'DB_USER', password: 'DB_PASSWORD' };
  throw new Error(
    `Variables d'environnement manquantes : ${manquantes.map((k) => noms[k]).join(', ')} (voir .env.example)`
  );
}

module.exports = config;
