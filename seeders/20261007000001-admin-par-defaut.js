'use strict';

// Crée le compte administrateur (la gérante) à partir de ADMIN_EMAIL / ADMIN_PASSWORD du .env.
const config = require('../config/config');
const { hacher } = require('../utils/password');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { email, password, nom, prenom } = config.admin;
    if (!email || !password) {
      throw new Error('ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans le .env pour créer l\'administrateur.');
    }

    const [existants] = await queryInterface.sequelize.query(
      'SELECT id FROM agents WHERE LOWER(email) = LOWER(:email)',
      { replacements: { email } }
    );
    if (existants.length) return;

    await queryInterface.bulkInsert('agents', [
      {
        nom,
        prenom,
        email: email.trim().toLowerCase(),
        mot_de_passe: await hacher(password),
        role: 'administrateur',
        actif: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    if (!config.admin.email) return;
    await queryInterface.sequelize.query('DELETE FROM agents WHERE LOWER(email) = LOWER(:email)', {
      replacements: { email: config.admin.email },
    });
  },
};
