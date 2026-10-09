const asyncHandler = require('../utils/asyncHandler');
const demandesService = require('../services/demandes.service');

exports.estimer = asyncHandler(async (req, res) => {
  res.json(await demandesService.estimer(req.utilisateur.id, req.body));
});

exports.creer = asyncHandler(async (req, res) => {
  res.status(201).json(await demandesService.creer(req.utilisateur.id, req.body));
});

exports.lister = asyncHandler(async (req, res) => {
  res.json(await demandesService.lister(req.utilisateur, req.query));
});

exports.obtenir = asyncHandler(async (req, res) => {
  res.json(await demandesService.obtenir(req.params.id, req.utilisateur));
});

exports.confirmer = asyncHandler(async (req, res) => {
  res.json(await demandesService.confirmer(req.params.id, req.utilisateur));
});

exports.annuler = asyncHandler(async (req, res) => {
  res.json(await demandesService.annuler(req.params.id, req.utilisateur, req.body.motif));
});
