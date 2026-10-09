'use strict';

// V2 — Demande de voyage d'un client (récap réunion 2, §4).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('demandes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      // RGPD (§8) : à la suppression du compte, la demande est conservée mais anonymisée.
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // R7 : une seule destination. R8 : une destination commandée n'est jamais supprimée (masquage).
      destination_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'destinations', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      date_depart: { type: Sequelize.DATEONLY, allowNull: false },
      date_retour: { type: Sequelize.DATEONLY, allowNull: false },
      nb_adultes: { type: Sequelize.INTEGER, allowNull: false },
      nb_enfants: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      // P6 : 1 000 caractères maximum.
      remarques: { type: Sequelize.STRING(1000), allowNull: true },
      // Prix figés au moment de la commande (§5) ; nullables tant que P8 n'est pas tranché.
      prix_destination: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      prix_unitaire: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      prix_estime: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      etat: {
        type: Sequelize.ENUM('en_attente', 'confirmee', 'annulee'),
        allowNull: false,
        defaultValue: 'en_attente',
      },
      // R13 : obligatoire pour une annulation par le personnel (contrôlé par le service).
      motif_annulation: { type: Sequelize.TEXT, allowNull: true },
      date_commande: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE demandes
        ADD CONSTRAINT demandes_dates_check CHECK (date_retour > date_depart),
        ADD CONSTRAINT demandes_nb_adultes_check CHECK (nb_adultes >= 1),
        ADD CONSTRAINT demandes_nb_enfants_check CHECK (nb_enfants >= 0),
        ADD CONSTRAINT demandes_nb_voyageurs_check CHECK (nb_adultes + nb_enfants <= 10),
        ADD CONSTRAINT demandes_prix_check CHECK (
          (prix_destination IS NULL OR prix_destination >= 0)
          AND (prix_unitaire IS NULL OR prix_unitaire >= 0)
          AND (prix_estime IS NULL OR prix_estime >= 0)
        ),
        ADD CONSTRAINT demandes_motif_check CHECK (etat = 'annulee' OR motif_annulation IS NULL)
    `);
    await queryInterface.addIndex('demandes', ['client_id']);
    await queryInterface.addIndex('demandes', ['etat']);
    // Liste du personnel triée par date de commande décroissante (§7).
    await queryInterface.sequelize.query('CREATE INDEX demandes_date_commande ON demandes (date_commande DESC)');
    // R14 / P3 : recherche d'un doublon « en attente » (même destination, mêmes dates).
    await queryInterface.addIndex('demandes', ['client_id', 'destination_id', 'date_depart', 'date_retour'], {
      name: 'demandes_doublon',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('demandes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_demandes_etat"');
  },
};
