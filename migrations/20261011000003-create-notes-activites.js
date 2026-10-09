'use strict';

// V3 (souhaitable) — Notes facultatives sur les activités de la commande (R20, P11 : note seule, sans modération).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notes_activites', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      avis_id: { type: Sequelize.INTEGER, allowNull: false },
      // Recopié depuis l'avis : sert aux clés étrangères composites ci-dessous.
      demande_id: { type: Sequelize.INTEGER, allowNull: false },
      activite_id: { type: Sequelize.INTEGER, allowNull: false },
      note: { type: Sequelize.SMALLINT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // R20 garanti par la base : l'activité notée fait forcément partie de la commande de l'avis.
    await queryInterface.sequelize.query(`
      ALTER TABLE notes_activites
        ADD CONSTRAINT notes_activites_avis_fkey FOREIGN KEY (avis_id, demande_id)
          REFERENCES avis (id, demande_id) ON UPDATE CASCADE ON DELETE CASCADE,
        ADD CONSTRAINT notes_activites_demande_activite_fkey FOREIGN KEY (demande_id, activite_id)
          REFERENCES demande_activites (demande_id, activite_id) ON UPDATE CASCADE ON DELETE CASCADE,
        ADD CONSTRAINT notes_activites_avis_activite_unique UNIQUE (avis_id, activite_id),
        ADD CONSTRAINT notes_activites_note_check CHECK (note BETWEEN 1 AND 5)
    `);
    // P11 : moyenne par activité.
    await queryInterface.addIndex('notes_activites', ['activite_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notes_activites');
  },
};
