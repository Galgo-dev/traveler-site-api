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
