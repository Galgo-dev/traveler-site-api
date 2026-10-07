const { Joi, email, nomPersonne, pagination } = require('./commun.validator');
const { motDePasse } = require('./auth.validator');

const ROLES = ['agent', 'administrateur'];
const numeroEmploye = Joi.string().trim().max(30).allow(null, '');

const creation = Joi.object({
  nom: nomPersonne.required(),
  prenom: nomPersonne.required(),
  email: email.required(),
  motDePasse: motDePasse.required(),
  numeroEmploye,
  role: Joi.string().valid(...ROLES).default('agent'),
});

const modification = Joi.object({
  nom: nomPersonne,
  prenom: nomPersonne,
  email,
  numeroEmploye,
  role: Joi.string().valid(...ROLES),
}).min(1);

const reinitialisationMotDePasse = Joi.object({ motDePasse: motDePasse.required() });

const liste = Joi.object({
  ...pagination,
  q: Joi.string().trim().max(100).allow(''),
  actif: Joi.boolean(),
  role: Joi.string().valid(...ROLES),
});

module.exports = { creation, modification, reinitialisationMotDePasse, liste };
