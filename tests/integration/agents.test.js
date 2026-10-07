const h = require('../helpers');

beforeEach(h.viderBase);
afterAll(h.fermer);

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const nouvelAgent = {
  nom: 'Lambert',
  prenom: 'Paul',
  email: 'paul.lambert@agence.be',
  motDePasse: 'Bienvenue-Agence-1',
  numeroEmploye: 'E-007',
};

describe('Gestion des comptes du personnel', () => {
  it('l\'administrateur crée un compte agent qui peut ensuite se connecter', async () => {
    const token = await h.connecterAgent(await h.creerAdmin());
    const res = await h.api().post('/api/agents').set(auth(token)).send(nouvelAgent);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'paul.lambert@agence.be', role: 'agent', actif: true });
    expect(res.body.motDePasse).toBeUndefined();

    const connexion = await h.api().post('/api/auth/agents/connexion')
      .send({ email: nouvelAgent.email, motDePasse: nouvelAgent.motDePasse });
    expect(connexion.status).toBe(200);
  });

  it('un agent ne peut pas créer de compte agent (403)', async () => {
    const token = await h.connecterAgent(await h.creerAgent());
    expect((await h.api().post('/api/agents').set(auth(token)).send(nouvelAgent)).status).toBe(403);
    expect((await h.api().get('/api/agents').set(auth(token))).status).toBe(403);
  });

  it('un agent consulte son propre compte', async () => {
    const agent = await h.creerAgent();
    const token = await h.connecterAgent(agent);
    const res = await h.api().get('/api/agents/moi').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(agent.id);
  });

  it('refuse un e-mail professionnel déjà utilisé (409)', async () => {
    const admin = await h.creerAdmin();
    const token = await h.connecterAgent(admin);
    const res = await h.api().post('/api/agents').set(auth(token)).send({ ...nouvelAgent, email: admin.email });
    expect(res.status).toBe(409);
  });

  it('désactive un agent (départ) : son jeton et sa connexion sont refusés, puis le réactive', async () => {
    const tokenAdmin = await h.connecterAgent(await h.creerAdmin());
    const agent = await h.creerAgent();
    const tokenAgent = await h.connecterAgent(agent);

    const desactivation = await h.api().patch(`/api/agents/${agent.id}/statut`).set(auth(tokenAdmin)).send({ actif: false });
    expect(desactivation.status).toBe(200);
    expect(desactivation.body.actif).toBe(false);

    expect((await h.api().get('/api/agents/moi').set(auth(tokenAgent))).status).toBe(403);
    const connexion = await h.api().post('/api/auth/agents/connexion').send({ email: agent.email, motDePasse: h.MDP });
    expect(connexion.status).toBe(403);

    await h.api().patch(`/api/agents/${agent.id}/statut`).set(auth(tokenAdmin)).send({ actif: true });
    expect(await h.connecterAgent(agent)).toEqual(expect.any(String));
  });

  it('l\'administrateur ne peut pas se désactiver lui-même ni retirer le dernier administrateur', async () => {
    const admin = await h.creerAdmin();
    const token = await h.connecterAgent(admin);
    expect((await h.api().patch(`/api/agents/${admin.id}/statut`).set(auth(token)).send({ actif: false })).status).toBe(409);
    expect((await h.api().patch(`/api/agents/${admin.id}`).set(auth(token)).send({ role: 'agent' })).status).toBe(409);
  });

  it('un changement de rôle s\'applique immédiatement', async () => {
    const tokenAdmin = await h.connecterAgent(await h.creerAdmin());
    const agent = await h.creerAgent();
    const tokenAgent = await h.connecterAgent(agent);
    await h.api().patch(`/api/agents/${agent.id}`).set(auth(tokenAdmin)).send({ role: 'administrateur' });
    expect((await h.api().get('/api/agents').set(auth(tokenAgent))).status).toBe(200);
  });
});
