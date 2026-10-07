// Hachage et comparaison des mots de passe (bcrypt, implémentation JS pure : aucune compilation native sous Windows).
const bcrypt = require('bcryptjs');

const COUT = 12;

const hacher = (motDePasse) => bcrypt.hash(motDePasse, COUT);
const comparer = (motDePasse, hash) => bcrypt.compare(motDePasse, hash);

module.exports = { hacher, comparer };
