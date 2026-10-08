// Recherche globale côté client : un mot-clé, une catégorie et un budget sur tout le catalogue visible.
const paysService = require('./pays.service');
const destinationsService = require('./destinations.service');
const activitesService = require('./activites.service');

const LIMITE = 20;

async function rechercher({ q, categorie, budgetMax }) {
  // La catégorie ne concerne que les activités : si elle est fournie, on ne renvoie que des activités.
  const avecPaysEtDestinations = !categorie;

  const [pays, destinations, activites] = await Promise.all([
    avecPaysEtDestinations && budgetMax === undefined
      ? paysService.lister({ q, page: 1, limite: LIMITE })
      : null,
    avecPaysEtDestinations ? destinationsService.lister({ q, budgetMax, page: 1, limite: LIMITE }) : null,
    activitesService.lister({ q, categorie, budgetMax, page: 1, limite: LIMITE }),
  ]);

  return {
    pays: pays ? pays.donnees : [],
    destinations: destinations ? destinations.donnees : [],
    activites: activites.donnees,
  };
}

module.exports = { rechercher };
