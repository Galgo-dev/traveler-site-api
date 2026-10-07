'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pays', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      nom: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      continent: {
        type: Sequelize.ENUM('Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Asie', 'Europe', 'Océanie', 'Antarctique'),
        allowNull: false,
      },
      langue_principale: { type: Sequelize.STRING(100), allowNull: false },
      monnaie: { type: Sequelize.STRING(100), allowNull: false },
      description_courte: { type: Sequelize.STRING(500), allowNull: true },
      visa_requis: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      // Décalage en heures par rapport à l'heure d'hiver belge (ex. 4.5 pour l'Inde, -6 pour New York)
      decalage_horaire: { type: Sequelize.DECIMAL(4, 2), allowNull: false, defaultValue: 0 },
      actif: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(
      'ALTER TABLE pays ADD CONSTRAINT pays_decalage_horaire_check CHECK (decalage_horaire BETWEEN -14 AND 14)'
    );
    await queryInterface.addIndex('pays', ['actif']);
    await queryInterface.addIndex('pays', ['continent']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pays');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pays_continent"');
  },
};
