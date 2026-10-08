'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('agents', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      nom: { type: Sequelize.STRING(100), allowNull: false },
      prenom: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false },
      mot_de_passe: { type: Sequelize.STRING(255), allowNull: false },
      // Point à confirmer n°7 : utile pour la paie, facultatif dans l'application.
      numero_employe: { type: Sequelize.STRING(30), allowNull: true, unique: true },
      role: { type: Sequelize.ENUM('agent', 'administrateur'), allowNull: false, defaultValue: 'agent' },
      // Statut actif / désactivé (départ d'un employé).
      actif: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // E-mail unique sans tenir compte de la casse.
    await queryInterface.sequelize.query('CREATE UNIQUE INDEX agents_email_unique ON agents (LOWER(email))');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_agents_role"');
  },
};
