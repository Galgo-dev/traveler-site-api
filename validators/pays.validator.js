const { Joi, pagination } = require('./commun.validator');

const CONTINENTS = ['Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Asie', 'Europe', 'Océanie', 'Antarctique'];

const champs = {
  nom: Joi.string().trim().min(2).max(100),
  continent: Joi.string().valid(...CONTINENTS),
  languePrincipale: Joi.string().trim().min(1).max(100),
  monnaie: Joi.string().trim().min(1).max(100),
  descriptionCourte: Joi.string().trim().max(500).allow(null, ''),
  visaRequis: Joi.boolean(),
  decalageHoraire: Joi.number().min(-14).max(14).precision(2),
  actif: Joi.boolean(),
};

const creation = Joi.object({
  ...champs,
  nom: champs.nom.required(),
  continent: champs.continent.required(),
  languePrincipale: champs.languePrincipale.required(),
  monnaie: champs.monnaie.required(),
});

const modification = Joi.object(champs).min(1);

const liste = Joi.object({
  ...pagination,
  limite: pagination.limite.default(50),
  q: Joi.string().trim().max(100).allow(''),
  continent: Joi.string().valid(...CONTINENTS),
  inclureMasques: Joi.boolean().default(false),
});

module.exports = { creation, modification, liste, CONTINENTS };
