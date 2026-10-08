// Activités du catalogue. Règles 6 et 9 ; une activité appartient à un seul pays,
// et sa destination éventuelle doit appartenir à ce même pays.
const { Op } = require('sequelize');
const { Pays, Destination, Activite } = require('../models');
const ApiError = require('../utils/ApiError');
const pagination = require('../utils/pagination');
const { contient, et } = require('./recherche.utils');

const inclusions = (voirMasques) => [
  {
    model: Pays,
    as: 'pays',
    attributes: ['id', 'nom', 'continent', 'actif'],
    required: true,
    where: voirMasques ? undefined : { actif: true },
  },
  { model: Destination, as: 'destination', attributes: ['id', 'nom', 'actif'], required: false },
];

// Visible du public : activité active, pays actif, et destination absente ou active.
const filtreVisibilite = (voirMasques) =>
  voirMasques
    ? null
    : { actif: true, [Op.or]: [{ destinationId: null }, { '$destination.actif$': true }] };

async function lister({ q, paysId, destinationId, categorie, budgetMax, page, limite }, voirMasques = false) {
  const filtres = {};
  if (paysId) filtres.paysId = paysId;
  if (destinationId) filtres.destinationId = destinationId;
  if (categorie) filtres.categorie = categorie;
  if (budgetMax !== undefined) filtres.prixParPersonne = { [Op.lte]: budgetMax };

  const resultat = await Activite.findAndCountAll({
    where: et(filtres, filtreVisibilite(voirMasques), contient(['Activite.nom', 'Activite.description'], q)),
    include: inclusions(voirMasques),
    order: [['nom', 'ASC'], ['id', 'ASC']],
    distinct: true,
    subQuery: false,
    ...pagination.versOptions({ page, limite }),
  });
  return pagination.formater(resultat, { page, limite });
}

async function obtenir(id, voirMasques = false) {
  const activite = await Activite.findByPk(id, { include: inclusions(true) });
  const visible =
    activite && activite.actif && activite.pays.actif && (!activite.destination || activite.destination.actif);
  if (!activite || (!voirMasques && !visible)) throw ApiError.introuvable('Activité introuvable.');
  return activite;
}

async function verifierRattachement(paysId, destinationId) {
  const pays = await Pays.findByPk(paysId);
  if (!pays) throw ApiError.requeteInvalide('Le pays indiqué n\'existe pas.');
  if (destinationId) {
    const destination = await Destination.findByPk(destinationId);
    if (!destination) throw ApiError.requeteInvalide('La destination indiquée n\'existe pas.');
    if (destination.paysId !== paysId) {
      throw ApiError.requeteInvalide('La destination indiquée n\'appartient pas au pays de l\'activité.');
    }
  }
}

const nettoyer = (donnees) => (donnees.description === '' ? { ...donnees, description: null } : donnees);

async function creer(donnees) {
  await verifierRattachement(donnees.paysId, donnees.destinationId);
  const activite = await Activite.create(nettoyer(donnees));
  return obtenir(activite.id, true);
}

async function modifier(id, donnees) {
  const activite = await obtenir(id, true);
  const paysId = donnees.paysId ?? activite.paysId;
  // Si le pays change sans nouvelle destination, l'ancienne destination n'est plus valable.
  let destinationId = donnees.destinationId !== undefined ? donnees.destinationId : activite.destinationId;
  if (donnees.paysId && donnees.paysId !== activite.paysId && donnees.destinationId === undefined) {
    destinationId = null;
  }

  await verifierRattachement(paysId, destinationId);
  await activite.update({ ...nettoyer(donnees), paysId, destinationId });
  return obtenir(id, true);
}

async function changerStatut(id, actif) {
  const activite = await obtenir(id, true);
  await activite.update({ actif });
  return obtenir(id, true);
}

async function supprimer(id) {
  const activite = await obtenir(id, true);
  await activite.destroy();
}

module.exports = { lister, obtenir, creer, modifier, changerStatut, supprimer };
