'use strict';

// V2 — Activités choisies dans une demande de voyage (0..n, du pays de la destination : R6, contrôlé par le service).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('demande_activites', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      demande_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'demandes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // R9 : une activité commandée est conservée ; on la masque au lieu de la supprimer.
      activite_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'activites', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Prix figé au moment de la commande (§5) : un changement de tarif n'a aucun effet.
      prix_par_personne: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE demande_activites ADD CONSTRAINT demande_activites_prix_check CHECK (prix_par_personne >= 0)'
    );
    await queryInterface.addIndex('demande_activites', ['demande_id', 'activite_id'], {
      unique: true,
      name: 'demande_activites_demande_activite_unique',
    });
    await queryInterface.addIndex('demande_activites', ['activite_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('demande_activites');
  },
};
