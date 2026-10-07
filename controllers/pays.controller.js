const asyncHandler = require('../utils/asyncHandler');
const paysService = require('../services/pays.service');
const { estPersonnel } = require('../middlewares/role.middleware');

// Les éléments masqués ne sont visibles que du personnel, et seulement s'il le demande (?inclureMasques=true).
const voirMasques = (req) => estPersonnel(req.utilisateur) && req.query.inclureMasques === true;
// Pour le détail, le personnel voit toujours l'élément, même masqué.
const voirDetailMasque = (req) => estPersonnel(req.utilisateur);

exports.lister = asyncHandler(async (req, res) => {
  res.json(await paysService.lister(req.query, voirMasques(req)));
});

exports.obtenir = asyncHandler(async (req, res) => {
  res.json(await paysService.obtenir(req.params.id, voirDetailMasque(req)));
});

exports.creer = asyncHandler(async (req, res) => {
  res.status(201).json(await paysService.creer(req.body));
});

exports.modifier = asyncHandler(async (req, res) => {
  res.json(await paysService.modifier(req.params.id, req.body));
});

exports.changerStatut = asyncHandler(async (req, res) => {
  res.json(await paysService.changerStatut(req.params.id, req.body.actif));
});

exports.supprimer = asyncHandler(async (req, res) => {
  await paysService.supprimer(req.params.id);
  res.status(204).end();
});

// Navigation pays → destinations / activités : on réutilise les listes filtrées par pays.
const destinationsService = require('../services/destinations.service');
const activitesService = require('../services/activites.service');

exports.listerDestinations = asyncHandler(async (req, res) => {
  await paysService.trouver(req.params.id, voirDetailMasque(req));
  res.json(await destinationsService.lister({ ...req.query, paysId: req.params.id }, voirMasques(req)));
});

exports.listerActivites = asyncHandler(async (req, res) => {
  await paysService.trouver(req.params.id, voirDetailMasque(req));
  res.json(await activitesService.lister({ ...req.query, paysId: req.params.id }, voirMasques(req)));
});
