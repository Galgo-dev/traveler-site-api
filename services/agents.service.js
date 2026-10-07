// Gestion des comptes du personnel (réservée à l'administrateur, sauf consultation de son propre compte).
const { Agent, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const { hacher } = require('../utils/password');
const pagination = require('../utils/pagination');
const { contient, et } = require('./recherche.utils');

const vide = (v) => (v === '' ? null : v);

async function lister({ q, actif, role, page, limite }) {
  const filtres = {};
  if (actif !== undefined) filtres.actif = actif;
  if (role) filtres.role = role;

  const resultat = await Agent.findAndCountAll({
    where: et(filtres, contient(['Agent.nom', 'Agent.prenom', 'Agent.email', 'Agent.numero_employe'], q)),
    order: [['nom', 'ASC'], ['prenom', 'ASC'], ['id', 'ASC']],
    ...pagination.versOptions({ page, limite }),
  });
  return pagination.formater(resultat, { page, limite });
}

async function obtenir(id) {
  const agent = await Agent.findByPk(id);
  if (!agent) throw ApiError.introuvable('Agent introuvable.');
  return agent;
}

async function verifierEmailLibre(email, idExclu) {
  const existant = await Agent.findOne({ where: { email } });
  if (existant && existant.id !== idExclu) throw ApiError.conflit('Un compte agent existe déjà avec cette adresse e-mail.');
}

async function verifierNumeroLibre(numero, idExclu) {
  if (!numero) return;
  const existant = await Agent.findOne({ where: { numeroEmploye: numero } });
  if (existant && existant.id !== idExclu) throw ApiError.conflit('Ce numéro d\'employé est déjà attribué.');
}

// Empêche de se retrouver sans aucun administrateur actif.
async function verifierResteUnAdmin(agent, transaction) {
  if (agent.role !== 'administrateur' || !agent.actif) return;
  const nbAdmins = await Agent.count({ where: { role: 'administrateur', actif: true }, transaction });
  if (nbAdmins <= 1) throw ApiError.conflit('Impossible : il doit rester au moins un administrateur actif.');
}

// Règle 2 : seul un administrateur crée les comptes du personnel (contrôlé par la route).
async function creer(donnees) {
  await verifierEmailLibre(donnees.email);
  await verifierNumeroLibre(vide(donnees.numeroEmploye));

  const agent = await Agent.create({
    nom: donnees.nom,
    prenom: donnees.prenom,
    email: donnees.email,
    motDePasse: await hacher(donnees.motDePasse),
    numeroEmploye: vide(donnees.numeroEmploye) ?? null,
    role: donnees.role || 'agent',
    actif: true,
  });
  return obtenir(agent.id);
}

async function modifier(id, donnees) {
  return sequelize.transaction(async (transaction) => {
    const agent = await Agent.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!agent) throw ApiError.introuvable('Agent introuvable.');

    if (donnees.email) await verifierEmailLibre(donnees.email, agent.id);
    if (donnees.numeroEmploye !== undefined) await verifierNumeroLibre(vide(donnees.numeroEmploye), agent.id);
    if (donnees.role && donnees.role !== agent.role) await verifierResteUnAdmin(agent, transaction);

    const modifications = {};
    ['nom', 'prenom', 'email', 'role'].forEach((c) => {
      if (donnees[c] !== undefined) modifications[c] = donnees[c];
    });
    if (donnees.numeroEmploye !== undefined) modifications.numeroEmploye = vide(donnees.numeroEmploye);

    await agent.update(modifications, { transaction });
    return agent;
  }).then((agent) => obtenir(agent.id));
}

// Désactivation (départ d'un employé) ou réactivation. Le compte est conservé.
async function changerStatut(id, actif, idAuteur) {
  if (id === idAuteur && !actif) throw ApiError.conflit('Vous ne pouvez pas désactiver votre propre compte.');

  return sequelize.transaction(async (transaction) => {
    const agent = await Agent.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!agent) throw ApiError.introuvable('Agent introuvable.');
    if (!actif) await verifierResteUnAdmin(agent, transaction);
    await agent.update({ actif }, { transaction });
    return agent;
  });
}

// L'administrateur peut définir un nouveau mot de passe pour un membre du personnel
// (ex. mot de passe oublié). La règle 4 ne concerne que les clients.
async function definirMotDePasse(id, motDePasse) {
  const agent = await obtenir(id);
  await agent.update({ motDePasse: await hacher(motDePasse) });
}

module.exports = { lister, obtenir, creer, modifier, changerStatut, definirMotDePasse };
