// Inscription, connexion, mot de passe oublié et chargement de l'utilisateur à partir du JWT.
const { Op } = require('sequelize');
const { Client, Agent } = require('../models');
const ApiError = require('../utils/ApiError');
const { hacher, comparer } = require('../utils/password');
const { signer, genererJetonAleatoire, hacherJeton } = require('../utils/token');
const mailer = require('../utils/mailer');
const config = require('../config/config');

// Hash factice : on compare toujours un mot de passe, même si l'e-mail est inconnu,
// pour ne pas révéler par le temps de réponse quels e-mails existent.
const HASH_FACTICE = '$2b$12$7Rm3u2uxDA0bzYkAnxOemex8ec4iqrRAT4gQG76e24diVSO0CwV92';

const ERREUR_IDENTIFIANTS = 'E-mail ou mot de passe incorrect.';

const vueClient = (client) => {
  const { motDePasse, resetTokenHash, resetTokenExpireLe, ...reste } = client.get({ plain: true });
  return { ...reste, type: 'client', role: 'client' };
};

const vueAgent = (agent) => {
  const { motDePasse, ...reste } = agent.get({ plain: true });
  return { ...reste, type: 'agent' };
};

const jetonPour = (type, compte) =>
  signer({ sub: compte.id, type, role: type === 'client' ? 'client' : compte.role });

async function inscrire(donnees) {
  const existe = await Client.findOne({ where: { email: donnees.email } });
  if (existe) throw ApiError.conflit('Un compte existe déjà avec cette adresse e-mail.');

  const client = await Client.create({
    nom: donnees.nom,
    prenom: donnees.prenom,
    email: donnees.email,
    telephone: donnees.telephone || null,
    dateNaissance: donnees.dateNaissance,
    motDePasse: await hacher(donnees.motDePasse),
  });

  return { token: jetonPour('client', client), utilisateur: vueClient(client) };
}

async function connecterClient(email, motDePasse) {
  const client = await Client.scope('avecMotDePasse').findOne({ where: { email } });
  const valide = await comparer(motDePasse, client ? client.motDePasse : HASH_FACTICE);
  if (!client || !valide) throw ApiError.nonAuthentifie(ERREUR_IDENTIFIANTS);
  return { token: jetonPour('client', client), utilisateur: vueClient(client) };
}

async function connecterAgent(email, motDePasse) {
  const agent = await Agent.scope('avecMotDePasse').findOne({ where: { email } });
  const valide = await comparer(motDePasse, agent ? agent.motDePasse : HASH_FACTICE);
  if (!agent || !valide) throw ApiError.nonAuthentifie(ERREUR_IDENTIFIANTS);
  if (!agent.actif) throw ApiError.interdit('Ce compte a été désactivé. Contactez l\'administrateur.');
  return { token: jetonPour('agent', agent), utilisateur: vueAgent(agent) };
}

// Toujours la même réponse, que l'e-mail existe ou non (pas de fuite d'information).
async function demanderReinitialisation(email) {
  const client = await Client.findOne({ where: { email } });
  if (!client) return;

  const jeton = genererJetonAleatoire();
  const minutes = config.motDePasseOublie.dureeValiditeMinutes;
  await client.update({
    resetTokenHash: hacherJeton(jeton),
    resetTokenExpireLe: new Date(Date.now() + minutes * 60 * 1000),
  });

  const lien = `${config.frontUrl.replace(/\/$/, '')}/reinitialisation-mot-de-passe?token=${jeton}`;
  await mailer.envoyer({
    a: client.email,
    sujet: 'Réinitialisation de votre mot de passe',
    texte:
      `Bonjour ${client.prenom},\n\n` +
      `Pour choisir un nouveau mot de passe, ouvrez ce lien (valable ${minutes} minutes) :\n${lien}\n\n` +
      'Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement ce message.',
  });
}

async function reinitialiser(jeton, nouveauMotDePasse) {
  const client = await Client.scope('avecMotDePasse').findOne({
    where: { resetTokenHash: hacherJeton(jeton), resetTokenExpireLe: { [Op.gt]: new Date() } },
  });
  if (!client) throw ApiError.requeteInvalide('Ce lien de réinitialisation est invalide ou a expiré.');

  await client.update({
    motDePasse: await hacher(nouveauMotDePasse),
    resetTokenHash: null,
    resetTokenExpireLe: null,
  });
}

// Utilisé par le middleware d'authentification à chaque requête.
async function utilisateurDepuisJeton(payload) {
  if (payload.type === 'client') {
    const client = await Client.findByPk(payload.sub);
    if (!client) throw ApiError.nonAuthentifie('Compte introuvable.');
    return { id: client.id, type: 'client', role: 'client' };
  }
  if (payload.type === 'agent') {
    const agent = await Agent.findByPk(payload.sub);
    if (!agent) throw ApiError.nonAuthentifie('Compte introuvable.');
    if (!agent.actif) throw ApiError.interdit('Ce compte a été désactivé.');
    // Le rôle est relu en base : un changement de rôle s'applique immédiatement.
    return { id: agent.id, type: 'agent', role: agent.role };
  }
  throw ApiError.nonAuthentifie('Jeton invalide.');
}

// Changement de son propre mot de passe (client ou agent) : l'ancien est exigé.
async function changerMotDePasse({ type, id }, motDePasseActuel, nouveauMotDePasse) {
  const Modele = type === 'client' ? Client : Agent;
  const compte = await Modele.scope('avecMotDePasse').findByPk(id);
  if (!compte) throw ApiError.introuvable('Compte introuvable.');
  if (!(await comparer(motDePasseActuel, compte.motDePasse))) {
    throw ApiError.requeteInvalide('Le mot de passe actuel est incorrect.');
  }
  await compte.update({ motDePasse: await hacher(nouveauMotDePasse) });
}

module.exports = {
  inscrire,
  connecterClient,
  connecterAgent,
  demanderReinitialisation,
  reinitialiser,
  utilisateurDepuisJeton,
  changerMotDePasse,
  vueClient,
  vueAgent,
};
