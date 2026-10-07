const h = require('../helpers');

let cat;
let tokenAgent;
let tokenClient;

beforeEach(async () => {
  await h.viderBase();
  cat = await h.creerCatalogue();
  tokenAgent = await h.connecterAgent(await h.creerAgent());
  tokenClient = await h.connecterClient(await h.creerClient());
});
afterAll(h.fermer);

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const noms = (res) => res.body.donnees.map((e) => e.nom).sort();

describe('Consultation publique (visiteur non connecté)', () => {
  it('liste uniquement les pays actifs', async () => {
    const res = await h.api().get('/api/pays');
    expect(res.status).toBe(200);
    expect(noms(res)).toEqual(['Italie']);
  });

  it('un pays masqué est introuvable pour le public', async () => {
    expect((await h.api().get(`/api/pays/${cat.japon.id}`)).status).toBe(404);
  });

  it('détail d\'un pays avec ses destinations visibles', async () => {
    const res = await h.api().get(`/api/pays/${cat.italie.id}`);
    expect(res.status).toBe(200);
    expect(res.body.destinations.map((d) => d.nom).sort()).toEqual(['Côte amalfitaine', 'Florence']);
  });

  it('activités d\'un pays : exclut celles d\'une destination masquée', async () => {
    const res = await h.api().get(`/api/pays/${cat.italie.id}/activites`);
    expect(noms(res)).toEqual(['Cours de cuisine toscane', 'Randonnée du Sentier des Dieux']);
  });

  it('les destinations d\'un pays masqué sont invisibles', async () => {
    const res = await h.api().get('/api/destinations');
    expect(noms(res)).toEqual(['Côte amalfitaine', 'Florence']);
    expect((await h.api().get(`/api/destinations/${cat.kyoto.id}`)).status).toBe(404);
    expect((await h.api().get(`/api/activites/${cat.the.id}`)).status).toBe(404);
  });

  it('filtre les activités par catégorie et par budget', async () => {
    expect(noms(await h.api().get('/api/activites?categorie=sport'))).toEqual(['Randonnée du Sentier des Dieux']);
    expect(noms(await h.api().get('/api/activites?budgetMax=50'))).toEqual(['Randonnée du Sentier des Dieux']);
    expect(noms(await h.api().get('/api/destinations?budgetMax=1000'))).toEqual(['Florence']);
  });

  it('recherche par mot-clé, insensible aux accents et à la casse', async () => {
    const res = await h.api().get('/api/recherche?q=COTE');
    expect(res.status).toBe(200);
    expect(res.body.destinations.map((d) => d.nom)).toEqual(['Côte amalfitaine']);

    const randonnee = await h.api().get('/api/recherche?q=randonnee');
    expect(randonnee.body.activites.map((a) => a.nom)).toEqual(['Randonnée du Sentier des Dieux']);
  });

  it('renvoie des nombres pour les prix et durées', async () => {
    const res = await h.api().get(`/api/activites/${cat.cuisine.id}`);
    expect(res.body).toMatchObject({ prixParPersonne: 95, duree: 4, pays: { nom: 'Italie' } });
  });

  it('valide les paramètres de requête', async () => {
    expect((await h.api().get('/api/activites?categorie=plongee')).status).toBe(400);
    expect((await h.api().get('/api/pays/abc')).status).toBe(400);
  });
});

describe('Règle 6 : seuls les agents gèrent le catalogue', () => {
  const nouveauPays = { nom: 'Pérou', continent: 'Amérique du Sud', languePrincipale: 'Espagnol', monnaie: 'Sol', visaRequis: false, decalageHoraire: -6 };

  it('un visiteur reçoit 401, un client 403', async () => {
    expect((await h.api().post('/api/pays').send(nouveauPays)).status).toBe(401);
    expect((await h.api().post('/api/pays').set(auth(tokenClient)).send(nouveauPays)).status).toBe(403);
    expect((await h.api().delete(`/api/activites/${cat.cuisine.id}`).set(auth(tokenClient))).status).toBe(403);
  });

  it('un agent crée, modifie et supprime un pays vide', async () => {
    const creation = await h.api().post('/api/pays').set(auth(tokenAgent)).send(nouveauPays);
    expect(creation.status).toBe(201);
    const { id } = creation.body;

    const modif = await h.api().patch(`/api/pays/${id}`).set(auth(tokenAgent)).send({ visaRequis: true });
    expect(modif.body.visaRequis).toBe(true);

    expect((await h.api().delete(`/api/pays/${id}`).set(auth(tokenAgent))).status).toBe(204);
  });

  it('refuse un pays en double (409)', async () => {
    const res = await h.api().post('/api/pays').set(auth(tokenAgent)).send({ ...nouveauPays, nom: 'Italie' });
    expect(res.status).toBe(409);
  });
});

describe('Règles 7, 8 et 9', () => {
  it('règle 7 : une destination exige un pays existant', async () => {
    const sansPays = await h.api().post('/api/destinations').set(auth(tokenAgent)).send({ nom: 'Lima' });
    expect(sansPays.status).toBe(400);
    const paysInconnu = await h.api().post('/api/destinations').set(auth(tokenAgent)).send({ nom: 'Lima', paysId: 9999 });
    expect(paysInconnu.status).toBe(400);
  });

  it('règle 8 : un pays contenant des destinations ou activités ne peut pas être supprimé (409)', async () => {
    const res = await h.api().delete(`/api/pays/${cat.italie.id}`).set(auth(tokenAgent));
    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/destination/);
  });

  it('règle 9 : masquer un élément le cache au public mais le conserve pour les agents', async () => {
    const masquage = await h.api().patch(`/api/destinations/${cat.florence.id}/statut`).set(auth(tokenAgent)).send({ actif: false });
    expect(masquage.status).toBe(200);

    expect((await h.api().get(`/api/destinations/${cat.florence.id}`)).status).toBe(404);
    expect((await h.api().get(`/api/destinations/${cat.florence.id}`).set(auth(tokenAgent))).status).toBe(200);

    const tout = await h.api().get('/api/destinations?inclureMasques=true').set(auth(tokenAgent));
    expect(noms(tout)).toEqual(['Côte amalfitaine', 'Florence', 'Kyoto', 'Venise']);

    // Un client qui demande les éléments masqués ne les obtient pas.
    const client = await h.api().get('/api/destinations?inclureMasques=true').set(auth(tokenClient));
    expect(noms(client)).toEqual(['Côte amalfitaine']);

    await h.api().patch(`/api/destinations/${cat.florence.id}/statut`).set(auth(tokenAgent)).send({ actif: true });
    expect((await h.api().get(`/api/destinations/${cat.florence.id}`)).status).toBe(200);
  });
});

describe('Activités', () => {
  const base = { nom: 'Visite des Offices', categorie: 'culture', duree: 3, dureeUnite: 'heures', prixParPersonne: 65 };

  it('une activité peut être rattachée au pays seul (destination facultative)', async () => {
    const res = await h.api().post('/api/activites').set(auth(tokenAgent)).send({ ...base, paysId: cat.italie.id });
    expect(res.status).toBe(201);
    expect(res.body.destinationId).toBeNull();
  });

  it('refuse une destination qui n\'appartient pas au pays de l\'activité (400)', async () => {
    const res = await h.api().post('/api/activites').set(auth(tokenAgent))
      .send({ ...base, paysId: cat.italie.id, destinationId: cat.kyoto.id });
    expect(res.status).toBe(400);
  });

  it('refuse une catégorie inconnue ou un prix négatif (400)', async () => {
    const res = await h.api().post('/api/activites').set(auth(tokenAgent))
      .send({ ...base, paysId: cat.italie.id, categorie: 'shopping', prixParPersonne: -5 });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveLength(2);
  });

  it('supprimer une destination conserve ses activités, rattachées au pays seul', async () => {
    expect((await h.api().delete(`/api/destinations/${cat.florence.id}`).set(auth(tokenAgent))).status).toBe(204);
    const res = await h.api().get(`/api/activites/${cat.cuisine.id}`);
    expect(res.status).toBe(200);
    expect(res.body.destinationId).toBeNull();
  });
});

describe('Erreurs', () => {
  it('route inconnue : 404 au format uniforme', async () => {
    const res = await h.api().get('/api/inexistant');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { status: 404, message: expect.any(String) } });
  });

  it('JSON mal formé : 400', async () => {
    const res = await h.api().post('/api/auth/connexion').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });
});
