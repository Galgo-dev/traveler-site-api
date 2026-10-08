'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('destinations', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      // Règle 7 : une destination ne peut pas exister sans pays.
      // Règle 8 : RESTRICT empêche de supprimer un pays qui contient des destinations.
      pays_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pays', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      nom: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      periode_ideale: { type: Sequelize.STRING(100), allowNull: true },
      prix_a_partir_de: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      photo_url: { type: Sequelize.STRING(500), allowNull: true },
      actif: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE destinations ADD CONSTRAINT destinations_prix_check CHECK (prix_a_partir_de IS NULL OR prix_a_partir_de >= 0)'
    );
    await queryInterface.addIndex('destinations', ['pays_id', 'nom'], {
      unique: true,
      name: 'destinations_pays_id_nom_unique',
    });
    await queryInterface.addIndex('destinations', ['actif']);
    await queryInterface.addIndex('destinations', ['prix_a_partir_de']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('destinations');
  },
};
