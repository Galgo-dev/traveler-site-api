'use strict';

// V3 — Avis d'un client sur la destination d'une commande terminée (récap réunion 3, §4.1).
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cible de la clé étrangère composite (demande_id, destination_id) : R5.
    await queryInterface.addIndex('demandes', ['id', 'destination_id'], {
      unique: true,
      name: 'demandes_id_destination_unique',
    });

    await queryInterface.createTable('avis', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      // R4 : un seul avis par commande (contrainte unique ajoutée plus bas).
      demande_id: { type: Sequelize.INTEGER, allowNull: false },
      // R5 : déduite de la commande, garantie par la clé étrangère composite.
      destination_id: { type: Sequelize.INTEGER, allowNull: false },
      // R19 : anonymisé (lien rompu) à la suppression du compte client.
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      note: { type: Sequelize.SMALLINT, allowNull: false },
      // P4 : 100 caractères maximum.
      titre: { type: Sequelize.STRING(100), allowNull: false },
      // R7 : 1 000 caractères maximum.
      commentaire: { type: Sequelize.STRING(1000), allowNull: true },
      // R17 : « Voyageur anonyme » pour le public.
      anonyme: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      // R10 : « en attente de validation » à la création.
      etat: {
        type: Sequelize.ENUM('en_attente', 'publie', 'refuse'),
        allowNull: false,
        defaultValue: 'en_attente',
      },
      // R11 / P3 : motif obligatoire pour un refus ou un masquage, visible par le client.
      motif_refus: { type: Sequelize.TEXT, allowNull: true },
      publie_le: { type: Sequelize.DATE, allowNull: true },
      // Dernière modification du contenu par le client (updated_at bouge aussi lors de la modération).
      modifie_le: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      // Traçabilité de la dernière modération.
      moderateur_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'agents', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      modere_le: { type: Sequelize.DATE, allowNull: true },
      // P1 : created_at est le point de départ du délai de 30 jours (R9).
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE avis
        ADD CONSTRAINT avis_demande_unique UNIQUE (demande_id),
        ADD CONSTRAINT avis_demande_destination_fkey FOREIGN KEY (demande_id, destination_id)
          REFERENCES demandes (id, destination_id) ON UPDATE CASCADE ON DELETE CASCADE,
        ADD CONSTRAINT avis_note_check CHECK (note BETWEEN 1 AND 5),
        ADD CONSTRAINT avis_titre_check CHECK (length(trim(titre)) > 0),
        ADD CONSTRAINT avis_commentaire_check CHECK (note > 2 OR length(trim(coalesce(commentaire, ''))) > 0),
        ADD CONSTRAINT avis_motif_check CHECK ((etat = 'refuse') = (motif_refus IS NOT NULL)),
        ADD CONSTRAINT avis_publie_le_check CHECK (etat <> 'publie' OR publie_le IS NOT NULL)
    `);
    // Cible des notes d'activités (avis_id, demande_id) : R20.
    await queryInterface.addIndex('avis', ['id', 'demande_id'], { unique: true, name: 'avis_id_demande_unique' });
    // R15 : moyenne et nombre d'avis publiés par destination.
    await queryInterface.addIndex('avis', ['destination_id', 'etat'], { name: 'avis_destination_etat' });
    // File de modération : les plus anciens d'abord.
    await queryInterface.addIndex('avis', ['etat', 'created_at'], { name: 'avis_etat_created_at' });
    await queryInterface.addIndex('avis', ['client_id']);
    // P8 : avis négatifs (note ≤ 2) et filtre par nombre d'étoiles.
    await queryInterface.addIndex('avis', ['note']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('avis');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_avis_etat"');
    await queryInterface.removeIndex('demandes', 'demandes_id_destination_unique');
  },
};
