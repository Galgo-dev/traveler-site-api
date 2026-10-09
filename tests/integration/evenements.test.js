const http = require('http');
const app = require('../../app');
const evenements = require('../../utils/evenements');
const h = require('../helpers');

beforeEach(h.viderBase);
afterEach(() => jest.restoreAllMocks());
afterAll(h.fermer);

const auth = (token) => ({ Authorization: `Bearer ${token}` });
// L'événement part à la fin de l'envoi de la réponse : on laisse la boucle d'événements le traiter.
const laisserPartirLesEvenements = () => new Promise((resolve) => setImmediate(resolve));

describe('Modifications du catalogue en direct', () => {
  it('prévient les pages ouvertes après chaque modification réussie du catalogue', async () => {
    const { florence, italie, cuisine } = await h.creerCatalogue();
    const token = await h.connecterAgent(await h.creerAgent());
    const diffusion = jest.spyOn(evenements, 'diffuser');

    await h.api().patch(`/api/destinations/${florence.id}`).set(auth(token)).send({ prixAPartirDe: 950 });
    await h.api().patch(`/api/pays/${italie.id}/statut`).set(auth(token)).send({ actif: false });
    await h.api().delete(`/api/activites/${cuisine.id}`).set(auth(token));
    await laisserPartirLesEvenements();

    expect(diffusion.mock.calls).toEqual([
      ['catalogue', { ressource: 'destinations' }],
      ['catalogue', { ressource: 'pays' }],
      ['catalogue', { ressource: 'activites' }],
    ]);
  });

  it('ne prévient personne pour une lecture ou une modification refusée', async () => {
    const { florence } = await h.creerCatalogue();
    const token = await h.connecterAgent(await h.creerAgent());
    const diffusion = jest.spyOn(evenements, 'diffuser');

    await h.api().get(`/api/destinations/${florence.id}`);
    expect((await h.api().patch(`/api/destinations/${florence.id}`).send({ nom: 'Sans connexion' })).status).toBe(401);
    expect(
      (await h.api().patch(`/api/destinations/${florence.id}`).set(auth(token)).send({ prixAPartirDe: -5 })).status
    ).toBe(400);
    await laisserPartirLesEvenements();

    expect(diffusion).not.toHaveBeenCalled();
  });

  it('transmet l\'événement à un navigateur abonné au flux /api/evenements/catalogue', async () => {
    const { florence } = await h.creerCatalogue();
    const token = await h.connecterAgent(await h.creerAgent());
    const serveur = app.listen(0);
    const { port } = serveur.address();

    const recu = new Promise((resolve, reject) => {
      const requete = http.get(`http://127.0.0.1:${port}/api/evenements/catalogue`, (res) => {
        expect(res.headers['content-type']).toMatch(/^text\/event-stream/);
        let flux = '';
        res.setEncoding('utf8');
        res.on('data', (morceau) => {
          flux += morceau;
          if (flux.includes('event: catalogue')) {
            requete.destroy();
            resolve(flux);
          }
        });
        // Une fois abonné, l'agent modifie une destination.
        h.api().patch(`/api/destinations/${florence.id}`).set(auth(token)).send({ prixAPartirDe: 950 }).catch(reject);
      });
      requete.on('error', (erreur) => (erreur.code === 'ECONNRESET' ? null : reject(erreur)));
    });

    const flux = await recu;
    serveur.close();
    expect(flux).toContain('event: catalogue\ndata: {"ressource":"destinations"}');
  });
});
