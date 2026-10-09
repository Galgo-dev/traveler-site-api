// V2 — Demandes de voyage : routes /api/demandes (récap réunion 2).
const { Demande, Destination, Activite } = require('../../models');
const h = require('../helpers');

beforeEach(h.viderBase);
afterAll(h.fermer);

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const dansJours = (n) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString().slice(0, 10);

async function preparer() {
  const cat = await h.creerCatalogue();
  const client = await h.creerClient();
  const agent = await h.creerAgent();
  return {
    cat,
    client,
    agent,
    tokenClient: await h.connecterClient(client),
    tokenAgent: await h.connecterAgent(agent),
    demande: {
      destinationId: cat.florence.id,
      dateDepart: dansJours(30),
      dateRetour: dansJours(37),
      nbAdultes: 2,
      nbEnfants: 1,
      activiteIds: [cat.cuisine.id],
      remarques: 'Régime sans gluten',
    },
  };
}

const creer = (token, donnees) => h.api().post('/api/demandes').set(auth(token)).send(donnees);

describe('Passer une demande', () => {
  it('calcule l\'estimation puis enregistre la demande en attente avec ses prix figés', async () => {
    const { tokenClient, demande } = await preparer();

    const estimation = await h.api().post('/api/demandes/estimation').set(auth(tokenClient)).send(demande);
    expect(estimation.status).toBe(200);
    // (890 + 95) × (2 + 0,5 × 1)
    expect(estimation.body).toMatchObject({ prixUnitaire: 985, prixEstime: 2462.5, mentionPrix: 'Estimation, non contractuel' });
    expect(estimation.body.activites[0]).toHaveProperty('ageMinimum');

    const res = await creer(tokenClient, demande);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Votre demande a bien été enregistrée, un conseiller vous rappellera sous 48 heures.');
    expect(res.body.avertissement).toBeUndefined();
    expect(res.body.demande).toMatchObject({
      etat: 'en_attente', prixDestination: 890, prixUnitaire: 985, prixEstime: 2462.5, remarques: 'Régime sans gluten',
    });
    expect(res.body.demande.activites).toEqual([expect.objectContaining({ nom: 'Cours de cuisine toscane', prixParPersonne: 95 })]);
    expect(res.body.demande.dateCommande).toBeDefined();
  });

  it('garde le prix figé quand les tarifs changent ensuite', async () => {
    const { cat, tokenClient, demande } = await preparer();
    const { body } = await creer(tokenClient, demande);

    await Destination.update({ prixAPartirDe: 1500 }, { where: { id: cat.florence.id } });
    await Activite.update({ prixParPersonne: 200 }, { where: { id: cat.cuisine.id } });

    const detail = await h.api().get(`/api/demandes/${body.demande.id}`).set(auth(tokenClient));
    expect(detail.body.prixEstime).toBe(2462.5);
    expect(detail.body.activites[0].prixParPersonne).toBe(95);
  });

  it('avertit sans bloquer en cas de doublon en attente (R14)', async () => {
    const { tokenClient, demande } = await preparer();
    await creer(tokenClient, demande);
    const res = await creer(tokenClient, demande);
    expect(res.status).toBe(201);
    expect(res.body.avertissement).toMatch(/déjà une demande en attente/);
    expect(await Demande.count()).toBe(2);
  });

  it('ne calcule pas d\'estimation pour une destination sans prix indicatif (P8)', async () => {
    const { cat, tokenClient, demande } = await preparer();
    await Destination.update({ prixAPartirDe: null }, { where: { id: cat.florence.id } });
    const res = await creer(tokenClient, demande);
    expect(res.status).toBe(201);
    expect(res.body.demande).toMatchObject({ prixDestination: null, prixUnitaire: null, prixEstime: null });
    expect(res.body.demande.activites[0].prixParPersonne).toBe(95);
  });

  it.each([
    ['retour avant le départ (R1)', { dateRetour: dansJours(29) }, /postérieure/],
    ['départ dans le passé (R2)', { dateDepart: dansJours(-3), dateRetour: dansJours(4) }, /futur/],
    ['départ dans moins de 7 jours (R3)', { dateDepart: dansJours(3), dateRetour: dansJours(10) }, /7 jours/],
    ['aucun adulte (R4)', { nbAdultes: 0 }, /Données invalides/],
    ['plus de 10 voyageurs (R5)', { nbAdultes: 6, nbEnfants: 5 }, /10 voyageurs/],
    ['remarques trop longues (P6)', { remarques: 'x'.repeat(1001) }, /Données invalides/],
  ])('refuse : %s', async (_cas, surcharge, message) => {
    const { tokenClient, demande } = await preparer();
    const res = await creer(tokenClient, { ...demande, ...surcharge });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(message);
  });

  it('refuse une activité d\'un autre pays (R6) ou une activité masquée', async () => {
    const { cat, tokenClient, demande } = await preparer();
    const autrePays = await creer(tokenClient, { ...demande, activiteIds: [cat.the.id] });
    expect(autrePays.status).toBe(400);
    expect(autrePays.body.error.message).toMatch(/pays de la destination/);

    await cat.cuisine.update({ actif: false });
    const masquee = await creer(tokenClient, demande);
    expect(masquee.status).toBe(400);
  });

  it('refuse une destination masquée (R8)', async () => {
    const { cat, tokenClient, demande } = await preparer();
    const res = await creer(tokenClient, { ...demande, destinationId: cat.masquee.id, activiteIds: [] });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/pas disponible/);
  });

  it('est réservé aux clients connectés', async () => {
    const { tokenAgent, demande } = await preparer();
    expect((await h.api().post('/api/demandes').send(demande)).status).toBe(401);
    expect((await creer(tokenAgent, demande)).status).toBe(403);
  });
});

describe('Consulter les demandes', () => {
  it('un client ne voit que ses demandes (R15)', async () => {
    const { tokenClient, demande } = await preparer();
    const { body } = await creer(tokenClient, demande);
    const autre = await h.connecterClient(await h.creerClient());

    const liste = await h.api().get('/api/demandes').set(auth(autre));
    expect(liste.body.donnees).toEqual([]);
    expect((await h.api().get(`/api/demandes/${body.demande.id}`).set(auth(autre))).status).toBe(404);

    const miennes = await h.api().get('/api/demandes').set(auth(tokenClient));
    expect(miennes.body.donnees).toHaveLength(1);
    expect(miennes.body.donnees[0].destination.nom).toBe('Florence');
    expect(miennes.body.donnees[0]).not.toHaveProperty('client');
  });

  it('le personnel voit tout, trié par date de commande décroissante, avec filtres', async () => {
    const { cat, tokenClient, tokenAgent, demande } = await preparer();
    const premiere = await creer(tokenClient, demande);
    const seconde = await creer(tokenClient, { ...demande, destinationId: cat.amalfi.id, activiteIds: [cat.rando.id] });

    const toutes = await h.api().get('/api/demandes').set(auth(tokenAgent));
    expect(toutes.status).toBe(200);
    expect(toutes.body.donnees.map((d) => d.id)).toEqual([seconde.body.demande.id, premiere.body.demande.id]);
    expect(toutes.body.donnees[0].client).toMatchObject({ nom: 'Dupont', telephone: expect.any(String) });

    const parDestination = await h.api().get(`/api/demandes?destinationId=${cat.amalfi.id}`).set(auth(tokenAgent));
    expect(parDestination.body.donnees).toHaveLength(1);
    const parPays = await h.api().get(`/api/demandes?paysId=${cat.japon.id}`).set(auth(tokenAgent));
    expect(parPays.body.donnees).toHaveLength(0);
    const parClient = await h.api().get('/api/demandes?q=dupont').set(auth(tokenAgent));
    expect(parClient.body.donnees).toHaveLength(2);
    const parPeriode = await h.api().get(`/api/demandes?departDu=${dansJours(31)}`).set(auth(tokenAgent));
    expect(parPeriode.body.donnees).toHaveLength(0);
    const parEtat = await h.api().get('/api/demandes?etat=confirmee').set(auth(tokenAgent));
    expect(parEtat.body.donnees).toHaveLength(0);
  });

  it('le détail personnel contient les coordonnées du client et l\'historique', async () => {
    const { client, tokenClient, tokenAgent, demande } = await preparer();
    const { body } = await creer(tokenClient, demande);

    const detail = await h.api().get(`/api/demandes/${body.demande.id}`).set(auth(tokenAgent));
    expect(detail.body.client).toMatchObject({ nom: client.nom, email: client.email, telephone: client.telephone });
    expect(detail.body.historique).toEqual([
      expect.objectContaining({ ancienEtat: null, nouvelEtat: 'en_attente', auteur: expect.objectContaining({ type: 'client' }) }),
    ]);
  });
});

describe('Cycle de vie', () => {
  it('le personnel confirme puis annule avec motif, chaque étape est historisée', async () => {
    const { agent, tokenClient, tokenAgent, demande } = await preparer();
    const { body } = await creer(tokenClient, demande);
    const id = body.demande.id;

    const confirmee = await h.api().post(`/api/demandes/${id}/confirmation`).set(auth(tokenAgent));
    expect(confirmee.status).toBe(200);
    expect(confirmee.body.etat).toBe('confirmee');
    expect((await h.api().post(`/api/demandes/${id}/confirmation`).set(auth(tokenAgent))).status).toBe(409);

    // R11 : confirmée → le client ne peut plus annuler lui-même.
    const parClient = await h.api().post(`/api/demandes/${id}/annulation`).set(auth(tokenClient)).send({});
    expect(parClient.status).toBe(409);

    // R13 : motif obligatoire pour le personnel.
    const sansMotif = await h.api().post(`/api/demandes/${id}/annulation`).set(auth(tokenAgent)).send({});
    expect(sansMotif.status).toBe(400);

    const annulee = await h.api().post(`/api/demandes/${id}/annulation`).set(auth(tokenAgent))
      .send({ motif: 'Plus de disponibilité à l\'hôtel' });
    expect(annulee.status).toBe(200);
    expect(annulee.body).toMatchObject({ etat: 'annulee', motifAnnulation: 'Plus de disponibilité à l\'hôtel' });
    expect(annulee.body.historique.map((l) => [l.ancienEtat, l.nouvelEtat])).toEqual([
      [null, 'en_attente'], ['en_attente', 'confirmee'], ['confirmee', 'annulee'],
    ]);
    expect(annulee.body.historique[2].auteur).toMatchObject({ type: 'agent', id: agent.id });

    // « Annulée » est un état final.
    const encore = await h.api().post(`/api/demandes/${id}/annulation`).set(auth(tokenAgent)).send({ motif: 'x' });
    expect(encore.status).toBe(409);
  });

  it('le client annule sa demande en attente (auteur = client, P4) sans voir le motif interne (P5)', async () => {
    const { client, tokenClient, tokenAgent, demande } = await preparer();
    const { body } = await creer(tokenClient, demande);

    const res = await h.api().post(`/api/demandes/${body.demande.id}/annulation`).set(auth(tokenClient)).send({});
    expect(res.status).toBe(200);
    expect(res.body.etat).toBe('annulee');
    expect(res.body).not.toHaveProperty('motifAnnulation');

    const detail = await h.api().get(`/api/demandes/${body.demande.id}`).set(auth(tokenAgent));
    expect(detail.body.historique[1].auteur).toMatchObject({ type: 'client', id: client.id });
  });

  it('un client ne peut ni confirmer ni annuler la demande d\'un autre', async () => {
    const { tokenClient, demande } = await preparer();
    const { body } = await creer(tokenClient, demande);
    const autre = await h.connecterClient(await h.creerClient());

    expect((await h.api().post(`/api/demandes/${body.demande.id}/confirmation`).set(auth(tokenClient))).status).toBe(403);
    expect((await h.api().post(`/api/demandes/${body.demande.id}/annulation`).set(auth(autre)).send({})).status).toBe(404);
  });
});

describe('RGPD', () => {
  it('conserve les demandes anonymisées et purge les remarques à la suppression du compte', async () => {
    const { client, tokenClient, tokenAgent, demande } = await preparer();
    const { body } = await creer(tokenClient, demande);

    const suppression = await h.api().delete(`/api/clients/${client.id}`).set(auth(tokenAgent));
    expect(suppression.status).toBe(204);

    const detail = await h.api().get(`/api/demandes/${body.demande.id}`).set(auth(tokenAgent));
    expect(detail.status).toBe(200);
    expect(detail.body).toMatchObject({ clientId: null, client: null, remarques: null, prixEstime: 2462.5 });
    expect(detail.body.historique[0].auteur).toEqual({ type: 'client' });
  });
});
