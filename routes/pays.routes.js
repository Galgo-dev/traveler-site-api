const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { authentifier, authentifierSiPresent } = require('../middlewares/auth.middleware');
const { autoriser, PERSONNEL } = require('../middlewares/role.middleware');
const { notifierCatalogue } = require('../middlewares/catalogue.middleware');
const { paramsId, statut } = require('../validators/commun.validator');
const v = require('../validators/pays.validator');
const controller = require('../controllers/pays.controller');

const personnel = [authentifier, autoriser(...PERSONNEL)];

// Chaque modification réussie est signalée en direct aux pages ouvertes.
router.use(notifierCatalogue('pays'));

// Consultation publique (point à confirmer n°1 : catalogue accessible sans connexion).
router.get('/', authentifierSiPresent, validate(v.liste, 'query'), controller.lister);
router.get('/:id', authentifierSiPresent, validate(paramsId, 'params'), controller.obtenir);

// Navigation : destinations et activités d'un pays (avec les mêmes filtres que les listes globales).
const destinationsValidator = require('../validators/destinations.validator');
const activitesValidator = require('../validators/activites.validator');

router.get('/:id/destinations', authentifierSiPresent, validate(paramsId, 'params'),
  validate(destinationsValidator.liste, 'query'), controller.listerDestinations);
router.get('/:id/activites', authentifierSiPresent, validate(paramsId, 'params'),
  validate(activitesValidator.liste, 'query'), controller.listerActivites);

// Règle 6 : seuls les agents (et l'administrateur) gèrent le catalogue.
router.post('/', personnel, validate(v.creation), controller.creer);
router.patch('/:id', personnel, validate(paramsId, 'params'), validate(v.modification), controller.modifier);
// Règle 9 : masquer / réactiver plutôt que supprimer.
router.patch('/:id/statut', personnel, validate(paramsId, 'params'), validate(statut), controller.changerStatut);
router.delete('/:id', personnel, validate(paramsId, 'params'), controller.supprimer);

module.exports = router;
