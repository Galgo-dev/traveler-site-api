const mailer = require('../../utils/mailer');
const { Client } = require('../../models');
const h = require('../helpers');

const inscription = {
  nom: 'Dupont',
  prenom: 'Jean',
  email: 'Jean.Dupont@Mail.be',
  telephone: '+32 470 12 34 56',
  dateNaissance: '1965-03-12',
  motDePasse: 'Voyage-Test-2026',
};

beforeEach(h.viderBase);
afterAll(h.fermer);

describe('Inscription', () => {
  it('crée un compte client et renvoie un jeton (sans mot de passe)', async () => {
    const res = await h.api().post('/api/auth/inscription').send(inscription);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.utilisateur).toMatchObject({ email: 'jean.dupont@mail.be', role: 'client' });
    expect(res.body.utilisateur.motDePasse).toBeUndefined();
  });

  it('règle 1 : refuse un e-mail déjà utilisé, même avec une casse différente (409)', async () => {
    await h.api().post('/api/auth/inscription').send(inscription);
    const res = await h.api().post('/api/auth/inscription').send({ ...inscription, email: 'JEAN.DUPONT@mail.be' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({ status: 409 });
  });

  it('règle 2 : impossible de s\'inscrire comme agent', async () => {
    const res = await h.api().post('/api/auth/inscription').send({ ...inscription, role: 'administrateur' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ champ: 'role' })]));
  });

  it.each([
    ['trop court', 'Abc12345'],
    ['sans majuscule', 'voyage-test-2026'],
    ['sans chiffre', 'Voyage-Test-Belge'],
    ['trop courant', 'Motdepasse1'],
  ])('règle 3 : refuse un mot de passe faible (%s)', async (_, motDePasse) => {
    const res = await h.api().post('/api/auth/inscription').send({ ...inscription, motDePasse });
    expect(res.status).toBe(400);
  });

  it('refuse une date de naissance dans le futur', async () => {
    const res = await h.api().post('/api/auth/inscription').send({ ...inscription, dateNaissance: '2999-01-01' });
    expect(res.status).toBe(400);
  });
});

describe('Connexion', () => {
  it('connecte un client avec e-mail + mot de passe', async () => {
    const client = await h.creerClient({ email: 'marie@mail.be' });
    const res = await h.api().post('/api/auth/connexion').send({ email: 'MARIE@mail.be', motDePasse: h.MDP });
    expect(res.status).toBe(200);
    expect(res.body.utilisateur.id).toBe(client.id);
  });

  it('refuse un mauvais mot de passe avec un message neutre (401)', async () => {
    await h.creerClient({ email: 'marie@mail.be' });
    const mauvais = await h.api().post('/api/auth/connexion').send({ email: 'marie@mail.be', motDePasse: 'Faux-123456' });
    const inconnu = await h.api().post('/api/auth/connexion').send({ email: 'personne@mail.be', motDePasse: 'Faux-123456' });
    expect(mauvais.status).toBe(401);
    expect(inconnu.status).toBe(401);
    expect(mauvais.body.error.message).toBe(inconnu.body.error.message);
  });

  it('un client ne peut pas se connecter par la route du personnel', async () => {
    const client = await h.creerClient();
    const res = await h.api().post('/api/auth/agents/connexion').send({ email: client.email, motDePasse: h.MDP });
    expect(res.status).toBe(401);
  });

  it('refuse la connexion d\'un agent désactivé (403)', async () => {
    const agent = await h.creerAgent({ actif: false });
    const res = await h.api().post('/api/auth/agents/connexion').send({ email: agent.email, motDePasse: h.MDP });
    expect(res.status).toBe(403);
  });

  it('refuse un jeton invalide (401)', async () => {
    const res = await h.api().get('/api/clients/moi').set('Authorization', 'Bearer pas-un-jeton');
    expect(res.status).toBe(401);
  });
});

describe('Mot de passe oublié', () => {
  it('envoie un lien puis permet de choisir un nouveau mot de passe une seule fois', async () => {
    const client = await h.creerClient({ email: 'oubli@mail.be' });
    const envoi = jest.spyOn(mailer, 'envoyer').mockResolvedValue();

    const demande = await h.api().post('/api/auth/mot-de-passe-oublie').send({ email: 'oubli@mail.be' });
    expect(demande.status).toBe(200);
    expect(envoi).toHaveBeenCalledTimes(1);
    const token = envoi.mock.calls[0][0].texte.match(/token=([0-9a-f]{64})/)[1];

    const enBase = await Client.scope('avecMotDePasse').findByPk(client.id);
    expect(enBase.resetTokenHash).not.toBe(token); // seul le hash est stocké

    const nouveau = 'Nouveau-Mdp-2026';
    const reinit = await h.api().post('/api/auth/reinitialisation').send({ token, motDePasse: nouveau });
    expect(reinit.status).toBe(200);

    const connexion = await h.api().post('/api/auth/connexion').send({ email: 'oubli@mail.be', motDePasse: nouveau });
    expect(connexion.status).toBe(200);

    const rejeu = await h.api().post('/api/auth/reinitialisation').send({ token, motDePasse: 'Encore-Autre-2026' });
    expect(rejeu.status).toBe(400);
    envoi.mockRestore();
  });

  it('répond de la même façon pour un e-mail inconnu, sans envoyer de mail', async () => {
    const envoi = jest.spyOn(mailer, 'envoyer').mockResolvedValue();
    const res = await h.api().post('/api/auth/mot-de-passe-oublie').send({ email: 'inconnu@mail.be' });
    expect(res.status).toBe(200);
    expect(envoi).not.toHaveBeenCalled();
    envoi.mockRestore();
  });
});

describe('Changement de son mot de passe', () => {
  it('exige le mot de passe actuel', async () => {
    const client = await h.creerClient();
    const token = await h.connecterClient(client);
    const faux = await h.api().patch('/api/auth/mot-de-passe').set('Authorization', `Bearer ${token}`)
      .send({ motDePasseActuel: 'Mauvais-2026x', nouveauMotDePasse: 'Nouveau-Mdp-2026' });
    expect(faux.status).toBe(400);
    const ok = await h.api().patch('/api/auth/mot-de-passe').set('Authorization', `Bearer ${token}`)
      .send({ motDePasseActuel: h.MDP, nouveauMotDePasse: 'Nouveau-Mdp-2026' });
    expect(ok.status).toBe(200);
  });
});
