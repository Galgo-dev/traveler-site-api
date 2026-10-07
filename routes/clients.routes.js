const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { authentifier } = require('../middlewares/auth.middleware');
const { autoriser, ROLES, PERSONNEL } = require('../middlewares/role.middleware');
const { paramsId } = require('../validators/commun.validator');
const v = require('../validators/clients.validator');
const controller = require('../controllers/clients.controller');

router.use(authentifier);

// --- Le client connecté gère son propre profil ---
router.get('/moi', autoriser(ROLES.CLIENT), controller.monProfil);
router.patch('/moi', autoriser(ROLES.CLIENT), validate(v.modification), controller.modifierMonProfil);
router.delete('/moi', autoriser(ROLES.CLIENT), validate(v.suppressionCompte), controller.supprimerMonCompte);

// --- Le personnel consulte et corrige les dossiers (règle 5 : jamais accessible à un client) ---
router.get('/', autoriser(...PERSONNEL), validate(v.liste, 'query'), controller.lister);
router.get('/:id', autoriser(...PERSONNEL), validate(paramsId, 'params'), controller.obtenir);
// Règle 4 : le schéma de modification ne contient aucun champ mot de passe.
router.patch('/:id', autoriser(...PERSONNEL), validate(paramsId, 'params'), validate(v.modification), controller.modifier);
// Règle 10 : suppression RGPD sur demande du client (traitée par un agent).
router.delete('/:id', autoriser(...PERSONNEL), validate(paramsId, 'params'), controller.supprimer);

module.exports = router;
