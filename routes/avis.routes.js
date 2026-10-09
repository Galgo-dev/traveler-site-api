// V3 — Avis clients (récap réunion 3, §3 : acteurs et droits).
const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { authentifier } = require('../middlewares/auth.middleware');
const { autoriser, ROLES, PERSONNEL } = require('../middlewares/role.middleware');
const { paramsId, pagination, Joi } = require('../validators/commun.validator');
const v = require('../validators/avis.validator');
const controller = require('../controllers/avis.controller');

const client = [authentifier, autoriser(ROLES.CLIENT)];
const personnel = [authentifier, autoriser(...PERSONNEL)];
const id = validate(paramsId, 'params');

// --- Public : page d'accueil (souhaitable) ---
router.get('/derniers', controller.derniers);

// --- Client (R1 : connecté) ---
router.get('/commandes-eligibles', client, controller.commandesEligibles);
router.get('/moi', client, controller.mesAvis);
router.post('/', client, validate(v.creation), controller.creer);
// R9 : modification et suppression pendant 30 jours ; R12 : une modification repasse en modération.
router.patch('/:id', client, id, validate(v.modification), controller.modifier);
router.delete('/:id', client, id, controller.supprimer);

// --- Personnel : tableau de bord, modération, réponse (R13 : jamais de modification du texte du client) ---
router.get('/compteur', personnel, controller.compteur);
router.get('/moderation', personnel, validate(Joi.object(pagination), 'query'), controller.fileModeration);
router.get('/', personnel, validate(v.listePersonnel, 'query'), controller.lister);
router.post('/:id/validation', personnel, id, controller.valider);
router.post('/:id/refus', personnel, id, validate(v.motif), controller.refuser);
router.post('/:id/masquage', personnel, id, validate(v.motif), controller.masquer);
router.put('/:id/reponse', personnel, id, validate(v.reponse), controller.repondre);

// --- Détail : le client voit le sien, le personnel voit tout (dont l'auteur réel d'un avis anonyme : R17) ---
router.get('/:id', authentifier, autoriser(ROLES.CLIENT, ...PERSONNEL), id, controller.obtenir);

module.exports = router;
