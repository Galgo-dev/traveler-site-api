// Pays du catalogue. Règles 6, 8 et 9.
const { Pays, Destination, Activite } = require('../models');
const ApiError = require('../utils/ApiError');
const pagination = require('../utils/pagination');
const { contient, et } = require('./recherche.utils');

/**
 * voirMasques : true uniquement pour le personnel ayant demandé inclureMasques.
 * Les visiteurs et clients ne voient que les éléments actifs (règle 9).
 */
async function lister({ q, continent, page, limite }, voirMasques = false) {
  const filtres = {};
  if (!voirMasques) filtres.actif = true;
  if (continent) filtres.continent = continent;

  const resultat = await Pays.findAndCountAll({
    where: et(filtres, contient(['Pays.nom', 'Pays.description_courte'], q)),
    order: [['nom', 'ASC']],
    ...pagination.versOptions({ page, limite }),
  });
  return pagination.formater(resultat, { page, limite });
}

async function trouver(id, voirMasques = false) {
  const pays = await Pays.findByPk(id);
  if (!pays || (!voirMasques && !pays.actif)) throw ApiError.introuvable('Pays introuvable.');
  return pays;
}

// Détail d'un pays avec ses destinations (visibles), pour la navigation pays → destinations.
async function obtenir(id, voirMasques = false) {
  const pays = await trouver(id, voirMasques);
  const destinations = await Destination.findAll({
    where: et({ paysId: pays.id }, voirMasques ? null : { actif: true }),
    order: [['nom', 'ASC']],
  });
  return { ...pays.get({ plain: true }), destinations };
}

async function creer(donnees) {
  const existe = await Pays.findOne({ where: { nom: donnees.nom } });
  if (existe) throw ApiError.conflit('Un pays porte déjà ce nom.');
  const pays = await Pays.create(donnees);
  return trouver(pays.id, true);
}

async function modifier(id, donnees) {
  const pays = await trouver(id, true);
  if (donnees.nom && donnees.nom !== pays.nom) {
    const existe = await Pays.findOne({ where: { nom: donnees.nom } });
    if (existe) throw ApiError.conflit('Un pays porte déjà ce nom.');
  }
  await pays.update(donnees);
  return pays;
}

// Règle 9 : masquer plutôt que supprimer.
async function changerStatut(id, actif) {
  const pays = await trouver(id, true);
  await pays.update({ actif });
  return pays;
}

// Règle 8 : un pays ne peut pas être supprimé tant qu'il contient des destinations ou des activités.
async function supprimer(id) {
  const pays = await trouver(id, true);
  const [nbDestinations, nbActivites] = await Promise.all([
    Destination.count({ where: { paysId: pays.id } }),
    Activite.count({ where: { paysId: pays.id } }),
  ]);
  if (nbDestinations || nbActivites) {
    throw ApiError.conflit(
      `Impossible de supprimer ce pays : il contient ${nbDestinations} destination(s) et ${nbActivites} activité(s). ` +
        'Supprimez-les d\'abord ou masquez le pays.'
    );
  }
  await pays.destroy();
}

module.exports = { lister, trouver, obtenir, creer, modifier, changerStatut, supprimer };
