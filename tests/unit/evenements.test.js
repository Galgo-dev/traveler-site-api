// Diffusion des événements en direct : abonnement, envoi et désabonnement, avec une requête et une réponse simulées.
const { EventEmitter } = require('events');
const evenements = require('../../utils/evenements');

function connexionSimulee() {
  const req = new EventEmitter();
  const res = { writeHead: jest.fn(), write: jest.fn() };
  return { req, res };
}

describe('évènements en direct (Server-Sent Events)', () => {
  it('ouvre un flux text/event-stream et indique le délai de reconnexion', () => {
    const { req, res } = connexionSimulee();
    evenements.abonner(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' })
    );
    expect(res.write).toHaveBeenCalledWith(expect.stringMatching(/^retry: \d+\n\n$/));
    req.emit('close');
  });

  it('envoie un événement à chaque abonné, puis plus rien après la déconnexion', () => {
    const premier = connexionSimulee();
    const second = connexionSimulee();
    evenements.abonner(premier.req, premier.res);
    evenements.abonner(second.req, second.res);
    expect(evenements.nombreAbonnes()).toBe(2);

    evenements.diffuser('catalogue', { ressource: 'destinations' });
    const message = 'event: catalogue\ndata: {"ressource":"destinations"}\n\n';
    expect(premier.res.write).toHaveBeenLastCalledWith(message);
    expect(second.res.write).toHaveBeenLastCalledWith(message);

    premier.req.emit('close');
    expect(evenements.nombreAbonnes()).toBe(1);
    premier.res.write.mockClear();
    evenements.diffuser('catalogue', { ressource: 'pays' });
    expect(premier.res.write).not.toHaveBeenCalled();

    second.req.emit('close');
    expect(evenements.nombreAbonnes()).toBe(0);
  });
});
