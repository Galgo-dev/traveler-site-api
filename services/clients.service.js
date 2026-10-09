// Gestion des comptes clients (profil, consultation par les agents, suppression RGPD).
const { Op } = require('sequelize');
const { sequelize, Client, Demande } = require('../models');
const ApiError = require('../utils/ApiError');
const { comparer } = require('../utils/password');
const pagination = require('../utils/pagination');
const { contient, et } = require('./recherche.utils');

// Seuls ces champs sont modifiables. Le mot de passe n'en fait jamais partie (règle 4).
const CHAMPS_MODIFIABLES = ['nom', 'prenom', 'email', 'telephone', 'dateNaissance'];

const ORDRE_ALPHABETIQUE = [['nom', 'ASC'], ['prenom', 'ASC'], ['id', 'ASC']];
// Les demandes de suppression se traitent de la plus ancienne à la plus récente.
const ORDRE_DEMANDES = [['suppressionDemandeeLe', 'ASC'], ['id', 'ASC']];

function filtreDemandeSuppression(suppressionDemandee) {
  if (suppressionDemandee === undefined) return null;
  return { suppressionDemandeeLe: suppressionDemandee ? { [Op.ne]: null } : null };
}

async function lister({ q, page, limite, suppressionDemandee }) {
  const resultat = await Client.findAndCountAll({
    where: et(
      contient(['Client.nom', 'Client.prenom', 'Client.email', 'Client.telephone'], q),
      filtreDemandeSuppression(suppressionDemandee)
    ),
    order: suppressionDemandee ? ORDRE_DEMANDES : ORDRE_ALPHABETIQUE,
    ...pagination.versOptions({ page, limite }),
  });
  return pagination.formater(resultat, { page, limite });
}

async function obtenir(id) {
  const client = await Client.findByPk(id);
  if (!client) throw ApiError.introuvable('Client introuvable.');
  return client;
}

async function modifier(id, donnees) {
  const client = await obtenir(id);

  const modifications = {};
  CHAMPS_MODIFIABLES.forEach((champ) => {
    if (donnees[champ] !== undefined) modifications[champ] = donnees[champ] === '' ? null : donnees[champ];
  });

  if (modifications.email && modifications.email !== client.email) {
    const pris = await Client.findOne({ where: { email: modifications.email } });
    if (pris) throw ApiError.conflit('Un compte existe déjà avec cette adresse e-mail.');
  }

  await client.update(modifications);
  return obtenir(id);
}

// Règle 10 (RGPD) : la suppression efface définitivement les données personnelles du client.
// V2 (§8) : ses demandes de voyage sont conservées mais anonymisées ; les remarques en texte libre
// (santé, mobilité…) sont purgées, puis la base retire le lien vers le client (client_id → NULL).
async function effacer(client) {
  await sequelize.transaction(async (transaction) => {
    await Demande.update({ remarques: null }, { where: { clientId: client.id }, transaction });
    await client.destroy({ transaction });
  });
}

async function supprimer(id) {
  await effacer(await obtenir(id));
}

// Les actions sensibles du client sur son propre compte sont reconfirmées par son mot de passe.
async function verifierMotDePasse(id, motDePasse) {
  const client = await Client.scope('avecMotDePasse').findByPk(id);
  if (!client) throw ApiError.introuvable('Client introuvable.');
  if (!(await comparer(motDePasse, client.motDePasse))) {
    throw ApiError.requeteInvalide('Mot de passe incorrect.');
  }
  return client;
}

// Suppression immédiate par le client lui-même.
async function supprimerSonCompte(id, motDePasse) {
  await effacer(await verifierMotDePasse(id, motDePasse));
}

// Le client demande la suppression ; un agent l'effacera depuis le back-office.
// Renouveler la demande ne change pas la date de la première, toujours en attente.
async function demanderSuppression(id, motDePasse) {
  const client = await verifierMotDePasse(id, motDePasse);
  if (!client.suppressionDemandeeLe) {
    await client.update({ suppressionDemandeeLe: new Date() });
  }
  return obtenir(id);
}

async function annulerDemandeSuppression(id) {
  const client = await obtenir(id);
  await client.update({ suppressionDemandeeLe: null });
  return obtenir(id);
}

module.exports = {
  lister,
  obtenir,
  modifier,
  supprimer,
  supprimerSonCompte,
  demanderSuppression,
  annulerDemandeSuppression,
};
