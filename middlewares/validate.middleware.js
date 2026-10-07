// Applique un schéma Joi à req.body, req.query ou req.params.
// Les valeurs validées (converties, nettoyées) remplacent les valeurs d'origine.
const ApiError = require('../utils/ApiError');
const { messages } = require('../validators/commun.validator');

const validate = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source] ?? {}, {
    abortEarly: false,
    stripUnknown: false,
    convert: true,
    messages,
    errors: { wrap: { label: false } },
  });

  if (error) {
    const details = error.details.map((d) => ({ champ: d.path.join('.'), message: d.message }));
    return next(ApiError.requeteInvalide('Données invalides.', details));
  }

  req[source] = value;
  return next();
};

module.exports = validate;
