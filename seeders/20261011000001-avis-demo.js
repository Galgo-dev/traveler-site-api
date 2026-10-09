'use strict';

// Avis de démonstration (v3) : 10 clients de démo ont fait un voyage (commande confirmée, retour dépassé)
// et ont laissé un avis — 7 publiés (dont un anonyme et un négatif), 2 en attente de modération, 1 refusé.
// Prérequis : seeders du catalogue et 20261008000002-utilisateurs-demo.
// Les commandes créées ici sont repérées par leur remarque, pour pouvoir les retirer (down).
const MARQUEUR = 'Données de démonstration (avis)';
const JOUR_MS = 24 * 3600 * 1000;

const ilYa = (jours) => new Date(Date.now() - jours * JOUR_MS);
const jourIlYa = (jours) => ilYa(jours).toISOString().slice(0, 10);

// retour : jours écoulés depuis le retour ; avis : jours écoulés depuis le dépôt de l'avis.
const AVIS = [
  {
    client: 'jean.dupont@example.com', destination: ['Italie', 'Florence'],
    activite: ['Italie', 'Cours de cuisine toscane'], noteActivite: 5,
    duree: 7, retour: 75, avis: 70, note: 5, titre: 'Florence, un rêve éveillé',
    commentaire: 'Hôtel idéalement situé, à deux pas du Duomo. Le cours de cuisine toscane a été le moment fort du séjour : nous refaisons les pici à la maison !',
    etat: 'publie', reponse: { agent: 'sophie.vandenberghe@old-traveler.example', texte: 'Merci Monsieur Dupont ! Ravis que la Toscane vous ait conquis. À bientôt pour une nouvelle escapade italienne.' },
  },
  {
    client: 'martine.lambert@example.com', destination: ['Grèce', 'Santorin'],
    activite: ['Grèce', 'Croisière au coucher du soleil'], noteActivite: 5,
    duree: 8, retour: 60, avis: 55, note: 5, titre: 'Des couchers de soleil inoubliables',
    commentaire: 'Les villages blancs, la mer turquoise et cette croisière au coucher du soleil… Tout était parfaitement organisé.',
    etat: 'publie',
  },
  {
    client: 'marc.peeters@example.com', destination: ['Japon', 'Kyoto'],
    activite: ['Japon', 'Cérémonie du thé'], noteActivite: 4,
    duree: 10, retour: 50, avis: 45, note: 4, titre: 'Dépaysement total',
    commentaire: 'Kyoto est magnifique, surtout tôt le matin avant la foule. Le décalage horaire est rude les premiers jours.',
    etat: 'publie',
  },
  {
    client: 'christine.janssens@example.com', destination: ['Maroc', 'Marrakech'],
    activite: ['Maroc', 'Hammam et massage'], noteActivite: 5,
    duree: 6, retour: 45, avis: 40, note: 5, titre: 'Riad de charme et accueil chaleureux',
    commentaire: 'Le riad était un havre de paix au cœur de la médina. Le hammam, un vrai moment de détente.',
    anonyme: true, etat: 'publie',
  },
  {
    client: 'philippe.leclercq@example.com', destination: ['Pérou', 'Cusco et le Machu Picchu'],
    activite: ['Pérou', 'Visite du Machu Picchu'], noteActivite: 5,
    duree: 12, retour: 40, avis: 35, note: 4, titre: 'Le Machu Picchu vaut le voyage',
    commentaire: 'Site grandiose. Attention à l\'altitude à Cusco : prévoir deux jours d\'acclimatation, ce que nous ne savions pas.',
    etat: 'publie', reponse: { agent: 'thomas.collard@old-traveler.example', texte: 'Merci pour ce retour. Nous ajoutons désormais une journée d\'acclimatation à Cusco dans nos propositions.' },
  },
  {
    client: 'monique.dubois@example.com', destination: ['Italie', 'Venise'],
    activite: ['Italie', 'Promenade en gondole'], noteActivite: 2,
    duree: 5, retour: 35, avis: 30, note: 2, titre: 'Trop de monde en août',
    commentaire: 'Ville superbe mais beaucoup trop de touristes en plein été, et la promenade en gondole était très courte pour le prix.',
    etat: 'publie', reponse: { agent: 'sophie.vandenberghe@old-traveler.example', texte: 'Merci Madame Dubois pour votre franchise. Pour un prochain séjour, nous vous conseillerons plutôt mai ou octobre.' },
  },
  {
    client: 'patrick.maes@example.com', destination: ['Islande', "Reykjavik et le Cercle d'or"],
    activite: ['Islande', "Circuit du Cercle d'or"], noteActivite: 5,
    duree: 7, retour: 25, avis: 20, note: 5, titre: 'Des paysages d\'un autre monde',
    commentaire: 'Geysers, cascades, et même une aurore boréale la dernière nuit. Le guide du Cercle d\'or était passionnant.',
    etat: 'publie',
  },
  {
    client: 'anne.mertens@example.com', destination: ['Thaïlande', 'Chiang Mai'],
    activite: ['Thaïlande', "Sanctuaire éthique d'éléphants"], noteActivite: 5,
    duree: 9, retour: 12, avis: 6, note: 5, titre: 'Les éléphants, un moment magique',
    commentaire: 'Un sanctuaire respectueux des animaux, une équipe adorable. Chiang Mai est plus calme que Bangkok, parfait pour nous.',
    etat: 'en_attente',
  },
  {
    client: 'luc.goossens@example.com', destination: ['Espagne', 'Barcelone'],
    activite: ['Espagne', 'Visite de la Sagrada Família'], noteActivite: 4,
    duree: 5, retour: 8, avis: 3, note: 3, titre: 'Bien, sans plus',
    commentaire: null,
    etat: 'en_attente',
  },
  {
    client: 'bernard.simon@example.com', destination: ['Portugal', 'Lisbonne'],
    activite: ['Portugal', 'Soirée fado et dîner'], noteActivite: 3,
    duree: 6, retour: 30, avis: 25, note: 1, titre: 'Hôtel décevant',
    commentaire: 'Chambre bruyante et petit-déjeuner médiocre. Appelez-moi au 0470 98 76 54 si vous voulez des détails.',
    etat: 'refuse', motif: 'Votre avis contient des coordonnées personnelles. Merci de le reformuler sans numéro de téléphone.',
    moderateur: 'thomas.collard@old-traveler.example',
  },
];

const MODERATEUR_PAR_DEFAUT = 'sophie.vandenberghe@old-traveler.example';

async function indexer(sequelize, sql, cle, transaction) {
  const [lignes] = await sequelize.query(sql, { transaction });
  return new Map(lignes.map((l) => [cle(l), l]));
}

function trouver(index, cle, type) {
  const ligne = index.get(cle);
  if (!ligne) throw new Error(`${type} introuvable : « ${cle} ». Exécutez d'abord les seeders du catalogue et des utilisateurs.`);
  return ligne;
}

const inserer = async (sequelize, table, donnees, transaction) => {
  const colonnes = Object.keys(donnees);
  const [[ligne]] = await sequelize.query(
    `INSERT INTO ${table} (${colonnes.join(', ')}) VALUES (${colonnes.map((c) => `:${c}`).join(', ')}) RETURNING id`,
    { replacements: donnees, transaction }
  );
  return ligne.id;
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    await sequelize.transaction(async (transaction) => {
      // Idempotent : rien n'est recréé si les données de démonstration existent déjà.
      const [[{ n }]] = await sequelize.query('SELECT COUNT(*)::int AS n FROM demandes WHERE remarques = :m', {
        replacements: { m: MARQUEUR }, transaction,
      });
      if (n) return;

      const clients = await indexer(sequelize, 'SELECT id, LOWER(email) AS email FROM clients', (l) => l.email, transaction);
      const agents = await indexer(sequelize, 'SELECT id, LOWER(email) AS email FROM agents', (l) => l.email, transaction);
      const destinations = await indexer(
        sequelize,
        'SELECT d.id, d.nom, d.prix_a_partir_de AS prix, p.nom AS pays FROM destinations d JOIN pays p ON p.id = d.pays_id',
        (l) => `${l.pays}|${l.nom}`,
        transaction
      );
      const activites = await indexer(
        sequelize,
        'SELECT a.id, a.nom, a.prix_par_personne AS prix, p.nom AS pays FROM activites a JOIN pays p ON p.id = a.pays_id',
        (l) => `${l.pays}|${l.nom}`,
        transaction
      );

      for (const a of AVIS) {
        const client = trouver(clients, a.client, 'Client');
        const destination = trouver(destinations, a.destination.join('|'), 'Destination');
        const activite = trouver(activites, a.activite.join('|'), 'Activité');
        const moderateur = trouver(agents, a.moderateur || MODERATEUR_PAR_DEFAUT, 'Agent');

        // Commande confirmée et terminée : 2 adultes, prix figés comme le ferait l'API.
        const prixDestination = destination.prix === null ? null : Number(destination.prix);
        const prixUnitaire = prixDestination === null ? null : prixDestination + Number(activite.prix);
        const commandeLe = ilYa(a.retour + a.duree + 60);
        const confirmeeLe = ilYa(a.retour + a.duree + 58);
        const demandeId = await inserer(sequelize, 'demandes', {
          client_id: client.id,
          destination_id: destination.id,
          date_depart: jourIlYa(a.retour + a.duree),
          date_retour: jourIlYa(a.retour),
          nb_adultes: 2,
          nb_enfants: 0,
          remarques: MARQUEUR,
          prix_destination: prixDestination,
          prix_unitaire: prixUnitaire,
          prix_estime: prixUnitaire === null ? null : prixUnitaire * 2,
          etat: 'confirmee',
          date_commande: commandeLe,
          created_at: commandeLe,
          updated_at: confirmeeLe,
        }, transaction);
        await queryInterface.bulkInsert('demande_activites', [{
          demande_id: demandeId, activite_id: activite.id, prix_par_personne: activite.prix, created_at: commandeLe, updated_at: commandeLe,
        }], { transaction });
        await queryInterface.bulkInsert('historique_demandes', [
          { demande_id: demandeId, ancien_etat: null, nouvel_etat: 'en_attente', auteur_type: 'client', auteur_client_id: client.id, auteur_agent_id: null, created_at: commandeLe },
          { demande_id: demandeId, ancien_etat: 'en_attente', nouvel_etat: 'confirmee', auteur_type: 'agent', auteur_client_id: null, auteur_agent_id: moderateur.id, created_at: confirmeeLe },
        ], { transaction });

        // L'avis, modéré un jour après son dépôt (sauf s'il est encore en attente).
        const deposeLe = ilYa(a.avis);
        const modereLe = a.etat === 'en_attente' ? null : ilYa(a.avis - 1);
        const avisId = await inserer(sequelize, 'avis', {
          demande_id: demandeId,
          destination_id: destination.id,
          client_id: client.id,
          note: a.note,
          titre: a.titre,
          commentaire: a.commentaire,
          anonyme: Boolean(a.anonyme),
          etat: a.etat,
          motif_refus: a.etat === 'refuse' ? a.motif : null,
          publie_le: a.etat === 'publie' ? modereLe : null,
          modifie_le: deposeLe,
          moderateur_id: modereLe ? moderateur.id : null,
          modere_le: modereLe,
          created_at: deposeLe,
          updated_at: modereLe || deposeLe,
        }, transaction);

        await queryInterface.bulkInsert('notes_activites', [{
          avis_id: avisId, demande_id: demandeId, activite_id: activite.id, note: a.noteActivite, created_at: deposeLe, updated_at: deposeLe,
        }], { transaction });

        const historique = [
          { avis_id: avisId, ancien_etat: null, nouvel_etat: 'en_attente', auteur_type: 'client', auteur_client_id: client.id, auteur_agent_id: null, motif: null, created_at: deposeLe },
        ];
        if (modereLe) {
          historique.push({
            avis_id: avisId, ancien_etat: 'en_attente', nouvel_etat: a.etat, auteur_type: 'agent',
            auteur_client_id: null, auteur_agent_id: moderateur.id, motif: a.etat === 'refuse' ? a.motif : null, created_at: modereLe,
          });
        }
        await queryInterface.bulkInsert('historique_avis', historique, { transaction });

        if (a.reponse) {
          const auteur = trouver(agents, a.reponse.agent, 'Agent');
          const reponduLe = ilYa(a.avis - 2);
          await queryInterface.bulkInsert('reponses_avis', [{
            avis_id: avisId, texte: a.reponse.texte, agent_id: auteur.id, created_at: reponduLe, updated_at: reponduLe,
          }], { transaction });
        }
      }
    });
  },

  async down(queryInterface) {
    // Avis, réponses, notes et historiques sont supprimés en cascade avec les commandes.
    await queryInterface.sequelize.query('DELETE FROM demandes WHERE remarques = :m', { replacements: { m: MARQUEUR } });
  },
};
