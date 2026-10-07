// Jetons JWT (sessions) et jetons aléatoires (réinitialisation du mot de passe).
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const signer = (payload) => jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
const verifier = (token) => jwt.verify(token, config.jwt.secret);

const genererJetonAleatoire = () => crypto.randomBytes(32).toString('hex');
const hacherJeton = (jeton) => crypto.createHash('sha256').update(jeton).digest('hex');

module.exports = { signer, verifier, genererJetonAleatoire, hacherJeton };
