// Avis d'un client sur la destination d'une commande terminée (v3) : note, titre, commentaire, modération.
const ETATS = ['en_attente', 'publie', 'refuse'];
const NOTE_MAX_SANS_COMMENTAIRE = 2; // R8 : commentaire obligatoire si note ≤ 2

module.exports = (sequelize, DataTypes) => {
  const Avis = sequelize.define(
    'Avis',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      demandeId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      destinationId: { type: DataTypes.INTEGER, allowNull: false },
      // null après anonymisation RGPD (suppression du compte client, R19).
      clientId: { type: DataTypes.INTEGER, allowNull: true },
      note: { type: DataTypes.SMALLINT, allowNull: false, validate: { isInt: true, min: 1, max: 5 } },
      titre: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true, len: [1, 100] } },
      commentaire: { type: DataTypes.STRING(1000), allowNull: true, validate: { len: [0, 1000] } },
      anonyme: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      etat: { type: DataTypes.ENUM(...ETATS), allowNull: false, defaultValue: 'en_attente' },
      motifRefus: { type: DataTypes.TEXT, allowNull: true },
      publieLe: { type: DataTypes.DATE, allowNull: true },
      modifieLe: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      moderateurId: { type: DataTypes.INTEGER, allowNull: true },
      modereLe: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'avis',
      validate: {
        // R8
        commentaireSiNoteBasse() {
          const vide = !this.commentaire || !String(this.commentaire).trim();
          if (this.note <= NOTE_MAX_SANS_COMMENTAIRE && vide) {
            throw new Error(`Un commentaire est obligatoire pour une note de ${NOTE_MAX_SANS_COMMENTAIRE} étoiles ou moins.`);
          }
        },
        // R11 : un refus (ou un masquage) porte toujours un motif, et seulement lui.
        motifSiRefuse() {
          if ((this.etat === 'refuse') !== Boolean(this.motifRefus)) {
            throw new Error('Un motif est obligatoire pour un avis refusé, et seulement dans ce cas.');
          }
        },
        dateSiPublie() {
          if (this.etat === 'publie' && !this.publieLe) {
            throw new Error('Un avis publié doit avoir une date de publication.');
          }
        },
      },
    }
  );

  Avis.ETATS = ETATS;
  Avis.NOTE_MAX_SANS_COMMENTAIRE = NOTE_MAX_SANS_COMMENTAIRE;
  return Avis;
};
