const { Joi } = require('./commun.validator');
const { CATEGORIES } = require('./activites.validator');

const recherche = Joi.object({
  q: Joi.string().trim().max(100).allow(''),
  categorie: Joi.string().valid(...CATEGORIES),
  budgetMax: Joi.number().min(0),
});

module.exports = { recherche };
