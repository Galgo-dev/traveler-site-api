const asyncHandler = require('../utils/asyncHandler');
const agentsService = require('../services/agents.service');

exports.monCompte = asyncHandler(async (req, res) => {
  res.json(await agentsService.obtenir(req.utilisateur.id));
});

exports.lister = asyncHandler(async (req, res) => {
  res.json(await agentsService.lister(req.query));
});

exports.obtenir = asyncHandler(async (req, res) => {
  res.json(await agentsService.obtenir(req.params.id));
});

exports.creer = asyncHandler(async (req, res) => {
  res.status(201).json(await agentsService.creer(req.body));
});

exports.modifier = asyncHandler(async (req, res) => {
  res.json(await agentsService.modifier(req.params.id, req.body));
});

exports.changerStatut = asyncHandler(async (req, res) => {
  res.json(await agentsService.changerStatut(req.params.id, req.body.actif, req.utilisateur.id));
});

exports.definirMotDePasse = asyncHandler(async (req, res) => {
  await agentsService.definirMotDePasse(req.params.id, req.body.motDePasse);
  res.json({ message: 'Mot de passe de l\'agent modifié.' });
});
