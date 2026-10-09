// Destinations du catalogue. Règles 6, 7 et 9.
const { Op } = require('sequelize');
const { Pays, Destination, Activite } = require('../models');
const ApiError = require('../utils/ApiError');
const pagination = require('../utils/pagination');
const { contient, et } = require('./recherche.utils');
const { ajouterResume, resumeNotes } = require('./avis.utils');

const ATTRIBUTS_PAYS = ['id', 'nom', 'continent', 'actif'];

// Une destination est visible du public si elle est active ET que son pays l'est aussi.
const inclurePays = (voirMasques) => ({
  model: Pays,
  as: 'pays',
  attributes: ATTRIBUTS_PAYS,
  required: true,
  where: voirMasques ? undefined : { actif: true },
});

async function lister({ q, paysId, budgetMax, page, limite }, voirMasques = false) {
  const filtres = {};
  if (!voirMasques) filtres.actif = true;
  if (paysId) filtres.paysId = paysId;
  // Filtre budget : destinations dont le prix « à partir de » est connu et dans le budget.
  if (budgetMax !== undefined) filtres.prixAPartirDe = { [Op.ne]: null, [Op.lte]: budgetMax };

  const resultat = await Destination.findAndCountAll({
    where: et(filtres, contient(['Destination.nom', 'Destination.description'], q)),
    include: [inclurePays(voirMasques)],
    order: [['nom', 'ASC'], ['id', 'ASC']],
    distinct: true,
    ...pagination.versOptions({ page, limite }),
  });
  const reponse = pagination.formater(resultat, { page, limite });
  // V3 : « ★ 4,6 (23 avis) » ou « Pas encore d'avis » (R15, R16).
  reponse.donnees = await ajouterResume(reponse.donnees, resumeNotes);
  return reponse;
}

async function trouver(id, voirMasques = false) {
  const destination = await Destination.findByPk(id, { include: [inclurePays(true)] });
  if (!destination || (!voirMasques && (!destination.actif || !destination.pays.actif))) {
    throw ApiError.introuvable('Destination introuvable.');
  }
  return destination;
}

// Détail avec les activités visibles rattachées à cette destination.
async function obtenir(id, voirMasques = false) {
  const destination = await trouver(id, voirMasques);
  const activites = await Activite.findAll({
    where: et({ destinationId: destination.id }, voirMasques ? null : { actif: true }),
    order: [['nom', 'ASC']],
  });
  const resumes = await resumeNotes([destination.id]);
  return { ...destination.get({ plain: true }), activites, avis: resumes.get(destination.id) };
}

// Règle 7 : une destination ne peut pas exister sans pays.
async function verifierPays(paysId) {
  const pays = await Pays.findByPk(paysId);
  if (!pays) throw ApiError.requeteInvalide('Le pays indiqué n\'existe pas.');
  return pays;
}

async function verifierNomLibre(paysId, nom, idExclu) {
  const existe = await Destination.findOne({ where: { paysId, nom } });
  if (existe && existe.id !== idExclu) throw ApiError.conflit('Une destination porte déjà ce nom dans ce pays.');
}

const nettoyer = (donnees) => {
  const propre = { ...donnees };
  ['description', 'periodeIdeale', 'photoUrl'].forEach((c) => {
    if (propre[c] === '') propre[c] = null;
  });
  return propre;
};

async function creer(donnees) {
  await verifierPays(donnees.paysId);
  await verifierNomLibre(donnees.paysId, donnees.nom);
  const destination = await Destination.create(nettoyer(donnees));
  return trouver(destination.id, true);
}

async function modifier(id, donnees) {
  const destination = await trouver(id, true);
  const paysId = donnees.paysId ?? destination.paysId;

  if (donnees.paysId && donnees.paysId !== destination.paysId) {
    await verifierPays(donnees.paysId);
    // Les activités rattachées appartiennent à l'ancien pays : changer de pays les rendrait incohérentes.
    const nbActivites = await Activite.count({ where: { destinationId: destination.id } });
    if (nbActivites) {
      throw ApiError.conflit('Impossible de changer le pays : des activités sont rattachées à cette destination.');
    }
  }
  if (donnees.nom || donnees.paysId) await verifierNomLibre(paysId, donnees.nom ?? destination.nom, destination.id);

  await destination.update(nettoyer(donnees));
  return trouver(id, true);
}

async function changerStatut(id, actif) {
  const destination = await trouver(id, true);
  await destination.update({ actif });
  return destination;
}

// Suppression définitive (le masquage reste à privilégier) : les activités liées perdent simplement
// leur lien vers la destination mais restent rattachées au pays.
async function supprimer(id) {
  const destination = await trouver(id, true);
  await destination.destroy();
}

module.exports = { lister, trouver, obtenir, creer, modifier, changerStatut, supprimer };
