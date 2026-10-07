// Prépare la base de test (<DB_DATABASE>_test) : création si besoin puis migrations.
// Les tests ne touchent jamais à la base de développement.
const path = require('path');
const { spawnSync } = require('child_process');
const { Sequelize } = require('sequelize');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  const config = require('../../config/config');
  const { db } = config;

  const admin = new Sequelize(db.databasePrincipale, db.user, db.password, {
    host: db.host,
    port: db.port,
    dialect: 'postgres',
    logging: false,
  });
  const [lignes] = await admin.query('SELECT 1 FROM pg_database WHERE datname = :nom', {
    replacements: { nom: db.database },
  });
  if (!lignes.length) await admin.query(`CREATE DATABASE "${db.database.replace(/"/g, '')}"`);
  await admin.close();

  const cli = require.resolve('sequelize-cli/lib/sequelize');
  const res = spawnSync(process.execPath, [cli, 'db:migrate'], {
    cwd: path.resolve(__dirname, '..', '..'),
    env: { ...process.env, NODE_ENV: 'test' },
    encoding: 'utf8',
  });
  if (res.status !== 0) throw new Error(`Migrations de test en échec :\n${res.stdout}\n${res.stderr}`);
};
