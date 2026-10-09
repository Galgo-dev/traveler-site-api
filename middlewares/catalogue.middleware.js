// Prévient les navigateurs ouverts qu'une partie du catalogue a changé (pays, destinations, activités).
const evenements = require('../utils/evenements');

const METHODES_LECTURE = ['GET', 'HEAD', 'OPTIONS'];
const STATUT_ERREUR = 400;

/**
 * Après chaque création, modification, masquage ou suppression réussi, diffuse l'événement
 * « catalogue » : les pages publiques et le back-office rechargent alors leurs données.
 * Une requête refusée (validation, droits, conflit…) ne prévient personne.
 * @param {'pays'|'destinations'|'activites'} ressource
 */
const notifierCatalogue = (ressource) => (req, res, next) => {
  if (!METHODES_LECTURE.includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode < STATUT_ERREUR) evenements.diffuser('catalogue', { ressource });
    });
  }
  next();
};

module.exports = { notifierCatalogue };
