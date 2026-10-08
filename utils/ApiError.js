// Erreur applicative portant un code HTTP. Levée par les services, traduite par error.middleware.js.
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (details) this.details = details;
  }

  static requeteInvalide(message = 'Requête invalide.', details) {
    return new ApiError(400, message, details);
  }

  static nonAuthentifie(message = 'Authentification requise.') {
    return new ApiError(401, message);
  }

  static interdit(message = 'Accès refusé.') {
    return new ApiError(403, message);
  }

  static introuvable(message = 'Ressource introuvable.') {
    return new ApiError(404, message);
  }

  static conflit(message) {
    return new ApiError(409, message);
  }
}

module.exports = ApiError;
