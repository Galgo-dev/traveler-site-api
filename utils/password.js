// Hachage et comparaison des mots de passe (bcrypt, implémentation JS pure : aucune compilation native sous Windows).
const bcrypt = require('bcryptjs');
const config = require('../config/config');

// Coût 12 en usage réel ; réduit en test uniquement pour accélérer la suite de tests.
const COUT = config.env === 'test' ? 4 : 12;

const hacher = (motDePasse) => bcrypt.hash(motDePasse, COUT);
const comparer = (motDePasse, hash) => bcrypt.compare(motDePasse, hash);

module.exports = { hacher, comparer };
