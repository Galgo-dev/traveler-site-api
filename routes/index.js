// Routeur principal : monte tous les routeurs de ressources (l'app les place sous /api).
const router = require('express').Router();

router.get('/sante', (req, res) => res.json({ statut: 'ok' }));

router.use('/auth', require('./auth.routes'));
router.use('/clients', require('./clients.routes'));
router.use('/agents', require('./agents.routes'));
router.use('/pays', require('./pays.routes'));
router.use('/destinations', require('./destinations.routes'));
router.use('/activites', require('./activites.routes'));
router.use('/recherche', require('./recherche.routes'));
router.use('/evenements', require('./evenements.routes'));

module.exports = router;
