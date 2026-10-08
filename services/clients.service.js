// Gestion des comptes clients (profil, consultation par les agents, suppression RGPD).
const { Client } = require('../models');
const ApiError = require('../utils/ApiError');
const { comparer } = require('../utils/password');
const pagination = require('../utils/pagination');
const { contient } = require('./recherche.utils');

// Seuls ces champs sont modifiables. Le mot de passe n'en fait jamais partie (règle 4).
const CHAMPS_MODIFIABLES = ['nom', 'prenom', 'email', 'telephone', 'dateNaissance'];

async function lister({ q, page, limite }) {
  const resultat = await Client.findAndCountAll({
    where: contient(['Client.nom', 'Client.prenom', 'Client.email', 'Client.telephone'], q) || {},
    order: [['nom', 'ASC'], ['prenom', 'ASC'], ['id', 'ASC']],
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
async function supprimer(id) {
  const client = await obtenir(id);
  await client.destroy();
}

// Suppression demandée par le client lui-même : on reconfirme son mot de passe.
async function supprimerSonCompte(id, motDePasse) {
  const client = await Client.scope('avecMotDePasse').findByPk(id);
  if (!client) throw ApiError.introuvable('Client introuvable.');
  if (!(await comparer(motDePasse, client.motDePasse))) {
    throw ApiError.requeteInvalide('Mot de passe incorrect.');
  }
  await client.destroy();
}

module.exports = { lister, obtenir, modifier, supprimer, supprimerSonCompte };
