'use strict';

// Favoris (point à confirmer n°2) : un client met en favori une destination OU une activité.
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('favoris', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      // Règle 10 (RGPD) : la suppression du client efface aussi ses favoris.
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      destination_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'destinations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      activite_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'activites', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    // Exactement une cible par favori, et pas deux fois le même favori pour un client.
    await queryInterface.sequelize.query(`
      ALTER TABLE favoris
        ADD CONSTRAINT favoris_une_cible_check CHECK ((destination_id IS NULL) <> (activite_id IS NULL))
    `);
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX favoris_client_destination_unique ON favoris (client_id, destination_id) WHERE destination_id IS NOT NULL'
    );
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX favoris_client_activite_unique ON favoris (client_id, activite_id) WHERE activite_id IS NOT NULL'
    );
    await queryInterface.addIndex('favoris', ['client_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('favoris');
  },
};
