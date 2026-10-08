'use strict';

// Enrichissement du catalogue : 7 nouveaux pays, 20 nouvelles destinations et leurs activités.
// Prérequis : le seeder 20261007000002-catalogue-demo (Italie, Japon, Maroc) a déjà été exécuté.
const maintenant = () => ({ created_at: new Date(), updated_at: new Date() });
const photo = (slug) => `https://picsum.photos/seed/${slug}/800/600`;

const PAYS_EXISTANTS = ['Italie', 'Japon', 'Maroc'];

const PAYS = [
  {
    nom: 'Espagne', continent: 'Europe', langue_principale: 'Espagnol', monnaie: 'Euro (EUR)',
    description_courte: 'Soleil, flamenco et tapas, de l\'Andalousie à la Catalogne.',
    visa_requis: false, decalage_horaire: 0,
  },
  {
    nom: 'Grèce', continent: 'Europe', langue_principale: 'Grec', monnaie: 'Euro (EUR)',
    description_courte: 'Berceau de la démocratie, îles blanches et eaux turquoise.',
    visa_requis: false, decalage_horaire: 1,
  },
  {
    nom: 'Portugal', continent: 'Europe', langue_principale: 'Portugais', monnaie: 'Euro (EUR)',
    description_courte: 'Villes en azulejos, fado et côte atlantique préservée.',
    visa_requis: false, decalage_horaire: -1,
  },
  {
    nom: 'Islande', continent: 'Europe', langue_principale: 'Islandais', monnaie: 'Couronne islandaise (ISK)',
    description_courte: 'Volcans, glaciers, geysers et aurores boréales.',
    visa_requis: false, decalage_horaire: -1,
  },
  {
    nom: 'Thaïlande', continent: 'Asie', langue_principale: 'Thaï', monnaie: 'Baht (THB)',
    description_courte: 'Temples dorés, cuisine épicée et sourires légendaires.',
    visa_requis: false, decalage_horaire: 6,
  },
  {
    nom: 'Pérou', continent: 'Amérique du Sud', langue_principale: 'Espagnol', monnaie: 'Sol (PEN)',
    description_courte: 'Héritage inca, cordillère des Andes et Machu Picchu.',
    visa_requis: false, decalage_horaire: -6,
  },
  {
    nom: 'Canada', continent: 'Amérique du Nord', langue_principale: 'Anglais et français', monnaie: 'Dollar canadien (CAD)',
    description_courte: 'Grands espaces, lacs et forêts. Pas de visa, mais AVE obligatoire en avion.',
    visa_requis: false, decalage_horaire: -6,
  },
];

const DESTINATIONS = {
  Italie: [
    {
      nom: 'Rome', periode_ideale: "d'avril à juin et de septembre à octobre", prix_a_partir_de: 790, photo_url: photo('rome'),
      description: 'La Ville éternelle et ses trésors antiques : Colisée, Forum et Vatican. Une capitale à parcourir à pied, de place en fontaine.',
    },
    {
      nom: 'Venise', periode_ideale: "d'avril à juin et en septembre", prix_a_partir_de: 850, photo_url: photo('venise'),
      description: 'Une ville unique bâtie sur l\'eau, ses canaux, ses palais et la place Saint-Marc. Idéale pour une escapade romantique.',
    },
    {
      nom: 'Sicile', periode_ideale: 'de mai à juin et de septembre à octobre', prix_a_partir_de: 990, photo_url: photo('sicile'),
      description: 'La plus grande île de Méditerranée, entre temples grecs, baroque et volcan Etna. Une cuisine généreuse et des plages dorées.',
    },
  ],
  Japon: [
    {
      nom: 'Osaka', periode_ideale: "de mars à mai et d'octobre à novembre", prix_a_partir_de: 2190, photo_url: photo('osaka'),
      description: 'La capitale gourmande du Japon, réputée pour sa cuisine de rue et son ambiance chaleureuse. Point de départ idéal vers Nara.',
    },
    {
      nom: 'Hiroshima', periode_ideale: "de mars à mai et d'octobre à novembre", prix_a_partir_de: 2350, photo_url: photo('hiroshima'),
      description: 'Une ville de mémoire et de paix, tournée vers l\'avenir. Tout proche, l\'île de Miyajima et son célèbre torii flottant.',
    },
  ],
  Maroc: [
    {
      nom: 'Fès', periode_ideale: "de mars à mai et d'octobre à novembre", prix_a_partir_de: 690, photo_url: photo('fes'),
      description: 'La plus ancienne des villes impériales et sa médina classée à l\'UNESCO. Un dédale de ruelles, d\'artisans et de tanneries.',
    },
    {
      nom: 'Essaouira', periode_ideale: "d'avril à octobre", prix_a_partir_de: 720, photo_url: photo('essaouira'),
      description: 'Port fortifié blanc et bleu face à l\'Atlantique. Une atmosphère paisible, idéale pour se détendre loin de l\'agitation.',
    },
  ],
  Espagne: [
    {
      nom: 'Séville', periode_ideale: "de mars à mai et d'octobre à novembre", prix_a_partir_de: 690, photo_url: photo('seville'),
      description: 'Cœur de l\'Andalousie, entre Alcazar, cathédrale et soirées flamenco. Une ville fleurie et chaleureuse.',
    },
    {
      nom: 'Barcelone', periode_ideale: 'de mai à juin et en septembre', prix_a_partir_de: 650, photo_url: photo('barcelone'),
      description: 'Capitale catalane vivante, entre architecture de Gaudí et bord de mer. Musées, marchés et tapas à chaque coin de rue.',
    },
  ],
  Grèce: [
    {
      nom: 'Santorin', periode_ideale: 'de mai à octobre', prix_a_partir_de: 1290, photo_url: photo('santorin'),
      description: 'Villages blancs aux dômes bleus perchés sur la caldeira. Des couchers de soleil parmi les plus beaux du monde.',
    },
    {
      nom: 'Athènes', periode_ideale: "d'avril à juin et de septembre à octobre", prix_a_partir_de: 790, photo_url: photo('athenes'),
      description: 'Berceau de la civilisation occidentale dominé par l\'Acropole. Quartiers animés, musées remarquables et tavernes conviviales.',
    },
  ],
  Portugal: [
    {
      nom: 'Lisbonne', periode_ideale: "de mars à juin et de septembre à octobre", prix_a_partir_de: 690, photo_url: photo('lisbonne'),
      description: 'Ville aux sept collines, tramways jaunes et façades en azulejos. Belvédères et fado au fil des quartiers historiques.',
    },
    {
      nom: 'Porto', periode_ideale: 'de mai à septembre', prix_a_partir_de: 650, photo_url: photo('porto'),
      description: 'Ville colorée en bord du Douro, célèbre pour ses caves à vin de Porto. Ponts métalliques et ruelles pittoresques.',
    },
  ],
  Islande: [
    {
      nom: 'Reykjavik et le Cercle d\'or', periode_ideale: "de juin à août (été) ou de novembre à mars (aurores)", prix_a_partir_de: 1590, photo_url: photo('reykjavik'),
      description: 'La capitale la plus septentrionale du monde et les grands sites voisins : geysers, cascades et faille tectonique. Nature spectaculaire garantie.',
    },
  ],
  Thaïlande: [
    {
      nom: 'Bangkok', periode_ideale: 'de novembre à février', prix_a_partir_de: 1390, photo_url: photo('bangkok'),
      description: 'Mégapole trépidante aux temples étincelants et marchés flottants. Une immersion dans la culture et la gastronomie thaïes.',
    },
    {
      nom: 'Chiang Mai', periode_ideale: 'de novembre à février', prix_a_partir_de: 1490, photo_url: photo('chiangmai'),
      description: 'La « Rose du Nord », entourée de montagnes et de rizières. Plus de 300 temples et un rythme de vie apaisé.',
    },
  ],
  Pérou: [
    {
      nom: 'Cusco et le Machu Picchu', periode_ideale: "de mai à septembre (saison sèche)", prix_a_partir_de: 2490, photo_url: photo('cusco'),
      description: 'Ancienne capitale de l\'Empire inca, porte d\'entrée de la Vallée sacrée. Le Machu Picchu, merveille du monde, en point d\'orgue.',
    },
    {
      nom: 'Lima', periode_ideale: "de décembre à avril", prix_a_partir_de: 1890, photo_url: photo('lima'),
      description: 'Capitale coloniale perchée sur les falaises du Pacifique. Considérée comme la capitale gastronomique de l\'Amérique du Sud.',
    },
  ],
  Canada: [
    {
      nom: 'Québec', periode_ideale: 'de juin à octobre', prix_a_partir_de: 1290, photo_url: photo('quebec'),
      description: 'Seule ville fortifiée d\'Amérique du Nord, au charme européen et francophone. Superbe en été comme aux couleurs de l\'automne.',
    },
    {
      nom: 'Rocheuses canadiennes', periode_ideale: 'de juin à septembre', prix_a_partir_de: 1990, photo_url: photo('rocheuses'),
      description: 'Parcs nationaux de Banff et Jasper : sommets enneigés, lacs émeraude et faune sauvage. Un paradis pour les amoureux de nature.',
    },
  ],
};

const ACTIVITES = {
  Italie: [
    { nom: 'Visite guidée du Colisée et du Forum romain', destination: 'Rome', categorie: 'culture', duree: 3, duree_unite: 'heures', prix_par_personne: 59, age_minimum: null,
      description: 'Découverte commentée de l\'amphithéâtre et des vestiges du cœur politique de la Rome antique.' },
    { nom: 'Dégustation de street food romaine', destination: 'Rome', categorie: 'gastronomie', duree: 3, duree_unite: 'heures', prix_par_personne: 75, age_minimum: null,
      description: 'Balade dans le Trastevere pour goûter supplì, pizza al taglio et gelato artisanal.' },
    { nom: 'Promenade en gondole', destination: 'Venise', categorie: 'detente', duree: 0.5, duree_unite: 'heures', prix_par_personne: 35, age_minimum: null,
      description: 'Glisser sur les canaux secondaires à bord d\'une gondole traditionnelle.' },
    { nom: 'Atelier de verre à Murano', destination: 'Venise', categorie: 'culture', duree: 4, duree_unite: 'heures', prix_par_personne: 55, age_minimum: 8,
      description: 'Excursion sur l\'île de Murano et démonstration de soufflage de verre par un maître verrier.' },
    { nom: 'Excursion sur l\'Etna', destination: 'Sicile', categorie: 'aventure', duree: 1, duree_unite: 'jours', prix_par_personne: 110, niveau_difficulte: 'moyen', age_minimum: 10,
      description: 'Montée en 4x4 et marche guidée sur les cratères du plus haut volcan actif d\'Europe.' },
    { nom: 'Cours de cuisine sicilienne', destination: 'Sicile', categorie: 'gastronomie', duree: 4, duree_unite: 'heures', prix_par_personne: 85, age_minimum: 12,
      description: 'Préparer arancini, caponata et cannoli avec un chef local, puis les déguster.' },
  ],
  Japon: [
    { nom: 'Tour gastronomique de Dotonbori', destination: 'Osaka', categorie: 'gastronomie', duree: 3, duree_unite: 'heures', prix_par_personne: 90, age_minimum: null,
      description: 'Takoyaki, okonomiyaki et kushikatsu dans le quartier le plus animé d\'Osaka.' },
    { nom: 'Excursion au parc de Nara', destination: 'Osaka', categorie: 'culture', duree: 1, duree_unite: 'jours', prix_par_personne: 120, age_minimum: null,
      description: 'Visite du temple Todai-ji et de son grand Bouddha, au milieu des daims en liberté.' },
    { nom: 'Visite du Mémorial de la paix', destination: 'Hiroshima', categorie: 'culture', duree: 3, duree_unite: 'heures', prix_par_personne: 30, age_minimum: 10,
      description: 'Parcours guidé du parc et du musée du Mémorial pour la paix.' },
    { nom: 'Randonnée au mont Misen', destination: 'Hiroshima', categorie: 'sport', duree: 4, duree_unite: 'heures', prix_par_personne: 45, niveau_difficulte: 'moyen', age_minimum: 10,
      description: 'Ascension du sommet de l\'île de Miyajima, avec panorama sur la mer intérieure.' },
  ],
  Maroc: [
    { nom: 'Visite guidée de la médina de Fès', destination: 'Fès', categorie: 'culture', duree: 4, duree_unite: 'heures', prix_par_personne: 35, age_minimum: null,
      description: 'Médersas, souks et tanneries Chouara avec un guide officiel.' },
    { nom: 'Cours de cuisine marocaine', destination: 'Fès', categorie: 'gastronomie', duree: 3, duree_unite: 'heures', prix_par_personne: 50, age_minimum: 10,
      description: 'Marché aux épices puis préparation d\'un tajine et de pâtisseries traditionnelles.' },
    { nom: 'Balade à dos de dromadaire sur la plage', destination: 'Essaouira', categorie: 'aventure', duree: 2, duree_unite: 'heures', prix_par_personne: 40, niveau_difficulte: 'facile', age_minimum: 6,
      description: 'Promenade le long des dunes côtières au coucher du soleil.' },
    { nom: 'Initiation au kitesurf', destination: 'Essaouira', categorie: 'sport', duree: 3, duree_unite: 'heures', prix_par_personne: 80, niveau_difficulte: 'difficile', age_minimum: 14,
      description: 'Cours avec moniteur diplômé sur l\'un des meilleurs spots de glisse du Maroc.' },
  ],
  Espagne: [
    { nom: 'Visite de l\'Alcazar royal', destination: 'Séville', categorie: 'culture', duree: 2, duree_unite: 'heures', prix_par_personne: 45, age_minimum: null,
      description: 'Palais mudéjar et jardins luxuriants, parmi les plus beaux d\'Europe.' },
    { nom: 'Spectacle de flamenco', destination: 'Séville', categorie: 'culture', duree: 1.5, duree_unite: 'heures', prix_par_personne: 35, age_minimum: 6,
      description: 'Soirée flamenco authentique dans un tablao du quartier de Triana.' },
    { nom: 'Visite de la Sagrada Família', destination: 'Barcelone', categorie: 'culture', duree: 2, duree_unite: 'heures', prix_par_personne: 50, age_minimum: null,
      description: 'Visite guidée coupe-file du chef-d\'œuvre inachevé de Gaudí.' },
    { nom: 'Tapas et marché de la Boqueria', destination: 'Barcelone', categorie: 'gastronomie', duree: 3, duree_unite: 'heures', prix_par_personne: 70, age_minimum: null,
      description: 'Découverte du marché le plus célèbre de la ville puis dégustation de tapas.' },
  ],
  Grèce: [
    { nom: 'Croisière au coucher du soleil', destination: 'Santorin', categorie: 'detente', duree: 5, duree_unite: 'heures', prix_par_personne: 120, age_minimum: null,
      description: 'Navigation en catamaran autour de la caldeira, baignade et dîner à bord.' },
    { nom: 'Dégustation de vins volcaniques', destination: 'Santorin', categorie: 'gastronomie', duree: 3, duree_unite: 'heures', prix_par_personne: 75, age_minimum: 18,
      description: 'Visite de trois domaines viticoles et dégustation d\'assyrtiko.' },
    { nom: 'Visite guidée de l\'Acropole', destination: 'Athènes', categorie: 'culture', duree: 3, duree_unite: 'heures', prix_par_personne: 55, age_minimum: null,
      description: 'Parthénon, Érechthéion et musée de l\'Acropole avec un guide archéologue.' },
    { nom: 'Excursion au cap Sounion', destination: 'Athènes', categorie: 'detente', duree: 5, duree_unite: 'heures', prix_par_personne: 65, age_minimum: null,
      description: 'Route côtière jusqu\'au temple de Poséidon, face à la mer Égée.' },
  ],
  Portugal: [
    { nom: 'Tram 28 et quartier de l\'Alfama', destination: 'Lisbonne', categorie: 'culture', duree: 3, duree_unite: 'heures', prix_par_personne: 30, age_minimum: null,
      description: 'Balade guidée dans le plus vieux quartier de Lisbonne à bord du tram historique.' },
    { nom: 'Soirée fado et dîner', destination: 'Lisbonne', categorie: 'gastronomie', duree: 3, duree_unite: 'heures', prix_par_personne: 65, age_minimum: null,
      description: 'Dîner traditionnel accompagné de fadistes dans une maison de fado.' },
    { nom: 'Visite d\'une cave à porto', destination: 'Porto', categorie: 'gastronomie', duree: 1.5, duree_unite: 'heures', prix_par_personne: 25, age_minimum: 18,
      description: 'Découverte du vieillissement en fût et dégustation de trois portos à Vila Nova de Gaia.' },
    { nom: 'Croisière sur le Douro', destination: 'Porto', categorie: 'detente', duree: 1, duree_unite: 'jours', prix_par_personne: 95, age_minimum: null,
      description: 'Remontée du fleuve à travers les vignobles en terrasses, déjeuner inclus.' },
  ],
  Islande: [
    { nom: 'Circuit du Cercle d\'or', destination: 'Reykjavik et le Cercle d\'or', categorie: 'aventure', duree: 1, duree_unite: 'jours', prix_par_personne: 110, niveau_difficulte: 'facile', age_minimum: 6,
      description: 'Parc de Þingvellir, geyser Strokkur et chute de Gullfoss en une journée.' },
    { nom: 'Baignade au Blue Lagoon', destination: 'Reykjavik et le Cercle d\'or', categorie: 'detente', duree: 3, duree_unite: 'heures', prix_par_personne: 85, age_minimum: 2,
      description: 'Détente dans les eaux géothermales laiteuses, masque de silice inclus.' },
  ],
  Thaïlande: [
    { nom: 'Temples du Grand Palais et Wat Pho', destination: 'Bangkok', categorie: 'culture', duree: 4, duree_unite: 'heures', prix_par_personne: 40, age_minimum: null,
      description: 'Visite du palais royal, du Bouddha d\'émeraude et du Bouddha couché.' },
    { nom: 'Marché flottant de Damnoen Saduak', destination: 'Bangkok', categorie: 'aventure', duree: 6, duree_unite: 'heures', prix_par_personne: 45, niveau_difficulte: 'facile', age_minimum: null,
      description: 'Excursion en barque à travers le marché flottant le plus célèbre du pays.' },
    { nom: 'Cours de cuisine thaïe', destination: 'Chiang Mai', categorie: 'gastronomie', duree: 5, duree_unite: 'heures', prix_par_personne: 35, age_minimum: 8,
      description: 'Visite d\'un marché local et préparation de pad thaï, curry vert et soupe tom yum.' },
    { nom: 'Sanctuaire éthique d\'éléphants', destination: 'Chiang Mai', categorie: 'aventure', duree: 1, duree_unite: 'jours', prix_par_personne: 70, niveau_difficulte: 'facile', age_minimum: 5,
      description: 'Rencontre respectueuse avec des éléphants recueillis, sans monte.' },
  ],
  Pérou: [
    { nom: 'Visite du Machu Picchu', destination: 'Cusco et le Machu Picchu', categorie: 'culture', duree: 1, duree_unite: 'jours', prix_par_personne: 290, age_minimum: null,
      description: 'Train panoramique jusqu\'à Aguas Calientes et visite guidée de la cité inca.' },
    { nom: 'Randonnée à la montagne aux sept couleurs', destination: 'Cusco et le Machu Picchu', categorie: 'sport', duree: 1, duree_unite: 'jours', prix_par_personne: 60, niveau_difficulte: 'difficile', age_minimum: 12,
      description: 'Marche en haute altitude (5 000 m) jusqu\'au Vinicunca et ses strates colorées.' },
    { nom: 'Atelier ceviche et pisco sour', destination: 'Lima', categorie: 'gastronomie', duree: 3, duree_unite: 'heures', prix_par_personne: 65, age_minimum: 18,
      description: 'Préparer le plat national péruvien et son cocktail emblématique avec un chef liméen.' },
    { nom: 'Visite du centre historique de Lima', destination: 'Lima', categorie: 'culture', duree: 3, duree_unite: 'heures', prix_par_personne: 30, age_minimum: null,
      description: 'Plaza Mayor, couvent San Francisco et ses catacombes, balcons coloniaux.' },
  ],
  Canada: [
    { nom: 'Visite du Vieux-Québec', destination: 'Québec', categorie: 'culture', duree: 2.5, duree_unite: 'heures', prix_par_personne: 30, age_minimum: null,
      description: 'Remparts, Château Frontenac et quartier du Petit-Champlain avec un guide.' },
    { nom: 'Observation des baleines à Tadoussac', destination: 'Québec', categorie: 'aventure', duree: 1, duree_unite: 'jours', prix_par_personne: 150, niveau_difficulte: 'facile', age_minimum: 4,
      description: 'Croisière dans l\'estuaire du Saint-Laurent à la rencontre des baleines et bélugas.' },
    { nom: 'Promenade en canot sur le lac Moraine', destination: 'Rocheuses canadiennes', categorie: 'detente', duree: 1, duree_unite: 'heures', prix_par_personne: 75, age_minimum: 6,
      description: 'Pagayer sur les eaux turquoise au pied de la vallée des Dix Pics.' },
    { nom: 'Randonnée au lac Agnes', destination: 'Rocheuses canadiennes', categorie: 'sport', duree: 4, duree_unite: 'heures', prix_par_personne: 50, niveau_difficulte: 'moyen', age_minimum: 10,
      description: 'Montée depuis le lac Louise jusqu\'au salon de thé historique du lac Agnes.' },
  ],
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const opts = { transaction };

      const existants = await queryInterface.sequelize.query('SELECT id, nom FROM pays WHERE nom IN (:noms)', {
        ...opts,
        replacements: { noms: PAYS_EXISTANTS },
        type: queryInterface.sequelize.QueryTypes.SELECT,
      });
      if (existants.length !== PAYS_EXISTANTS.length) {
        throw new Error('Pays de démonstration manquants : exécuter d\'abord le seeder 20261007000002-catalogue-demo.');
      }

      const paysInseres = await queryInterface.bulkInsert(
        'pays',
        PAYS.map((p) => ({ ...p, actif: true, ...maintenant() })),
        { ...opts, returning: ['id', 'nom'] }
      );
      const idPays = Object.fromEntries([...existants, ...paysInseres].map((p) => [p.nom, p.id]));

      const lignesDestinations = Object.entries(DESTINATIONS).flatMap(([pays, liste]) =>
        liste.map((d) => ({ ...d, pays_id: idPays[pays], actif: true, ...maintenant() }))
      );
      const destInserees = await queryInterface.bulkInsert('destinations', lignesDestinations, {
        ...opts,
        returning: ['id', 'nom'],
      });
      const idDestination = Object.fromEntries(destInserees.map((d) => [d.nom, d.id]));

      const lignesActivites = Object.entries(ACTIVITES).flatMap(([pays, liste]) =>
        liste.map(({ destination, ...a }) => ({
          niveau_difficulte: null,
          ...a,
          pays_id: idPays[pays],
          destination_id: idDestination[destination],
          actif: true,
          ...maintenant(),
        }))
      );
      await queryInterface.bulkInsert('activites', lignesActivites, opts);
    });
  },

  async down(queryInterface) {
    const destinations = Object.values(DESTINATIONS).flat().map((d) => d.nom);
    const nouveauxPays = PAYS.map((p) => p.nom);
    const tousLesPays = [...PAYS_EXISTANTS, ...nouveauxPays];
    await queryInterface.sequelize.transaction(async (transaction) => {
      const filtre = 'pays_id IN (SELECT id FROM pays WHERE nom IN (:tousLesPays))';
      const opts = { transaction, replacements: { destinations, nouveauxPays, tousLesPays } };
      await queryInterface.sequelize.query(
        `DELETE FROM activites WHERE destination_id IN (SELECT id FROM destinations WHERE nom IN (:destinations) AND ${filtre})`, opts);
      await queryInterface.sequelize.query(
        `DELETE FROM activites WHERE pays_id IN (SELECT id FROM pays WHERE nom IN (:nouveauxPays))`, opts);
      await queryInterface.sequelize.query(`DELETE FROM destinations WHERE nom IN (:destinations) AND ${filtre}`, opts);
      await queryInterface.sequelize.query('DELETE FROM pays WHERE nom IN (:nouveauxPays)', opts);
    });
  },
};
