const { Joi, id, pagination } = require('./commun.validator');

const CATEGORIES = ['culture', 'detente', 'sport', 'gastronomie', 'aventure'];

const champs = {
  paysId: id,
  destinationId: id.allow(null),
  nom: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().max(5000).allow(null, ''),
  categorie: Joi.string().valid(...CATEGORIES),
  duree: Joi.number().positive().max(9999).precision(2),
  dureeUnite: Joi.string().valid('heures', 'jours'),
  prixParPersonne: Joi.number().min(0).max(1000000).precision(2),
  niveauDifficulte: Joi.string().valid('facile', 'moyen', 'difficile').allow(null),
  ageMinimum: Joi.number().integer().min(0).max(120).allow(null),
  actif: Joi.boolean(),
};

const creation = Joi.object({
  ...champs,
  paysId: champs.paysId.required(),
  nom: champs.nom.required(),
  categorie: champs.categorie.required(),
  duree: champs.duree.required(),
  prixParPersonne: champs.prixParPersonne.required(),
});

const modification = Joi.object(champs).min(1);

const liste = Joi.object({
  ...pagination,
  limite: pagination.limite.default(50),
  q: Joi.string().trim().max(100).allow(''),
  paysId: id,
  destinationId: id,
  categorie: Joi.string().valid(...CATEGORIES),
  budgetMax: Joi.number().min(0),
  inclureMasques: Joi.boolean().default(false),
});

module.exports = { creation, modification, liste, CATEGORIES };
