const asyncHandler = require('../utils/asyncHandler');
const clientsService = require('../services/clients.service');

// --- Le client connecté ---
exports.monProfil = asyncHandler(async (req, res) => {
  res.json(await clientsService.obtenir(req.utilisateur.id));
});

exports.modifierMonProfil = asyncHandler(async (req, res) => {
  res.json(await clientsService.modifier(req.utilisateur.id, req.body));
});

exports.supprimerMonCompte = asyncHandler(async (req, res) => {
  await clientsService.supprimerSonCompte(req.utilisateur.id, req.body.motDePasse);
  res.status(204).end();
});

exports.demanderSuppression = asyncHandler(async (req, res) => {
  res.json(await clientsService.demanderSuppression(req.utilisateur.id, req.body.motDePasse));
});

exports.annulerDemandeSuppression = asyncHandler(async (req, res) => {
  res.json(await clientsService.annulerDemandeSuppression(req.utilisateur.id));
});

// --- Le personnel ---
exports.lister = asyncHandler(async (req, res) => {
  res.json(await clientsService.lister(req.query));
});

exports.obtenir = asyncHandler(async (req, res) => {
  res.json(await clientsService.obtenir(req.params.id));
});

exports.modifier = asyncHandler(async (req, res) => {
  res.json(await clientsService.modifier(req.params.id, req.body));
});

exports.supprimer = asyncHandler(async (req, res) => {
  await clientsService.supprimer(req.params.id);
  res.status(204).end();
});
