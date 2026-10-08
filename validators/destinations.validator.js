const { Joi, id, pagination } = require('./commun.validator');

const champs = {
  paysId: id,
  nom: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().max(5000).allow(null, ''),
  periodeIdeale: Joi.string().trim().max(100).allow(null, ''),
  prixAPartirDe: Joi.number().min(0).max(1000000).precision(2).allow(null),
  photoUrl: Joi.string().trim().uri({ scheme: ['http', 'https'] }).max(500).allow(null, ''),
  actif: Joi.boolean(),
};

const creation = Joi.object({ ...champs, paysId: champs.paysId.required(), nom: champs.nom.required() });
const modification = Joi.object(champs).min(1);

const liste = Joi.object({
  ...pagination,
  limite: pagination.limite.default(50),
  q: Joi.string().trim().max(100).allow(''),
  paysId: id,
  budgetMax: Joi.number().min(0),
  inclureMasques: Joi.boolean().default(false),
});

module.exports = { creation, modification, liste };
