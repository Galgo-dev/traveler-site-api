const router = require('express').Router();
const evenements = require('../utils/evenements');

// Flux public (le catalogue est consultable sans connexion) : prévient les pages ouvertes
// de chaque modification du catalogue. Événement « catalogue », données : { ressource }.
router.get('/catalogue', (req, res) => evenements.abonner(req, res));

module.exports = router;
