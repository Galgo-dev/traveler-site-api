// Favoris des clients : destinations et activités du catalogue (point à confirmer n°2).
const { Favori, Pays, Destination, Activite } = require('../models');
const ApiError = require('../utils/ApiError');
const destinationsService = require('./destinations.service');
const activitesService = require('./activites.service');

const ATTRIBUTS_PAYS = ['id', 'nom', 'continent', 'actif'];

// Mêmes règles de visibilité que le catalogue public (règle 9 : un élément masqué disparaît
// des favoris du client, mais le favori est conservé et réapparaît si l'élément est réactivé).
const destinationVisible = (d) => d.actif && d.pays.actif;
const activiteVisible = (a) => a.actif && a.pays.actif && (!a.destination || a.destination.actif);

// voirMasques : le personnel voit aussi les favoris pointant vers des éléments masqués.
async function lister(clientId, voirMasques = false) {
  const favoris = await Favori.findAll({
    where: { clientId },
    include: [
      {
        model: Destination,
        as: 'destination',
        include: [{ model: Pays, as: 'pays', attributes: ATTRIBUTS_PAYS }],
      },
      {
        model: Activite,
        as: 'activite',
        include: [
          { model: Pays, as: 'pays', attributes: ATTRIBUTS_PAYS },
          { model: Destination, as: 'destination', attributes: ['id', 'nom', 'actif'] },
        ],
      },
    ],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });

  const avecDate = (element, favori) => ({ ...element.get({ plain: true }), ajouteLe: favori.createdAt });
  return {
    destinations: favoris
      .filter((f) => f.destination && (voirMasques || destinationVisible(f.destination)))
      .map((f) => avecDate(f.destination, f)),
    activites: favoris
      .filter((f) => f.activite && (voirMasques || activiteVisible(f.activite)))
      .map((f) => avecDate(f.activite, f)),
  };
}

// Ajout idempotent : renvoie cree = false si l'élément était déjà en favori.
// Un client ne peut ajouter qu'un élément visible du catalogue (404 sinon).
async function ajouterDestination(clientId, destinationId) {
  await destinationsService.trouver(destinationId);
  const [, cree] = await Favori.findOrCreate({ where: { clientId, destinationId } });
  return cree;
}

async function ajouterActivite(clientId, activiteId) {
  await activitesService.obtenir(activiteId);
  const [, cree] = await Favori.findOrCreate({ where: { clientId, activiteId } });
  return cree;
}

async function retirer(clientId, cible) {
  const supprimes = await Favori.destroy({ where: { clientId, ...cible } });
  if (!supprimes) throw ApiError.introuvable('Cet élément ne fait pas partie de vos favoris.');
}

const retirerDestination = (clientId, destinationId) => retirer(clientId, { destinationId });
const retirerActivite = (clientId, activiteId) => retirer(clientId, { activiteId });

module.exports = { lister, ajouterDestination, ajouterActivite, retirerDestination, retirerActivite };
