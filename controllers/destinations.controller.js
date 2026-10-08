const asyncHandler = require('../utils/asyncHandler');
const destinationsService = require('../services/destinations.service');
const { estPersonnel } = require('../middlewares/role.middleware');

// Les éléments masqués ne sont visibles que du personnel, et seulement s'il le demande (?inclureMasques=true).
const voirMasques = (req) => estPersonnel(req.utilisateur) && req.query.inclureMasques === true;
// Pour le détail, le personnel voit toujours l'élément, même masqué.
const voirDetailMasque = (req) => estPersonnel(req.utilisateur);

exports.lister = asyncHandler(async (req, res) => {
  res.json(await destinationsService.lister(req.query, voirMasques(req)));
});

exports.obtenir = asyncHandler(async (req, res) => {
  res.json(await destinationsService.obtenir(req.params.id, voirDetailMasque(req)));
});

exports.creer = asyncHandler(async (req, res) => {
  res.status(201).json(await destinationsService.creer(req.body));
});

exports.modifier = asyncHandler(async (req, res) => {
  res.json(await destinationsService.modifier(req.params.id, req.body));
});

exports.changerStatut = asyncHandler(async (req, res) => {
  res.json(await destinationsService.changerStatut(req.params.id, req.body.actif));
});

exports.supprimer = asyncHandler(async (req, res) => {
  await destinationsService.supprimer(req.params.id);
  res.status(204).end();
});
