const CATEGORIES = ['culture', 'detente', 'sport', 'gastronomie', 'aventure'];
const UNITES_DUREE = ['heures', 'jours'];
const NIVEAUX_DIFFICULTE = ['facile', 'moyen', 'difficile'];

module.exports = (sequelize, DataTypes) => {
  const Activite = sequelize.define(
    'Activite',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      paysId: { type: DataTypes.INTEGER, allowNull: false },
      destinationId: { type: DataTypes.INTEGER, allowNull: true },
      nom: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true, len: [2, 150] } },
      description: { type: DataTypes.TEXT, allowNull: true },
      categorie: { type: DataTypes.ENUM(...CATEGORIES), allowNull: false },
      duree: { type: DataTypes.DECIMAL(6, 2), allowNull: false, validate: { min: 0.01 } },
      dureeUnite: { type: DataTypes.ENUM(...UNITES_DUREE), allowNull: false, defaultValue: 'heures' },
      prixParPersonne: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      niveauDifficulte: { type: DataTypes.ENUM(...NIVEAUX_DIFFICULTE), allowNull: true },
      ageMinimum: { type: DataTypes.SMALLINT, allowNull: true, validate: { min: 0, max: 120 } },
      actif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'activites' }
  );

  Activite.CATEGORIES = CATEGORIES;
  Activite.UNITES_DUREE = UNITES_DUREE;
  Activite.NIVEAUX_DIFFICULTE = NIVEAUX_DIFFICULTE;
  return Activite;
};
