const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { authentifier, authentifierSiPresent } = require('../middlewares/auth.middleware');
const { autoriser, PERSONNEL } = require('../middlewares/role.middleware');
const { paramsId, statut } = require('../validators/commun.validator');
const v = require('../validators/activites.validator');
const controller = require('../controllers/activites.controller');

const personnel = [authentifier, autoriser(...PERSONNEL)];

// Consultation publique (point à confirmer n°1 : catalogue accessible sans connexion).
router.get('/', authentifierSiPresent, validate(v.liste, 'query'), controller.lister);
router.get('/:id', authentifierSiPresent, validate(paramsId, 'params'), controller.obtenir);
// Règle 6 : seuls les agents (et l'administrateur) gèrent le catalogue.
router.post('/', personnel, validate(v.creation), controller.creer);
router.patch('/:id', personnel, validate(paramsId, 'params'), validate(v.modification), controller.modifier);
// Règle 9 : masquer / réactiver plutôt que supprimer.
router.patch('/:id/statut', personnel, validate(paramsId, 'params'), validate(statut), controller.changerStatut);
router.delete('/:id', personnel, validate(paramsId, 'params'), controller.supprimer);

module.exports = router;
