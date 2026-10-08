const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/auth.service');

const MESSAGE_MDP_OUBLIE =
  'Si un compte existe avec cette adresse, un e-mail contenant un lien de réinitialisation vient d\'être envoyé.';

exports.inscription = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.inscrire(req.body));
});

exports.connexionClient = asyncHandler(async (req, res) => {
  res.json(await authService.connecterClient(req.body.email, req.body.motDePasse));
});

exports.connexionAgent = asyncHandler(async (req, res) => {
  res.json(await authService.connecterAgent(req.body.email, req.body.motDePasse));
});

exports.motDePasseOublie = asyncHandler(async (req, res) => {
  await authService.demanderReinitialisation(req.body.email);
  res.json({ message: MESSAGE_MDP_OUBLIE });
});

exports.reinitialisation = asyncHandler(async (req, res) => {
  await authService.reinitialiser(req.body.token, req.body.motDePasse);
  res.json({ message: 'Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter.' });
});

exports.changementMotDePasse = asyncHandler(async (req, res) => {
  await authService.changerMotDePasse(req.utilisateur, req.body.motDePasseActuel, req.body.nouveauMotDePasse);
  res.json({ message: 'Mot de passe modifié.' });
});
