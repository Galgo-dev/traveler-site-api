// Lecture centralisée des variables d'environnement.
// Règle du projet : aucun autre fichier ne lit process.env directement.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const env = process.env.NODE_ENV || 'development';
const estTest = env === 'test';

const config = {
  env,
  port: process.env.PORT || '3000',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    // En test, une base séparée (<DB_DATABASE>_test) est utilisée pour ne jamais toucher aux vraies données.
    database: estTest && process.env.DB_DATABASE ? `${process.env.DB_DATABASE}_test` : process.env.DB_DATABASE,
    databasePrincipale: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'postgres',
    logging: env === 'development' && process.env.DB_LOGGING !== 'false',
  },
  jwt: {
    secret: process.env.JWT_SECRET || (estTest ? 'secret-de-test-uniquement' : undefined),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  cors: {
    // Liste d'origines séparées par des virgules ; par défaut le front Vite en local.
    origines: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((o) => o.trim()),
  },
  frontUrl: process.env.FRONT_URL || 'http://localhost:5173',
  motDePasseOublie: {
    dureeValiditeMinutes: Number(process.env.RESET_TOKEN_MINUTES) || 60,
  },
  mail: {
    // Sans SMTP_HOST, les e-mails sont simplement affichés dans la console du serveur.
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true pour le port 465 (TLS direct)
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    expediteur: process.env.MAIL_FROM || 'Horizons Lointains <no-reply@horizons-lointains.be>',
  },
  rateLimit: {
    // Nombre max de tentatives sur les routes d'authentification par fenêtre de 15 minutes.
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || (estTest ? 1000 : 20),
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    nom: process.env.ADMIN_NOM || 'Administrateur',
    prenom: process.env.ADMIN_PRENOM || 'Admin',
  },
};

const manquantes = [
  ['DB_DATABASE', config.db.database],
  ['DB_USER', config.db.user],
  ['DB_PASSWORD', config.db.password],
].filter(([, valeur]) => !valeur).map(([nom]) => nom);
if (manquantes.length) {
  throw new Error(`Variables d'environnement manquantes : ${manquantes.join(', ')} (voir .env.example)`);
}

module.exports = config;
