const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const { authentifier } = require('../middlewares/auth.middleware');
const { autoriser, ROLES, PERSONNEL } = require('../middlewares/role.middleware');
const { paramsId, statut } = require('../validators/commun.validator');
const v = require('../validators/agents.validator');
const controller = require('../controllers/agents.controller');

router.use(authentifier);

// Tout membre du personnel peut consulter son propre compte.
router.get('/moi', autoriser(...PERSONNEL), controller.monCompte);

// Le reste est réservé à l'administrateur.
router.use(autoriser(ROLES.ADMIN));
router.get('/', validate(v.liste, 'query'), controller.lister);
router.post('/', validate(v.creation), controller.creer);
router.get('/:id', validate(paramsId, 'params'), controller.obtenir);
router.patch('/:id', validate(paramsId, 'params'), validate(v.modification), controller.modifier);
router.patch('/:id/statut', validate(paramsId, 'params'), validate(statut), controller.changerStatut);
router.put('/:id/mot-de-passe', validate(paramsId, 'params'), validate(v.reinitialisationMotDePasse), controller.definirMotDePasse);

module.exports = router;
