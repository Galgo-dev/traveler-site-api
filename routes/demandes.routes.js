// V2 — Demandes de voyage (récap réunion 2, §3 : acteurs et droits).
const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { authentifier } = require('../middlewares/auth.middleware');
const { autoriser, ROLES, PERSONNEL } = require('../middlewares/role.middleware');
const { paramsId } = require('../validators/commun.validator');
const v = require('../validators/demandes.validator');
const controller = require('../controllers/demandes.controller');

// Un visiteur doit créer un compte pour passer une demande.
router.use(authentifier);

const client = autoriser(ROLES.CLIENT);
const tous = autoriser(ROLES.CLIENT, ...PERSONNEL);

// --- Le client passe une demande (le prix estimé est affiché avant validation) ---
router.post('/estimation', client, validate(v.demande), controller.estimer);
router.post('/', client, validate(v.demande), controller.creer);

// --- Consultation : ses demandes pour un client (R15), toutes pour le personnel ---
router.get('/', tous, validate(v.liste, 'query'), controller.lister);
router.get('/:id', tous, validate(paramsId, 'params'), controller.obtenir);

// --- Cycle de vie (R12 : aucune modification d'une demande, seulement confirmer / annuler) ---
router.post('/:id/confirmation', autoriser(...PERSONNEL), validate(paramsId, 'params'), controller.confirmer);
// Client : si « en attente » (R11). Personnel : motif obligatoire (R13) ; P2 : ouvert à tout le personnel.
router.post('/:id/annulation', tous, validate(paramsId, 'params'), validate(v.annulation), controller.annuler);

module.exports = router;
