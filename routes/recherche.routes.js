const router = require('express').Router();
const validate = require('../middlewares/validate.middleware');
const v = require('../validators/recherche.validator');
const controller = require('../controllers/recherche.controller');

// Recherche publique par mot-clé, catégorie d'activité et budget.
router.get('/', validate(v.recherche, 'query'), controller.rechercher);

module.exports = router;
