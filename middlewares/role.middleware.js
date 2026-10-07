// Contrôle d'accès par rôle. À placer après authentifier.
const ApiError = require('../utils/ApiError');

const ROLES = { CLIENT: 'client', AGENT: 'agent', ADMIN: 'administrateur' };
const PERSONNEL = [ROLES.AGENT, ROLES.ADMIN]; // l'administrateur a tous les droits d'un agent

const autoriser = (...roles) => (req, res, next) => {
  if (!req.utilisateur) return next(ApiError.nonAuthentifie());
  if (!roles.includes(req.utilisateur.role)) return next(ApiError.interdit());
  return next();
};

const estPersonnel = (utilisateur) => Boolean(utilisateur) && PERSONNEL.includes(utilisateur.role);

module.exports = { ROLES, PERSONNEL, autoriser, estPersonnel };
