'use strict';

// Petit catalogue de démonstration pour le développement (3 pays, destinations, activités).
const maintenant = () => ({ created_at: new Date(), updated_at: new Date() });

const PAYS = [
  {
    nom: 'Italie', continent: 'Europe', langue_principale: 'Italien', monnaie: 'Euro (EUR)',
    description_courte: "Art, histoire et dolce vita, de la Toscane à la Sicile.",
    visa_requis: false, decalage_horaire: 0,
  },
  {
    nom: 'Japon', continent: 'Asie', langue_principale: 'Japonais', monnaie: 'Yen (JPY)',
    description_courte: 'Temples millénaires, cerisiers en fleurs et grandes métropoles.',
    visa_requis: false, decalage_horaire: 8,
  },
  {
    nom: 'Maroc', continent: 'Afrique', langue_principale: 'Arabe', monnaie: 'Dirham (MAD)',
    description_courte: 'Médinas colorées, désert et montagnes de l\'Atlas.',
    visa_requis: false, decalage_horaire: 0,
  },
];

const DESTINATIONS = {
  Italie: [
    { nom: 'Florence', description: 'Berceau de la Renaissance.', periode_ideale: "d'avril à juin et en septembre", prix_a_partir_de: 890 },
    { nom: 'Côte amalfitaine', description: 'Villages accrochés aux falaises.', periode_ideale: 'de mai à septembre', prix_a_partir_de: 1190 },
  ],
  Japon: [
    { nom: 'Kyoto', description: 'Ancienne capitale impériale et ses temples.', periode_ideale: "de mars à mai et d'octobre à novembre", prix_a_partir_de: 2490 },
    { nom: 'Tokyo', description: 'Mégalopole entre tradition et modernité.', periode_ideale: 'de mars à mai', prix_a_partir_de: 2290 },
  ],
  Maroc: [
    { nom: 'Marrakech', description: 'La ville rouge et sa place Jemaa el-Fna.', periode_ideale: "de mars à mai et d'octobre à novembre", prix_a_partir_de: 650 },
  ],
};

const ACTIVITES = {
  Italie: [
    { nom: 'Visite guidée des Offices', destination: 'Florence', categorie: 'culture', duree: 3, duree_unite: 'heures', prix_par_personne: 65, age_minimum: null },
    { nom: 'Cours de cuisine toscane', destination: 'Florence', categorie: 'gastronomie', duree: 4, duree_unite: 'heures', prix_par_personne: 95, age_minimum: 12 },
    { nom: 'Randonnée du Sentier des Dieux', destination: 'Côte amalfitaine', categorie: 'sport', duree: 5, duree_unite: 'heures', prix_par_personne: 45, niveau_difficulte: 'moyen', age_minimum: 10 },
  ],
  Japon: [
    { nom: 'Cérémonie du thé', destination: 'Kyoto', categorie: 'culture', duree: 1.5, duree_unite: 'heures', prix_par_personne: 40, age_minimum: null },
    { nom: 'Onsen traditionnel', destination: null, categorie: 'detente', duree: 1, duree_unite: 'jours', prix_par_personne: 180, age_minimum: null },
  ],
  Maroc: [
    { nom: 'Nuit sous tente dans le désert d\'Agafay', destination: 'Marrakech', categorie: 'aventure', duree: 2, duree_unite: 'jours', prix_par_personne: 210, niveau_difficulte: 'facile', age_minimum: 6 },
    { nom: 'Hammam et massage', destination: 'Marrakech', categorie: 'detente', duree: 2, duree_unite: 'heures', prix_par_personne: 55, age_minimum: 16 },
  ],
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const opts = { transaction };
      const paysInseres = await queryInterface.bulkInsert(
        'pays',
        PAYS.map((p) => ({ ...p, actif: true, ...maintenant() })),
        { ...opts, returning: ['id', 'nom'] }
      );
      const idPays = Object.fromEntries(paysInseres.map((p) => [p.nom, p.id]));

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
          destination_id: destination ? idDestination[destination] : null,
          description: null,
          actif: true,
          ...maintenant(),
        }))
      );
      await queryInterface.bulkInsert('activites', lignesActivites, opts);
    });
  },

  async down(queryInterface) {
    const noms = PAYS.map((p) => p.nom);
    await queryInterface.sequelize.transaction(async (transaction) => {
      const opts = { transaction, replacements: { noms } };
      await queryInterface.sequelize.query(
        'DELETE FROM activites WHERE pays_id IN (SELECT id FROM pays WHERE nom IN (:noms))', opts);
      await queryInterface.sequelize.query(
        'DELETE FROM destinations WHERE pays_id IN (SELECT id FROM pays WHERE nom IN (:noms))', opts);
      await queryInterface.sequelize.query('DELETE FROM pays WHERE nom IN (:noms)', opts);
    });
  },
};
