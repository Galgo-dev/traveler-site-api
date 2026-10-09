'use strict';

// V2 — Historique des changements d'état d'une demande (§4) ; auteur = utilisateur ayant agi (P4).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const ETATS = ['en_attente', 'confirmee', 'annulee'];
    await queryInterface.createTable('historique_demandes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      demande_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'demandes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // null : création de la demande.
      ancien_etat: { type: Sequelize.ENUM(...ETATS), allowNull: true },
      nouvel_etat: { type: Sequelize.ENUM(...ETATS), allowNull: false },
      // Conservé après anonymisation : on sait toujours si c'est le client ou le personnel qui a agi.
      auteur_type: { type: Sequelize.ENUM('client', 'agent'), allowNull: false },
      // RGPD : le lien vers le client disparaît avec son compte.
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
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE historique_demandes
        ADD CONSTRAINT historique_demandes_auteur_check CHECK (
          (auteur_type = 'client' AND auteur_agent_id IS NULL)
          OR (auteur_type = 'agent' AND auteur_client_id IS NULL)
        )
    `);
    await queryInterface.addIndex('historique_demandes', ['demande_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('historique_demandes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_historique_demandes_ancien_etat"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_historique_demandes_nouvel_etat"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_historique_demandes_auteur_type"');
  },
};
