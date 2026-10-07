const { Joi, email, nomPersonne, telephone, dateNaissance, pagination } = require('./commun.validator');

// Règle 4 : aucun champ mot de passe ici. Joi refuse les champs inconnus, donc un agent
// qui enverrait "motDePasse" reçoit une erreur 400.
const modification = Joi.object({
  nom: nomPersonne,
  prenom: nomPersonne,
  email,
  telephone,
  dateNaissance,
}).min(1);

const suppressionCompte = Joi.object({
  motDePasse: Joi.string().max(200).required(),
});

const liste = Joi.object({
  ...pagination,
  q: Joi.string().trim().max(100).allow(''),
});

module.exports = { modification, suppressionCompte, liste };
