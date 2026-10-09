'use strict';

// V3 — Réponse publique de l'agence à un avis (R14 : une seule, modifiable).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reponses_avis', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      avis_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'avis', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // P4 : 1 000 caractères maximum.
      texte: { type: Sequelize.STRING(1000), allowNull: false },
      // P7 : tout agent peut modifier la réponse ; on garde le dernier auteur.
      agent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'agents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // created_at : date de la réponse ; updated_at : date de modification.
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE reponses_avis ADD CONSTRAINT reponses_avis_texte_check CHECK (length(trim(texte)) > 0)'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reponses_avis');
  },
};
