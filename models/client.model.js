module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Client',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      nom: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
      prenom: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
        set(valeur) {
          this.setDataValue('email', typeof valeur === 'string' ? valeur.trim().toLowerCase() : valeur);
        },
      },
      telephone: { type: DataTypes.STRING(30), allowNull: true },
      dateNaissance: { type: DataTypes.DATEONLY, allowNull: true, validate: { isDate: true } },
      motDePasse: { type: DataTypes.STRING(255), allowNull: false },
      resetTokenHash: { type: DataTypes.STRING(255), allowNull: true },
      resetTokenExpireLe: { type: DataTypes.DATE, allowNull: true },
      // Date à laquelle le client a demandé la suppression de son compte (null : aucune demande en attente).
      suppressionDemandeeLe: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'clients',
      // Ni le mot de passe ni le jeton de réinitialisation ne sortent par défaut.
      defaultScope: { attributes: { exclude: ['motDePasse', 'resetTokenHash', 'resetTokenExpireLe'] } },
      scopes: {
        avecMotDePasse: { attributes: { include: ['motDePasse', 'resetTokenHash', 'resetTokenExpireLe'] } },
      },
    }
  );
