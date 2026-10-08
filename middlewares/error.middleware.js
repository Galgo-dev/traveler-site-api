// Gestion des erreurs : route inconnue (404) puis gestionnaire global, toujours en dernier.
// Réponse uniforme : { error: { status, message, details? } }
const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
  ConnectionError,
} = require('sequelize');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');

const routeIntrouvable = (req, res, next) => next(ApiError.introuvable(`Route introuvable : ${req.method} ${req.originalUrl}`));

function traduire(err) {
  if (err instanceof ApiError) return err;

  // JSON mal formé dans le corps de la requête
  if (err.type === 'entity.parse.failed') return ApiError.requeteInvalide('Le corps de la requête n\'est pas un JSON valide.');
  if (err.type === 'entity.too.large') return new ApiError(413, 'Requête trop volumineuse.');

  if (err instanceof UniqueConstraintError) {
    const champ = Object.keys(err.fields || {})[0];
    return ApiError.conflit(champ ? `La valeur du champ « ${champ} » est déjà utilisée.` : 'Cette valeur est déjà utilisée.');
  }
  if (err instanceof ForeignKeyConstraintError) {
    return ApiError.conflit('Opération impossible : cet élément est lié à d\'autres données.');
  }
  if (err instanceof ValidationError) {
    return ApiError.requeteInvalide(
      'Données invalides.',
      err.errors.map((e) => ({ champ: e.path, message: e.message }))
    );
  }
  if (err instanceof ConnectionError) return new ApiError(503, 'Base de données indisponible.');
  if (err instanceof DatabaseError && err.parent && err.parent.code === '23514') {
    return ApiError.requeteInvalide('Une valeur ne respecte pas les contraintes autorisées.');
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
const gestionnaireErreurs = (err, req, res, next) => {
  const apiError = traduire(err) || new ApiError(500, 'Erreur interne du serveur.');

  if (apiError.status >= 500 && config.env !== 'test') console.error(err);

  const corps = { status: apiError.status, message: apiError.message };
  if (apiError.details) corps.details = apiError.details;
  if (apiError.status >= 500 && config.env === 'development') corps.stack = err.stack;

  res.status(apiError.status).json({ error: corps });
};

module.exports = { routeIntrouvable, gestionnaireErreurs };
