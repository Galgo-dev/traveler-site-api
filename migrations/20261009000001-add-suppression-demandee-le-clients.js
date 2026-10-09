'use strict';

// Règle 10 (RGPD) : le client demande la suppression de son compte, un agent l'efface ensuite.
// La date de la demande sert aussi de marqueur « demande en attente » (NULL = aucune demande).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'suppression_demandee_le', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('clients', 'suppression_demandee_le');
  },
};
