const CONTINENTS = ['Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Asie', 'Europe', 'Océanie', 'Antarctique'];

module.exports = (sequelize, DataTypes) => {
  const Pays = sequelize.define(
    'Pays',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nom: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { notEmpty: true, len: [2, 100] } },
      continent: { type: DataTypes.ENUM(...CONTINENTS), allowNull: false },
      languePrincipale: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true },
      },
      monnaie: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
      descriptionCourte: { type: DataTypes.STRING(500), allowNull: true },
      visaRequis: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      decalageHoraire: {
        // PostgreSQL renvoie les DECIMAL en chaînes : on expose un nombre.
        get() {
          const v = this.getDataValue('decalageHoraire');
          return v === null || v === undefined ? v : Number(v);
        },
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: -14, max: 14 },
      },
      actif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'pays' }
  );

  Pays.CONTINENTS = CONTINENTS;
  return Pays;
};
