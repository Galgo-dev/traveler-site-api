const { Joi, id, pagination } = require('./commun.validator');

const ETATS = ['en_attente', 'publie', 'refuse'];
const note = Joi.number().integer().min(1).max(5);
const date = Joi.date().iso().raw();

const champs = {
  // R6
  note,
  // P4 : 100 caractères maximum.
  titre: Joi.string().trim().min(1).max(100),
  // R7 : 1 000 caractères maximum ; R8 (obligatoire si note ≤ 2) est vérifiée par le service.
  commentaire: Joi.string().trim().max(1000).allow(null, ''),
  anonyme: Joi.boolean(),
  // R20 (souhaitable) : notes facultatives sur les activités de la commande.
  notesActivites: Joi.array()
    .items(Joi.object({ activiteId: id.required(), note: note.required() }))
    .unique('activiteId')
    .max(50),
};

const creation = Joi.object({
  ...champs,
  demandeId: id.required(),
  note: champs.note.required(),
  titre: champs.titre.required(),
  anonyme: champs.anonyme.default(false),
  notesActivites: champs.notesActivites.default([]),
});

const modification = Joi.object(champs).min(1);

// R11 : obligatoire pour un refus ou un masquage (contrôlé par le service).
const motif = Joi.object({ motif: Joi.string().trim().max(1000).allow(null, '') });

// P4 : réponse de l'agence, 1 000 caractères maximum.
const reponse = Joi.object({ texte: Joi.string().trim().min(1).max(1000).required() });

// Fiche destination : plus récents (par défaut) ou meilleures notes, filtre par nombre d'étoiles.
const listePublique = Joi.object({
  ...pagination,
  tri: Joi.string().valid('recents', 'meilleures').default('recents'),
  note,
});

const listePersonnel = Joi.object({
  ...pagination,
  etat: Joi.string().valid(...ETATS),
  destinationId: id,
  paysId: id,
  note,
  // Période de dépôt de l'avis.
  du: date,
  au: date,
});

module.exports = { creation, modification, motif, reponse, listePublique, listePersonnel };
