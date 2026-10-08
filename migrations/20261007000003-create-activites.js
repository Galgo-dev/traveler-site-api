'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activites', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      // Une activité appartient à un seul pays (règle 8 : RESTRICT bloque la suppression du pays).
      pays_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'pays', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Lien optionnel vers une destination précise.
      destination_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'destinations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nom: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      categorie: {
        type: Sequelize.ENUM('culture', 'detente', 'sport', 'gastronomie', 'aventure'),
        allowNull: false,
      },
      duree: { type: Sequelize.DECIMAL(6, 2), allowNull: false },
      duree_unite: { type: Sequelize.ENUM('heures', 'jours'), allowNull: false, defaultValue: 'heures' },
      prix_par_personne: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      // Surtout pour les activités sportives, donc facultatif.
      niveau_difficulte: { type: Sequelize.ENUM('facile', 'moyen', 'difficile'), allowNull: true },
      // Point à confirmer n°5 : facultatif pour l'instant.
      age_minimum: { type: Sequelize.SMALLINT, allowNull: true },
      actif: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE activites
        ADD CONSTRAINT activites_duree_check CHECK (duree > 0),
        ADD CONSTRAINT activites_prix_check CHECK (prix_par_personne >= 0),
        ADD CONSTRAINT activites_age_minimum_check CHECK (age_minimum IS NULL OR age_minimum BETWEEN 0 AND 120)
    `);
    await queryInterface.addIndex('activites', ['pays_id']);
    await queryInterface.addIndex('activites', ['destination_id']);
    await queryInterface.addIndex('activites', ['categorie']);
    await queryInterface.addIndex('activites', ['prix_par_personne']);
    await queryInterface.addIndex('activites', ['actif']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('activites');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_activites_categorie"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_activites_duree_unite"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_activites_niveau_difficulte"');
  },
};
