// Note facultative d'une activité de la commande, rattachée à un avis (R20 ; note seule, sans modération : P11).
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'NoteActivite',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      avisId: { type: DataTypes.INTEGER, allowNull: false },
      // Commande de l'avis : la base vérifie que l'activité en fait partie.
      demandeId: { type: DataTypes.INTEGER, allowNull: false },
      activiteId: { type: DataTypes.INTEGER, allowNull: false },
      note: { type: DataTypes.SMALLINT, allowNull: false, validate: { isInt: true, min: 1, max: 5 } },
    },
    {
      tableName: 'notes_activites',
      indexes: [{ unique: true, fields: ['avis_id', 'activite_id'], name: 'notes_activites_avis_activite_unique' }],
    }
  );
