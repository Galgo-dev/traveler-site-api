'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      nom: { type: Sequelize.STRING(100), allowNull: false },
      prenom: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false },
      telephone: { type: Sequelize.STRING(30), allowNull: true },
      date_naissance: { type: Sequelize.DATEONLY, allowNull: true },
      mot_de_passe: { type: Sequelize.STRING(255), allowNull: false },
      // Mot de passe oublié : on ne stocke que le hash du jeton, jamais le jeton lui-même.
      reset_token_hash: { type: Sequelize.STRING(255), allowNull: true },
      reset_token_expire_le: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // Règle 1 : un e-mail = un seul compte client (insensible à la casse).
    await queryInterface.sequelize.query('CREATE UNIQUE INDEX clients_email_unique ON clients (LOWER(email))');
    await queryInterface.addIndex('clients', ['nom', 'prenom']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clients');
  },
};
