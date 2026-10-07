#!/usr/bin/env node
/**
 * Démarre la base PostgreSQL (conteneur Docker) puis applique les migrations.
 * Lancé automatiquement par `npm start` (hook "prestart"), ou à la main : `npm run db:start`.
 *
 * Étapes :
 *   1. vérifie que Docker est disponible ;
 *   2. `docker compose up -d db` (crée ou relance le conteneur old-traveler-db) ;
 *   3. attend que PostgreSQL accepte les connexions ;
 *   4. applique les migrations en attente (sequelize-cli db:migrate).
 *
 * Option : --seed  → exécute aussi les seeders (admin par défaut + catalogue de démo).
 */
const { spawnSync } = require('child_process');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const DELAI_MAX_MS = 60_000;
const PAUSE_MS = 1_000;

const log = (msg) => console.log(`[db] ${msg}`);
const echec = (msg) => {
  console.error(`[db] ERREUR : ${msg}`);
  process.exit(1);
};

function executer(commande, args, { silencieux = false } = {}) {
  return spawnSync(commande, args, {
    cwd: RACINE,
    stdio: silencieux ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });
}

function verifierDocker() {
  const res = executer('docker', ['info', '--format', '{{.ServerVersion}}'], { silencieux: true });
  if (res.error || res.status !== 0) {
    echec('Docker ne répond pas. Lance Docker Desktop puis réessaie.');
  }
  log(`Docker ${res.stdout.trim()} détecté.`);
}

function demarrerConteneur() {
  log('Démarrage du conteneur PostgreSQL (docker compose up -d db)…');
  const res = executer('docker', ['compose', 'up', '-d', 'db']);
  if (res.status !== 0) echec('impossible de démarrer le conteneur (voir le message de Docker ci-dessus).');
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function attendreBase() {
  // Chargé ici pour que les erreurs de .env n'apparaissent qu'après les vérifications Docker.
  const sequelize = require('../config/database');
  const debut = Date.now();
  log('Attente de PostgreSQL…');
  for (;;) {
    try {
      await sequelize.authenticate({ logging: false });
      log(`PostgreSQL prêt (${Math.round((Date.now() - debut) / 1000)} s).`);
      await sequelize.close();
      return;
    } catch (err) {
      if (Date.now() - debut > DELAI_MAX_MS) {
        await sequelize.close().catch(() => {});
        echec(`PostgreSQL injoignable après ${DELAI_MAX_MS / 1000} s : ${err.message}`);
      }
      await attendre(PAUSE_MS);
    }
  }
}

function sequelizeCli(...args) {
  const cli = require.resolve('sequelize-cli/lib/sequelize');
  const res = executer(process.execPath, [cli, ...args]);
  if (res.status !== 0) echec(`échec de "sequelize ${args.join(' ')}".`);
}

(async () => {
  verifierDocker();
  demarrerConteneur();
  await attendreBase();
  log('Application des migrations…');
  sequelizeCli('db:migrate');
  if (process.argv.includes('--seed')) {
    log('Exécution des seeders…');
    sequelizeCli('db:seed:all');
  }
  log('Base de données prête.');
})().catch((err) => echec(err.message));
