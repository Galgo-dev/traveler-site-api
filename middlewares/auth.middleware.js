// Vérifie le JWT (en-tête Authorization: Bearer <token>) et place l'utilisateur dans req.utilisateur :
//   { id, type: 'client' | 'agent', role: 'client' | 'agent' | 'administrateur', compte }
const ApiError = require('../utils/ApiError');
const { verifier } = require('../utils/token');
const authService = require('../services/auth.service');

function lireToken(req) {
  const entete = req.get('authorization') || '';
  const [schema, token] = entete.split(' ');
  return schema && schema.toLowerCase() === 'bearer' && token ? token : null;
}

async function chargerUtilisateur(token) {
  let payload;
  try {
    payload = verifier(token);
  } catch (err) {
    throw ApiError.nonAuthentifie(
      err.name === 'TokenExpiredError' ? 'Session expirée, veuillez vous reconnecter.' : 'Jeton invalide.'
    );
  }
  return authService.utilisateurDepuisJeton(payload);
}

// Authentification obligatoire.
const authentifier = async (req, res, next) => {
  try {
    const token = lireToken(req);
    if (!token) throw ApiError.nonAuthentifie();
    req.utilisateur = await chargerUtilisateur(token);
    next();
  } catch (err) {
    next(err);
  }
};

// Authentification facultative (catalogue public) : si un jeton valide est présent, l'utilisateur est chargé ;
// sinon la requête continue en tant que visiteur. Un jeton invalide reste une erreur 401.
const authentifierSiPresent = async (req, res, next) => {
  try {
    const token = lireToken(req);
    if (token) req.utilisateur = await chargerUtilisateur(token);
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authentifier, authentifierSiPresent };
