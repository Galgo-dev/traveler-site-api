const { Favori } = require('../../models');
const h = require('../helpers');

beforeEach(h.viderBase);
afterAll(h.fermer);

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Les favoris du client', () => {
  it('ajoute, liste et retire une destination et une activité', async () => {
    const cat = await h.creerCatalogue();
    const token = await h.connecterClient(await h.creerClient());

    const ajoutDest = await h.api().put(`/api/clients/moi/favoris/destinations/${cat.florence.id}`).set(auth(token));
    expect(ajoutDest.status).toBe(201);
    const ajoutAct = await h.api().put(`/api/clients/moi/favoris/activites/${cat.cuisine.id}`).set(auth(token));
    expect(ajoutAct.status).toBe(201);

    const liste = await h.api().get('/api/clients/moi/favoris').set(auth(token));
    expect(liste.status).toBe(200);
    expect(liste.body.destinations.map((d) => d.nom)).toEqual(['Florence']);
    expect(liste.body.destinations[0].pays.nom).toBe('Italie');
    expect(liste.body.destinations[0].ajouteLe).toBeDefined();
    expect(liste.body.activites.map((a) => a.nom)).toEqual(['Cours de cuisine toscane']);

    const retrait = await h.api().delete(`/api/clients/moi/favoris/destinations/${cat.florence.id}`).set(auth(token));
    expect(retrait.status).toBe(204);
    const apres = await h.api().get('/api/clients/moi/favoris').set(auth(token));
    expect(apres.body.destinations).toEqual([]);
    expect(apres.body.activites).toHaveLength(1);
  });

  it('l\'ajout est idempotent (200 la seconde fois, aucun doublon)', async () => {
    const cat = await h.creerCatalogue();
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    const url = `/api/clients/moi/favoris/activites/${cat.rando.id}`;

    expect((await h.api().put(url).set(auth(token))).status).toBe(201);
    expect((await h.api().put(url).set(auth(token))).status).toBe(200);
    expect(await Favori.count({ where: { clientId: client.id } })).toBe(1);
  });

  it('refuse un élément masqué ou inexistant (404)', async () => {
    const cat = await h.creerCatalogue();
    const token = await h.connecterClient(await h.creerClient());

    expect((await h.api().put(`/api/clients/moi/favoris/destinations/${cat.masquee.id}`).set(auth(token))).status).toBe(404);
    expect((await h.api().put(`/api/clients/moi/favoris/destinations/${cat.kyoto.id}`).set(auth(token))).status).toBe(404);
    expect((await h.api().put(`/api/clients/moi/favoris/activites/${cat.gondole.id}`).set(auth(token))).status).toBe(404);
    expect((await h.api().put('/api/clients/moi/favoris/activites/999999').set(auth(token))).status).toBe(404);
    expect((await h.api().delete(`/api/clients/moi/favoris/activites/${cat.cuisine.id}`).set(auth(token))).status).toBe(404);
  });

  it('règle 9 : un élément masqué après coup disparaît des favoris sans être supprimé', async () => {
    const cat = await h.creerCatalogue();
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    await h.api().put(`/api/clients/moi/favoris/destinations/${cat.amalfi.id}`).set(auth(token));
    await h.api().put(`/api/clients/moi/favoris/activites/${cat.rando.id}`).set(auth(token));

    await cat.amalfi.update({ actif: false });

    const liste = await h.api().get('/api/clients/moi/favoris').set(auth(token));
    expect(liste.body.destinations).toEqual([]);
    // L'activité est rattachée à la destination masquée : elle est masquée aussi.
    expect(liste.body.activites).toEqual([]);
    expect(await Favori.count({ where: { clientId: client.id } })).toBe(2);
  });

  it('chaque client ne voit que ses propres favoris', async () => {
    const cat = await h.creerCatalogue();
    const tokenA = await h.connecterClient(await h.creerClient());
    const tokenB = await h.connecterClient(await h.creerClient());
    await h.api().put(`/api/clients/moi/favoris/destinations/${cat.florence.id}`).set(auth(tokenA));

    const listeB = await h.api().get('/api/clients/moi/favoris').set(auth(tokenB));
    expect(listeB.body.destinations).toEqual([]);
    expect((await h.api().delete(`/api/clients/moi/favoris/destinations/${cat.florence.id}`).set(auth(tokenB))).status).toBe(404);
  });

  it('règle 10 : les favoris sont effacés avec le compte du client', async () => {
    const cat = await h.creerCatalogue();
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    await h.api().put(`/api/clients/moi/favoris/destinations/${cat.florence.id}`).set(auth(token));

    await h.api().delete('/api/clients/moi').set(auth(token)).send({ motDePasse: h.MDP });
    expect(await Favori.count({ where: { clientId: client.id } })).toBe(0);
  });

  it('exige une connexion client (401 / 403)', async () => {
    expect((await h.api().get('/api/clients/moi/favoris')).status).toBe(401);
    const tokenAgent = await h.connecterAgent(await h.creerAgent());
    expect((await h.api().get('/api/clients/moi/favoris').set(auth(tokenAgent))).status).toBe(403);
  });
});

describe('Le personnel et les favoris d\'un client', () => {
  it('consulte les favoris d\'un client, y compris les éléments masqués', async () => {
    const cat = await h.creerCatalogue();
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    await h.api().put(`/api/clients/moi/favoris/destinations/${cat.florence.id}`).set(auth(token));
    await cat.florence.update({ actif: false });

    const tokenAgent = await h.connecterAgent(await h.creerAgent());
    const res = await h.api().get(`/api/clients/${client.id}/favoris`).set(auth(tokenAgent));
    expect(res.status).toBe(200);
    expect(res.body.destinations).toHaveLength(1);
    expect(res.body.destinations[0].actif).toBe(false);

    expect((await h.api().get('/api/clients/999999/favoris').set(auth(tokenAgent))).status).toBe(404);
  });

  it('règle 5 : un client ne consulte pas les favoris d\'un autre (403)', async () => {
    const autre = await h.creerClient();
    const token = await h.connecterClient(await h.creerClient());
    expect((await h.api().get(`/api/clients/${autre.id}/favoris`).set(auth(token))).status).toBe(403);
  });
});
