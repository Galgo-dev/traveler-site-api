// Réponse publique de l'agence à un avis (une seule par avis, modifiable par tout agent : P7).
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'ReponseAvis',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      avisId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      texte: { type: DataTypes.STRING(1000), allowNull: false, validate: { notEmpty: true, len: [1, 1000] } },
      // Dernier agent ayant rédigé ou modifié la réponse.
      agentId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: 'reponses_avis' }
  );
