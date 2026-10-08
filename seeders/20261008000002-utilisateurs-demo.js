'use strict';

// Comptes de démonstration : 17 clients (avec leurs favoris) et 3 agents.
// Prérequis : les seeders du catalogue (20261007000002 et 20261008000001) ont déjà été exécutés.
// Les e-mails utilisent des domaines réservés (example.com, .example) : aucune adresse réelle.
const { hacher } = require('../utils/password');

// Mot de passe commun à tous les comptes de démo (respecte les règles de auth.validator.js).
// À ne jamais utiliser en production.
const MOT_DE_PASSE_DEMO = 'Voyageur-Demo-2026';

const maintenant = () => ({ created_at: new Date(), updated_at: new Date() });

// Moyenne d'âge de la clientèle ≈ 58 ans ; « Jean Dupont » en double illustre les homonymes
// (problème cité par l'agence), distingués uniquement par leur e-mail.
const CLIENTS = [
  { nom: 'Dupont', prenom: 'Jean', email: 'jean.dupont@example.com', telephone: '+32 470 11 22 33', date_naissance: '1961-03-14' },
  { nom: 'Dupont', prenom: 'Jean', email: 'j.dupont.namur@example.com', telephone: '+32 81 22 33 44', date_naissance: '1958-11-02' },
  { nom: 'Lambert', prenom: 'Martine', email: 'martine.lambert@example.com', telephone: '+32 475 23 45 67', date_naissance: '1964-07-21' },
  { nom: 'Peeters', prenom: 'Marc', email: 'marc.peeters@example.com', telephone: '+32 476 34 56 78', date_naissance: '1959-01-30' },
  { nom: 'Janssens', prenom: 'Christine', email: 'christine.janssens@example.com', telephone: '+32 477 45 67 89', date_naissance: '1962-09-12' },
  { nom: 'Leclercq', prenom: 'Philippe', email: 'philippe.leclercq@example.com', telephone: '+32 478 56 78 90', date_naissance: '1955-05-08' },
  { nom: 'Dubois', prenom: 'Monique', email: 'monique.dubois@example.com', telephone: '+32 2 512 34 56', date_naissance: '1953-12-24' },
  { nom: 'Maes', prenom: 'Patrick', email: 'patrick.maes@example.com', telephone: '+32 479 67 89 01', date_naissance: '1966-04-17' },
  { nom: 'Mertens', prenom: 'Anne', email: 'anne.mertens@example.com', telephone: '+32 471 78 90 12', date_naissance: '1968-08-03' },
  { nom: 'Willems', prenom: 'Didier', email: 'didier.willems@example.com', telephone: '+32 472 89 01 23', date_naissance: '1957-02-26' },
  { nom: 'Claes', prenom: 'Françoise', email: 'francoise.claes@example.com', telephone: '+32 473 90 12 34', date_naissance: '1960-10-19' },
  { nom: 'Goossens', prenom: 'Luc', email: 'luc.goossens@example.com', telephone: '+32 474 01 23 45', date_naissance: '1963-06-11' },
  { nom: 'Renard', prenom: 'Isabelle', email: 'isabelle.renard@example.com', telephone: '+32 4 223 45 67', date_naissance: '1970-03-05' },
  { nom: 'Simon', prenom: 'Bernard', email: 'bernard.simon@example.com', telephone: '+32 470 98 76 54', date_naissance: '1950-09-28' },
  { nom: 'Lemaire', prenom: 'Nathalie', email: 'nathalie.lemaire@example.com', telephone: '+32 475 87 65 43', date_naissance: '1972-01-15' },
  { nom: 'Michel', prenom: 'Georges', email: 'georges.michel@example.com', telephone: '+32 476 76 54 32', date_naissance: '1948-07-07' },
  // Client plus jeune, sans téléphone ni date de naissance (champs facultatifs en base).
  { nom: 'Hermans', prenom: 'Julie', email: 'julie.hermans@example.com', telephone: null, date_naissance: null },
];

// Deux conseillers actifs et une conseillère partie (compte désactivé).
const AGENTS = [
  { nom: 'Vandenberghe', prenom: 'Sophie', email: 'sophie.vandenberghe@old-traveler.example', numero_employe: 'EMP-0003', role: 'agent', actif: true },
  { nom: 'Collard', prenom: 'Thomas', email: 'thomas.collard@old-traveler.example', numero_employe: 'EMP-0004', role: 'agent', actif: true },
  { nom: 'Wouters', prenom: 'Catherine', email: 'catherine.wouters@old-traveler.example', numero_employe: 'EMP-0005', role: 'agent', actif: false },
];

// Favoris par e-mail client : destinations et activités identifiées par [pays, nom].
const FAVORIS = {
  'jean.dupont@example.com': {
    destinations: [['Italie', 'Rome'], ['Italie', 'Florence']],
    activites: [['Italie', 'Visite guidée du Colisée et du Forum romain'], ['Italie', 'Cours de cuisine toscane']],
  },
  'j.dupont.namur@example.com': {
    destinations: [['Portugal', 'Porto']],
    activites: [['Portugal', 'Croisière sur le Douro'], ['Portugal', "Visite d'une cave à porto"]],
  },
  'martine.lambert@example.com': {
    destinations: [['Grèce', 'Santorin'], ['Grèce', 'Athènes']],
    activites: [['Grèce', 'Croisière au coucher du soleil']],
  },
  'marc.peeters@example.com': {
    destinations: [['Japon', 'Kyoto'], ['Japon', 'Tokyo']],
    activites: [['Japon', 'Cérémonie du thé'], ['Japon', 'Onsen traditionnel']],
  },
  'christine.janssens@example.com': {
    destinations: [['Maroc', 'Marrakech']],
    activites: [['Maroc', 'Hammam et massage'], ['Maroc', 'Cours de cuisine marocaine']],
  },
  'philippe.leclercq@example.com': {
    destinations: [['Pérou', 'Cusco et le Machu Picchu']],
    activites: [['Pérou', 'Visite du Machu Picchu']],
  },
  'monique.dubois@example.com': {
    destinations: [['Italie', 'Venise'], ['Espagne', 'Séville']],
    activites: [['Italie', 'Promenade en gondole'], ['Espagne', 'Spectacle de flamenco']],
  },
  'patrick.maes@example.com': {
    destinations: [['Islande', "Reykjavik et le Cercle d'or"]],
    activites: [['Islande', "Circuit du Cercle d'or"], ['Islande', 'Baignade au Blue Lagoon']],
  },
  'anne.mertens@example.com': {
    destinations: [['Thaïlande', 'Chiang Mai'], ['Thaïlande', 'Bangkok']],
    activites: [['Thaïlande', 'Sanctuaire éthique d\'éléphants'], ['Thaïlande', 'Cours de cuisine thaïe']],
  },
  'didier.willems@example.com': {
    destinations: [['Canada', 'Rocheuses canadiennes']],
    activites: [['Canada', 'Promenade en canot sur le lac Moraine']],
  },
  'francoise.claes@example.com': {
    destinations: [['Canada', 'Québec']],
    activites: [['Canada', 'Visite du Vieux-Québec'], ['Canada', 'Observation des baleines à Tadoussac']],
  },
  'luc.goossens@example.com': {
    destinations: [['Espagne', 'Barcelone']],
    activites: [['Espagne', 'Visite de la Sagrada Família'], ['Espagne', 'Tapas et marché de la Boqueria']],
  },
  'isabelle.renard@example.com': {
    destinations: [['Italie', 'Côte amalfitaine'], ['Italie', 'Sicile']],
    activites: [['Italie', 'Randonnée du Sentier des Dieux']],
  },
  'bernard.simon@example.com': {
    destinations: [['Portugal', 'Lisbonne']],
    activites: [['Portugal', 'Soirée fado et dîner'], ['Portugal', "Tram 28 et quartier de l'Alfama"]],
  },
  'nathalie.lemaire@example.com': {
    destinations: [['Maroc', 'Essaouira'], ['Maroc', 'Fès']],
    activites: [['Maroc', 'Visite guidée de la médina de Fès']],
  },
  // Georges Michel n'a encore aucun favori.
  'julie.hermans@example.com': {
    destinations: [['Pérou', 'Lima']],
    activites: [['Pérou', 'Randonnée à la montagne aux sept couleurs'], ['Maroc', 'Initiation au kitesurf']],
  },
};

const emailsClients = CLIENTS.map((c) => c.email);
const emailsAgents = AGENTS.map((a) => a.email);

// Renvoie une Map "pays|nom" → id pour la table donnée (destinations ou activites).
async function indexerParPaysEtNom(sequelize, table) {
  const [lignes] = await sequelize.query(
    `SELECT t.id, t.nom, p.nom AS pays FROM ${table} t JOIN pays p ON p.id = t.pays_id`
  );
  return new Map(lignes.map((l) => [`${l.pays}|${l.nom}`, l.id]));
}

function resoudre(index, [pays, nom], type) {
  const id = index.get(`${pays}|${nom}`);
  if (!id) throw new Error(`${type} introuvable : « ${nom} » (${pays}). Exécutez d'abord les seeders du catalogue.`);
  return id;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      // Idempotent : les comptes déjà présents (même e-mail) sont ignorés.
      const [clientsExistants] = await sequelize.query(
        'SELECT LOWER(email) AS email FROM clients WHERE LOWER(email) IN (:emails)',
        { replacements: { emails: emailsClients }, transaction }
      );
      const [agentsExistants] = await sequelize.query(
        'SELECT LOWER(email) AS email FROM agents WHERE LOWER(email) IN (:emails)',
        { replacements: { emails: emailsAgents }, transaction }
      );
      const dejaClients = new Set(clientsExistants.map((c) => c.email));
      const dejaAgents = new Set(agentsExistants.map((a) => a.email));

      const nouveauxClients = CLIENTS.filter((c) => !dejaClients.has(c.email));
      const nouveauxAgents = AGENTS.filter((a) => !dejaAgents.has(a.email));

      // Un hash (et donc un sel) distinct par compte.
      if (nouveauxClients.length) {
        const lignes = await Promise.all(
          nouveauxClients.map(async (c) => ({ ...c, mot_de_passe: await hacher(MOT_DE_PASSE_DEMO), ...maintenant() }))
        );
        await queryInterface.bulkInsert('clients', lignes, { transaction });
      }
      if (nouveauxAgents.length) {
        const lignes = await Promise.all(
          nouveauxAgents.map(async (a) => ({ ...a, mot_de_passe: await hacher(MOT_DE_PASSE_DEMO), ...maintenant() }))
        );
        await queryInterface.bulkInsert('agents', lignes, { transaction });
      }

      // Favoris uniquement pour les clients créés par ce seeder.
      if (!nouveauxClients.length) return;
      const [ids] = await sequelize.query('SELECT id, LOWER(email) AS email FROM clients WHERE LOWER(email) IN (:emails)', {
        replacements: { emails: nouveauxClients.map((c) => c.email) },
        transaction,
      });
      const idClient = new Map(ids.map((l) => [l.email, l.id]));
      const destinations = await indexerParPaysEtNom(sequelize, 'destinations');
      const activites = await indexerParPaysEtNom(sequelize, 'activites');

      const favoris = [];
      for (const [email, { destinations: dests = [], activites: acts = [] }] of Object.entries(FAVORIS)) {
        const clientId = idClient.get(email);
        if (!clientId) continue;
        dests.forEach((cible) =>
          favoris.push({ client_id: clientId, destination_id: resoudre(destinations, cible, 'Destination'), activite_id: null, ...maintenant() })
        );
        acts.forEach((cible) =>
          favoris.push({ client_id: clientId, destination_id: null, activite_id: resoudre(activites, cible, 'Activité'), ...maintenant() })
        );
      }
      if (favoris.length) await queryInterface.bulkInsert('favoris', favoris, { transaction });
    });
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    // Les favoris sont supprimés en cascade avec les clients.
    await sequelize.query('DELETE FROM clients WHERE LOWER(email) IN (:emails)', { replacements: { emails: emailsClients } });
    await sequelize.query('DELETE FROM agents WHERE LOWER(email) IN (:emails)', { replacements: { emails: emailsAgents } });
  },
};
