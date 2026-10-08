module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Destination',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      paysId: { type: DataTypes.INTEGER, allowNull: false },
      nom: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true, len: [2, 150] } },
      description: { type: DataTypes.TEXT, allowNull: true },
      periodeIdeale: { type: DataTypes.STRING(100), allowNull: true },
      prixAPartirDe: {
        // PostgreSQL renvoie les DECIMAL en chaînes : on expose un nombre.
        get() {
          const v = this.getDataValue('prixAPartirDe');
          return v === null || v === undefined ? v : Number(v);
        },
        type: DataTypes.DECIMAL(10, 2),
        field: 'prix_a_partir_de',
        allowNull: true,
        validate: { min: 0 },
      },
      photoUrl: { type: DataTypes.STRING(500), allowNull: true, validate: { isUrl: true } },
      actif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'destinations',
      indexes: [{ unique: true, fields: ['pays_id', 'nom'], name: 'destinations_pays_id_nom_unique' }],
    }
  );
