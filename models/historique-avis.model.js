// Historique des changements d'état d'un avis : ancien / nouvel état, date, auteur, motif éventuel (P14).
const ETATS = ['en_attente', 'publie', 'refuse'];
const TYPES_AUTEUR = ['client', 'agent'];

module.exports = (sequelize, DataTypes) => {
  const HistoriqueAvis = sequelize.define(
    'HistoriqueAvis',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      avisId: { type: DataTypes.INTEGER, allowNull: false },
      // null : création de l'avis.
      ancienEtat: { type: DataTypes.ENUM(...ETATS), allowNull: true },
      nouvelEtat: { type: DataTypes.ENUM(...ETATS), allowNull: false },
      auteurType: { type: DataTypes.ENUM(...TYPES_AUTEUR), allowNull: false },
      // null après anonymisation (client) ou suppression du compte (agent).
      auteurClientId: { type: DataTypes.INTEGER, allowNull: true },
      auteurAgentId: { type: DataTypes.INTEGER, allowNull: true },
      motif: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      tableName: 'historique_avis',
      updatedAt: false,
      validate: {
        auteurCoherent() {
          if (this.auteurType === 'client' && this.auteurAgentId != null) {
            throw new Error('Un changement fait par un client ne peut pas désigner un agent.');
          }
          if (this.auteurType === 'agent' && this.auteurClientId != null) {
            throw new Error('Un changement fait par le personnel ne peut pas désigner un client.');
          }
        },
      },
    }
  );

  HistoriqueAvis.TYPES_AUTEUR = TYPES_AUTEUR;
  return HistoriqueAvis;
};
