const asyncHandler = require('../utils/asyncHandler');
const favorisService = require('../services/favoris.service');
const clientsService = require('../services/clients.service');

// --- Le client connecté ---
exports.mesFavoris = asyncHandler(async (req, res) => {
  res.json(await favorisService.lister(req.utilisateur.id));
});

// PUT idempotent : 201 si le favori est créé, 200 s'il existait déjà.
exports.ajouterDestination = asyncHandler(async (req, res) => {
  const cree = await favorisService.ajouterDestination(req.utilisateur.id, req.params.id);
  res.status(cree ? 201 : 200).json(await favorisService.lister(req.utilisateur.id));
});

exports.ajouterActivite = asyncHandler(async (req, res) => {
  const cree = await favorisService.ajouterActivite(req.utilisateur.id, req.params.id);
  res.status(cree ? 201 : 200).json(await favorisService.lister(req.utilisateur.id));
});

exports.retirerDestination = asyncHandler(async (req, res) => {
  await favorisService.retirerDestination(req.utilisateur.id, req.params.id);
  res.status(204).end();
});

exports.retirerActivite = asyncHandler(async (req, res) => {
  await favorisService.retirerActivite(req.utilisateur.id, req.params.id);
  res.status(204).end();
});

// --- Le personnel consulte les favoris dans le dossier d'un client ---
exports.favorisDuClient = asyncHandler(async (req, res) => {
  await clientsService.obtenir(req.params.id);
  res.json(await favorisService.lister(req.params.id, true));
});
