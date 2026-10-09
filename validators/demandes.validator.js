const { Joi, id, pagination } = require('./commun.validator');

const ETATS = ['en_attente', 'confirmee', 'annulee'];
// Dates au format AAAA-MM-JJ, conservées telles quelles (pas de conversion en Date : pas de décalage horaire).
const date = Joi.date().iso().raw();

// Demande (et estimation) : R1, R4, R5 ; R2, R3, R6 et R7 sont vérifiées par le service.
const demande = Joi.object({
  destinationId: id.required(),
  dateDepart: date.required(),
  dateRetour: date.required(),
  nbAdultes: Joi.number().integer().min(1).max(10).required(),
  nbEnfants: Joi.number().integer().min(0).max(9).default(0),
  activiteIds: Joi.array().items(id).unique().max(50).default([]),
  // P6 : 1 000 caractères maximum.
  remarques: Joi.string().trim().max(1000).allow(null, ''),
});

// R13 : motif obligatoire pour le personnel, facultatif pour le client (contrôlé par le service).
const annulation = Joi.object({
  motif: Joi.string().trim().max(1000).allow(null, ''),
});

const liste = Joi.object({
  ...pagination,
  etat: Joi.string().valid(...ETATS),
  // Filtres réservés au personnel (ignorés pour un client).
  paysId: id,
  destinationId: id,
  clientId: id,
  q: Joi.string().trim().max(100).allow(''),
  departDu: date,
  departAu: date,
});

module.exports = { demande, annulation, liste };
