// Activité choisie dans une demande, avec son prix par personne figé au moment de la commande.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'DemandeActivite',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      demandeId: { type: DataTypes.INTEGER, allowNull: false },
      activiteId: { type: DataTypes.INTEGER, allowNull: false },
      prixParPersonne: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
        // PostgreSQL renvoie les DECIMAL en chaînes : on expose un nombre.
        get() {
          const v = this.getDataValue('prixParPersonne');
          return v === null || v === undefined ? v : Number(v);
        },
      },
    },
    {
      tableName: 'demande_activites',
      indexes: [{ unique: true, fields: ['demande_id', 'activite_id'], name: 'demande_activites_demande_activite_unique' }],
    }
  );
