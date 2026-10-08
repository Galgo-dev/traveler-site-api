const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const validate = require('../middlewares/validate.middleware');
const { authentifier } = require('../middlewares/auth.middleware');
const v = require('../validators/auth.validator');
const controller = require('../controllers/auth.controller');

// Limite les tentatives (force brute sur les mots de passe, abus du « mot de passe oublié »).
const limiteur = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.rateLimit.authMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({ error: { status: 429, message: 'Trop de tentatives, réessayez dans quelques minutes.' } }),
});

router.post('/inscription', limiteur, validate(v.inscription), controller.inscription);
router.post('/connexion', limiteur, validate(v.connexion), controller.connexionClient);
router.post('/agents/connexion', limiteur, validate(v.connexion), controller.connexionAgent);
router.post('/mot-de-passe-oublie', limiteur, validate(v.motDePasseOublie), controller.motDePasseOublie);
router.post('/reinitialisation', limiteur, validate(v.reinitialisation), controller.reinitialisation);

// Changement de son propre mot de passe (client ou membre du personnel).
router.patch('/mot-de-passe', authentifier, validate(v.changementMotDePasse), controller.changementMotDePasse);

module.exports = router;
