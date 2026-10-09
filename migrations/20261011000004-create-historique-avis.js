'use strict';

// V3 — Historique des changements d'état d'un avis (P14, comme pour les commandes).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ETATS = ['en_attente', 'publie', 'refuse'];
    await queryInterface.createTable('historique_avis', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      avis_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'avis', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // null : création de l'avis.
      ancien_etat: { type: Sequelize.ENUM(...ETATS), allowNull: true },
      nouvel_etat: { type: Sequelize.ENUM(...ETATS), allowNull: false },
      // Client (création, modification) ou personnel (validation, refus, masquage).
      auteur_type: { type: Sequelize.ENUM('client', 'agent'), allowNull: false },
      auteur_client_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      auteur_agent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'agents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Motif d'un refus ou d'un masquage, conservé même si l'avis est corrigé ensuite.
      motif: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE historique_avis
        ADD CONSTRAINT historique_avis_auteur_check CHECK (
          (auteur_type = 'client' AND auteur_agent_id IS NULL)
          OR (auteur_type = 'agent' AND auteur_client_id IS NULL)
        )
    `);
    await queryInterface.addIndex('historique_avis', ['avis_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('historique_avis');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_historique_avis_ancien_etat"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_historique_avis_nouvel_etat"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_historique_avis_auteur_type"');
  },
};
