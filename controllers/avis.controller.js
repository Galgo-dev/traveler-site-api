const asyncHandler = require('../utils/asyncHandler');
const avisService = require('../services/avis.service');

// --- Public ---
exports.derniers = asyncHandler(async (req, res) => {
  res.json(await avisService.derniersAvisCinqEtoiles());
});

exports.avisDeDestination = asyncHandler(async (req, res) => {
  res.json(await avisService.avisDeDestination(req.params.id, req.query));
});

// --- Client ---
exports.commandesEligibles = asyncHandler(async (req, res) => {
  res.json(await avisService.commandesEligibles(req.utilisateur.id));
});

exports.mesAvis = asyncHandler(async (req, res) => {
  res.json(await avisService.mesAvis(req.utilisateur.id));
});

exports.creer = asyncHandler(async (req, res) => {
  res.status(201).json(await avisService.creer(req.utilisateur, req.body));
});

exports.modifier = asyncHandler(async (req, res) => {
  res.json(await avisService.modifier(req.params.id, req.utilisateur, req.body));
});

exports.supprimer = asyncHandler(async (req, res) => {
  await avisService.supprimer(req.params.id, req.utilisateur);
  res.status(204).end();
});

// --- Client (le sien) ou personnel ---
exports.obtenir = asyncHandler(async (req, res) => {
  res.json(await avisService.obtenir(req.params.id, req.utilisateur));
});

// --- Personnel ---
exports.compteur = asyncHandler(async (req, res) => {
  res.json(await avisService.compteur());
});

exports.fileModeration = asyncHandler(async (req, res) => {
  res.json(await avisService.fileModeration(req.query));
});

exports.lister = asyncHandler(async (req, res) => {
  res.json(await avisService.lister(req.query));
});

exports.valider = asyncHandler(async (req, res) => {
  res.json(await avisService.valider(req.params.id, req.utilisateur));
});

exports.refuser = asyncHandler(async (req, res) => {
  res.json(await avisService.refuser(req.params.id, req.utilisateur, req.body.motif));
});

exports.masquer = asyncHandler(async (req, res) => {
  res.json(await avisService.masquer(req.params.id, req.utilisateur, req.body.motif));
});

exports.repondre = asyncHandler(async (req, res) => {
  res.json(await avisService.repondre(req.params.id, req.utilisateur, req.body.texte));
});
