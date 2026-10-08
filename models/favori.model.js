// Table de liaison client ↔ destination / activité (une seule cible par favori).
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Favori',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      destinationId: { type: DataTypes.INTEGER, allowNull: true },
      activiteId: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'favoris',
      validate: {
        uneSeuleCible() {
          if ((this.destinationId == null) === (this.activiteId == null)) {
            throw new Error('Un favori cible soit une destination, soit une activité.');
          }
        },
      },
    }
  );
