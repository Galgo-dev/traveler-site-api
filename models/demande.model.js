// Demande de voyage (v2) : une destination, des activités optionnelles, un prix estimé figé.
const ETATS = ['en_attente', 'confirmee', 'annulee'];
const MAX_VOYAGEURS = 10;

module.exports = (sequelize, DataTypes) => {
  // Prix figé, facultatif tant que P8 n'est pas tranché.
  // PostgreSQL renvoie les DECIMAL en chaînes : on expose un nombre.
  const prix = (nom) => ({
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: { min: 0 },
    get() {
      const v = this.getDataValue(nom);
      return v === null || v === undefined ? v : Number(v);
    },
  });

  const Demande = sequelize.define(
    'Demande',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      // null après anonymisation RGPD (suppression du compte client).
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      destinationId: { type: DataTypes.INTEGER, allowNull: false },
      dateDepart: { type: DataTypes.DATEONLY, allowNull: false, validate: { isDate: true } },
      dateRetour: { type: DataTypes.DATEONLY, allowNull: false, validate: { isDate: true } },
      nbAdultes: { type: DataTypes.INTEGER, allowNull: false, validate: { isInt: true, min: 1 } },
      nbEnfants: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { isInt: true, min: 0 } },
      remarques: { type: DataTypes.STRING(1000), allowNull: true, validate: { len: [0, 1000] } },
      prixDestination: prix('prixDestination'),
      prixUnitaire: prix('prixUnitaire'),
      prixEstime: prix('prixEstime'),
      etat: { type: DataTypes.ENUM(...ETATS), allowNull: false, defaultValue: 'en_attente' },
      motifAnnulation: { type: DataTypes.TEXT, allowNull: true },
      dateCommande: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'demandes',
      validate: {
        // R1
        retourApresDepart() {
          if (this.dateDepart && this.dateRetour && this.dateRetour <= this.dateDepart) {
            throw new Error('La date de retour doit être postérieure à la date de départ.');
          }
        },
        // R5
        maximumVoyageurs() {
          if (Number(this.nbAdultes) + Number(this.nbEnfants || 0) > MAX_VOYAGEURS) {
            throw new Error(`Une demande ne peut pas dépasser ${MAX_VOYAGEURS} voyageurs.`);
          }
        },
        motifSiAnnulee() {
          if (this.motifAnnulation && this.etat !== 'annulee') {
            throw new Error('Un motif d\'annulation n\'est possible que pour une demande annulée.');
          }
        },
      },
    }
  );

  Demande.ETATS = ETATS;
  Demande.MAX_VOYAGEURS = MAX_VOYAGEURS;
  return Demande;
};
