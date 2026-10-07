// Outils communs aux tests d'intégration.
const request = require('supertest');
const app = require('../app');
const { sequelize, Agent, Client, Pays, Destination, Activite } = require('../models');
const { hacher } = require('../utils/password');

const MDP = 'Voyage-Test-2026';

const api = () => request(app);

async function viderBase() {
  await sequelize.query('TRUNCATE activites, destinations, pays, clients, agents RESTART IDENTITY CASCADE');
}

async function creerAgent(donnees = {}) {
  return Agent.create({
    nom: 'Martin',
    prenom: 'Sophie',
    email: `agent${Date.now()}${Math.random().toString(16).slice(2, 6)}@agence.be`,
    motDePasse: await hacher(MDP),
    role: 'agent',
    actif: true,
    ...donnees,
  });
}

const creerAdmin = (donnees = {}) => creerAgent({ role: 'administrateur', nom: 'Gérante', ...donnees });

async function creerClient(donnees = {}) {
  return Client.create({
    nom: 'Dupont',
    prenom: 'Jean',
    email: `client${Date.now()}${Math.random().toString(16).slice(2, 6)}@mail.be`,
    telephone: '+32 470 12 34 56',
    dateNaissance: '1965-03-12',
    motDePasse: await hacher(MDP),
    ...donnees,
  });
}

async function connecterAgent(agent) {
  const res = await api().post('/api/auth/agents/connexion').send({ email: agent.email, motDePasse: MDP });
  return res.body.token;
}

async function connecterClient(client) {
  const res = await api().post('/api/auth/connexion').send({ email: client.email, motDePasse: MDP });
  return res.body.token;
}

// Petit catalogue : un pays actif et un pays masqué, avec destinations et activités.
async function creerCatalogue() {
  const italie = await Pays.create({ nom: 'Italie', continent: 'Europe', languePrincipale: 'Italien', monnaie: 'Euro' });
  const japon = await Pays.create({ nom: 'Japon', continent: 'Asie', languePrincipale: 'Japonais', monnaie: 'Yen', actif: false });
  const florence = await Destination.create({ paysId: italie.id, nom: 'Florence', prixAPartirDe: 890 });
  const amalfi = await Destination.create({ paysId: italie.id, nom: 'Côte amalfitaine', prixAPartirDe: 1190 });
  const masquee = await Destination.create({ paysId: italie.id, nom: 'Venise', prixAPartirDe: 990, actif: false });
  const kyoto = await Destination.create({ paysId: japon.id, nom: 'Kyoto', prixAPartirDe: 2490 });
  const cuisine = await Activite.create({
    paysId: italie.id, destinationId: florence.id, nom: 'Cours de cuisine toscane', categorie: 'gastronomie',
    duree: 4, prixParPersonne: 95,
  });
  const rando = await Activite.create({
    paysId: italie.id, destinationId: amalfi.id, nom: 'Randonnée du Sentier des Dieux', categorie: 'sport',
    duree: 5, prixParPersonne: 45, niveauDifficulte: 'moyen', ageMinimum: 10,
  });
  const gondole = await Activite.create({
    paysId: italie.id, destinationId: masquee.id, nom: 'Balade en gondole', categorie: 'detente', duree: 1, prixParPersonne: 80,
  });
  const the = await Activite.create({
    paysId: japon.id, destinationId: kyoto.id, nom: 'Cérémonie du thé', categorie: 'culture', duree: 1.5, prixParPersonne: 40,
  });
  return { italie, japon, florence, amalfi, masquee, kyoto, cuisine, rando, gondole, the };
}

const fermer = () => sequelize.close();

module.exports = {
  MDP, api, viderBase, creerAgent, creerAdmin, creerClient, connecterAgent, connecterClient, creerCatalogue, fermer,
};
