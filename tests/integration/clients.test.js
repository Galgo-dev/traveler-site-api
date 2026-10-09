const { Client } = require('../../models');
const h = require('../helpers');

beforeEach(h.viderBase);
afterAll(h.fermer);

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Le client et son profil', () => {
  it('consulte et modifie ses informations personnelles', async () => {
    const client = await h.creerClient();
    const token = await h.connecterClient(client);

    const moi = await h.api().get('/api/clients/moi').set(auth(token));
    expect(moi.status).toBe(200);
    expect(moi.body.motDePasse).toBeUndefined();

    const modif = await h.api().patch('/api/clients/moi').set(auth(token)).send({ telephone: '0470 99 88 77' });
    expect(modif.status).toBe(200);
    expect(modif.body.telephone).toBe('0470 99 88 77');
  });

  it('ne peut pas prendre l\'e-mail d\'un autre client (409)', async () => {
    await h.creerClient({ email: 'pris@mail.be' });
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    const res = await h.api().patch('/api/clients/moi').set(auth(token)).send({ email: 'Pris@mail.be' });
    expect(res.status).toBe(409);
  });

  it('règle 5 : ne voit jamais les autres clients ni les agents (403)', async () => {
    const autre = await h.creerClient();
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    expect((await h.api().get('/api/clients').set(auth(token))).status).toBe(403);
    expect((await h.api().get(`/api/clients/${autre.id}`).set(auth(token))).status).toBe(403);
    expect((await h.api().get('/api/agents').set(auth(token))).status).toBe(403);
  });

  it('règle 10 : supprime son compte (RGPD) après confirmation du mot de passe', async () => {
    const client = await h.creerClient();
    const token = await h.connecterClient(client);

    const refus = await h.api().delete('/api/clients/moi').set(auth(token)).send({ motDePasse: 'Mauvais-2026x' });
    expect(refus.status).toBe(400);

    const res = await h.api().delete('/api/clients/moi').set(auth(token)).send({ motDePasse: h.MDP });
    expect(res.status).toBe(204);
    expect(await Client.findByPk(client.id)).toBeNull();

    // Le jeton d'un compte supprimé n'est plus accepté.
    expect((await h.api().get('/api/clients/moi').set(auth(token))).status).toBe(401);
  });
});

describe('Le personnel et les dossiers clients', () => {
  it('liste et recherche les clients (y compris les homonymes, distingués par e-mail)', async () => {
    await h.creerClient({ nom: 'Peeters', prenom: 'Anne', email: 'anne1@mail.be' });
    await h.creerClient({ nom: 'Peeters', prenom: 'Anne', email: 'anne2@mail.be' });
    await h.creerClient({ nom: 'Janssens', prenom: 'Luc' });
    const token = await h.connecterAgent(await h.creerAgent());

    const res = await h.api().get('/api/clients?q=peeters').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(2);
    expect(res.body.donnees.map((c) => c.email).sort()).toEqual(['anne1@mail.be', 'anne2@mail.be']);
    expect(res.body.donnees[0].motDePasse).toBeUndefined();
  });

  it('corrige les informations d\'un client', async () => {
    const client = await h.creerClient();
    const token = await h.connecterAgent(await h.creerAgent());
    const res = await h.api().patch(`/api/clients/${client.id}`).set(auth(token)).send({ nom: 'Dupond' });
    expect(res.status).toBe(200);
    expect(res.body.nom).toBe('Dupond');
  });

  it('règle 4 : ne peut jamais modifier le mot de passe d\'un client', async () => {
    const client = await h.creerClient();
    const token = await h.connecterAgent(await h.creerAgent());
    const res = await h.api().patch(`/api/clients/${client.id}`).set(auth(token)).send({ motDePasse: 'Pirate-2026xx' });
    expect(res.status).toBe(400);
    // Le client peut toujours se connecter avec son mot de passe d'origine.
    expect(await h.connecterClient(client)).toEqual(expect.any(String));
  });

  it('traite une demande de suppression RGPD', async () => {
    const client = await h.creerClient();
    const token = await h.connecterAgent(await h.creerAgent());
    expect((await h.api().delete(`/api/clients/${client.id}`).set(auth(token))).status).toBe(204);
    expect((await h.api().get(`/api/clients/${client.id}`).set(auth(token))).status).toBe(404);
  });

  it('un visiteur non connecté n\'a pas accès aux clients (401)', async () => {
    expect((await h.api().get('/api/clients')).status).toBe(401);
  });
});

describe('Demande de suppression de compte (règle 10)', () => {
  const demander = (token, motDePasse) =>
    h.api().post('/api/clients/moi/demande-suppression').set(auth(token)).send({ motDePasse });

  it('est confirmée par le mot de passe, enregistre la date et garde la première demande', async () => {
    const client = await h.creerClient();
    const token = await h.connecterClient(client);

    const refus = await demander(token, 'Mauvais-2026x');
    expect(refus.status).toBe(400);
    expect((await Client.findByPk(client.id)).suppressionDemandeeLe).toBeNull();

    const demande = await demander(token, h.MDP);
    expect(demande.status).toBe(200);
    expect(demande.body.suppressionDemandeeLe).toEqual(expect.any(String));
    expect(demande.body.motDePasse).toBeUndefined();

    // Renouveler la demande ne repousse pas la date de la première.
    const nouvelle = await demander(token, h.MDP);
    expect(nouvelle.body.suppressionDemandeeLe).toBe(demande.body.suppressionDemandeeLe);
  });

  it('peut être annulée par le client', async () => {
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    await demander(token, h.MDP);

    const res = await h.api().delete('/api/clients/moi/demande-suppression').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.suppressionDemandeeLe).toBeNull();
  });

  it('apparaît dans la liste du personnel, qui efface ensuite le compte', async () => {
    const demandeur = await h.creerClient({ email: 'demandeur@mail.be' });
    await h.creerClient({ email: 'sans-demande@mail.be' });
    await demander(await h.connecterClient(demandeur), h.MDP);
    const token = await h.connecterAgent(await h.creerAgent());

    const liste = await h.api().get('/api/clients?suppressionDemandee=true').set(auth(token));
    expect(liste.status).toBe(200);
    expect(liste.body.donnees.map((c) => c.email)).toEqual(['demandeur@mail.be']);

    expect((await h.api().delete(`/api/clients/${demandeur.id}`).set(auth(token))).status).toBe(204);
    const apres = await h.api().get('/api/clients?suppressionDemandee=true').set(auth(token));
    expect(apres.body.pagination.total).toBe(0);
  });

  it('règle 5 : un client ne voit pas la liste des demandes (403)', async () => {
    const token = await h.connecterClient(await h.creerClient());
    expect((await h.api().get('/api/clients?suppressionDemandee=true').set(auth(token))).status).toBe(403);
  });

  it('est réservée au client : le personnel ne peut pas faire de demande pour lui-même (403)', async () => {
    const token = await h.connecterAgent(await h.creerAgent());
    expect((await demander(token, h.MDP)).status).toBe(403);
  });
});
