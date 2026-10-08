const ROLES = ['agent', 'administrateur'];

module.exports = (sequelize, DataTypes) => {
  const Agent = sequelize.define(
    'Agent',
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
      motDePasse: { type: DataTypes.STRING(255), allowNull: false },
      numeroEmploye: { type: DataTypes.STRING(30), allowNull: true, unique: true },
      role: { type: DataTypes.ENUM(...ROLES), allowNull: false, defaultValue: 'agent' },
      actif: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    {
      tableName: 'agents',
      // Le hash du mot de passe n'est jamais renvoyé par défaut.
      defaultScope: { attributes: { exclude: ['motDePasse'] } },
      scopes: { avecMotDePasse: { attributes: { include: ['motDePasse'] } } },
    }
  );

  Agent.ROLES = ROLES;
  return Agent;
};
