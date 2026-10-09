// Historique des changements d'état d'une demande : ancien / nouvel état, date, auteur (client ou personnel).
const ETATS = ['en_attente', 'confirmee', 'annulee'];
const TYPES_AUTEUR = ['client', 'agent'];

module.exports = (sequelize, DataTypes) => {
  const HistoriqueDemande = sequelize.define(
    'HistoriqueDemande',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      demandeId: { type: DataTypes.INTEGER, allowNull: false },
      // null : création de la demande.
      ancienEtat: { type: DataTypes.ENUM(...ETATS), allowNull: true },
      nouvelEtat: { type: DataTypes.ENUM(...ETATS), allowNull: false },
      auteurType: { type: DataTypes.ENUM(...TYPES_AUTEUR), allowNull: false },
      // null après anonymisation (client) ou suppression du compte (agent).
      auteurClientId: { type: DataTypes.INTEGER, allowNull: true },
      auteurAgentId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'historique_demandes',
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

  HistoriqueDemande.TYPES_AUTEUR = TYPES_AUTEUR;
  return HistoriqueDemande;
};
