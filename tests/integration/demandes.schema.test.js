// V2 — Schéma des demandes de voyage : contraintes garanties par la base et les modèles.
const { sequelize, Demande, DemandeActivite, HistoriqueDemande, Client } = require('../../models');
const h = require('../helpers');

beforeEach(h.viderBase);
afterAll(h.fermer);

const dansJours = (n) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString().slice(0, 10);

async function preparer() {
  const cat = await h.creerCatalogue();
  const client = await h.creerClient();
  const donnees = {
    clientId: client.id,
    destinationId: cat.florence.id,
    dateDepart: dansJours(30),
    dateRetour: dansJours(37),
    nbAdultes: 2,
    nbEnfants: 1,
    prixDestination: 890,
    prixUnitaire: 985,
    prixEstime: 2462.5,
  };
  return { cat, client, donnees };
}

// Insertion SQL directe : vérifie les contraintes de la base, sans passer par les validations du modèle.
const insererSql = (d, surcharge = '') =>
  sequelize.query(
    `INSERT INTO demandes (client_id, destination_id, date_depart, date_retour, nb_adultes, nb_enfants${surcharge ? ', etat, motif_annulation' : ''})
     VALUES (:clientId, :destinationId, :dateDepart, :dateRetour, :nbAdultes, :nbEnfants${surcharge ? `, ${surcharge}` : ''})`,
    { replacements: d }
  );

describe('Table demandes', () => {
  it('crée une demande en attente avec sa date de commande et ses prix figés', async () => {
    const { cat, donnees } = await preparer();
    const demande = await Demande.create(donnees);
    await DemandeActivite.create({ demandeId: demande.id, activiteId: cat.cuisine.id, prixParPersonne: 95 });
    await HistoriqueDemande.create({
      demandeId: demande.id, nouvelEtat: 'en_attente', auteurType: 'client', auteurClientId: donnees.clientId,
    });

    const relue = await Demande.findByPk(demande.id, { include: ['activites', 'lignesActivites', 'historique', 'destination'] });
    expect(relue.etat).toBe('en_attente');
    expect(relue.dateCommande).toBeInstanceOf(Date);
    expect(relue.prixEstime).toBe(2462.5);
    expect(relue.destination.nom).toBe('Florence');
    expect(relue.activites.map((a) => a.nom)).toEqual(['Cours de cuisine toscane']);
    expect(relue.lignesActivites[0].prixParPersonne).toBe(95);
    expect(relue.historique[0].ancienEtat).toBeNull();
  });

  it.each([
    ['date de retour avant le départ (R1)', { dateRetour: dansJours(29) }],
    ['retour le jour du départ (R1)', { dateRetour: dansJours(30) }],
    ['aucun adulte (R4)', { nbAdultes: 0 }],
    ['nombre d\'enfants négatif', { nbEnfants: -1 }],
    ['plus de 10 voyageurs (R5)', { nbAdultes: 6, nbEnfants: 5 }],
  ])('refuse en base : %s', async (_cas, surcharge) => {
    const { donnees } = await preparer();
    await expect(insererSql({ ...donnees, ...surcharge })).rejects.toThrow(/check constraint/);
    await expect(Demande.create({ ...donnees, ...surcharge })).rejects.toThrow();
  });

  it('refuse un motif d\'annulation sur une demande non annulée', async () => {
    const { donnees } = await preparer();
    await expect(insererSql(donnees, "'confirmee', 'motif'")).rejects.toThrow(/demandes_motif_check/);
    await expect(insererSql(donnees, "'annulee', 'Client injoignable'")).resolves.toBeDefined();
  });

  it('accepte 10 voyageurs', async () => {
    const { donnees } = await preparer();
    await expect(Demande.create({ ...donnees, nbAdultes: 4, nbEnfants: 6 })).resolves.toBeDefined();
  });
});

describe('Conservation des demandes', () => {
  it('anonymise la demande et l\'historique à la suppression du client (RGPD)', async () => {
    const { client, donnees } = await preparer();
    const demande = await Demande.create(donnees);
    await HistoriqueDemande.create({
      demandeId: demande.id, nouvelEtat: 'en_attente', auteurType: 'client', auteurClientId: client.id,
    });

    await Client.destroy({ where: { id: client.id } });

    const relue = await Demande.findByPk(demande.id, { include: ['historique'] });
    expect(relue.clientId).toBeNull();
    expect(relue.historique[0].auteurClientId).toBeNull();
    expect(relue.historique[0].auteurType).toBe('client');
  });

  it('empêche de supprimer une destination ou une activité commandée (R8, R9)', async () => {
    const { cat, donnees } = await preparer();
    const demande = await Demande.create(donnees);
    await DemandeActivite.create({ demandeId: demande.id, activiteId: cat.cuisine.id, prixParPersonne: 95 });

    await expect(cat.cuisine.destroy()).rejects.toThrow(/foreign key/);
    await expect(cat.florence.destroy()).rejects.toThrow(/foreign key/);
  });

  it('supprime les activités et l\'historique avec la demande', async () => {
    const { cat, donnees } = await preparer();
    const demande = await Demande.create(donnees);
    await DemandeActivite.create({ demandeId: demande.id, activiteId: cat.cuisine.id, prixParPersonne: 95 });
    await HistoriqueDemande.create({ demandeId: demande.id, nouvelEtat: 'en_attente', auteurType: 'client' });

    await demande.destroy();
    expect(await DemandeActivite.count()).toBe(0);
    expect(await HistoriqueDemande.count()).toBe(0);
  });
});

describe('Table historique_demandes', () => {
  it('refuse un auteur incohérent avec son type', async () => {
    const { client, donnees } = await preparer();
    const agent = await h.creerAgent();
    const demande = await Demande.create(donnees);

    await expect(
      sequelize.query(
        `INSERT INTO historique_demandes (demande_id, nouvel_etat, auteur_type, auteur_client_id)
         VALUES (:demandeId, 'confirmee', 'agent', :clientId)`,
        { replacements: { demandeId: demande.id, clientId: client.id } }
      )
    ).rejects.toThrow(/historique_demandes_auteur_check/);

    await expect(
      HistoriqueDemande.create({
        demandeId: demande.id, ancienEtat: 'en_attente', nouvelEtat: 'confirmee', auteurType: 'agent', auteurAgentId: agent.id,
      })
    ).resolves.toBeDefined();
  });
});
