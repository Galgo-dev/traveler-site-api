// Tests unitaires des règles de gestion : les modèles sont simulés, aucune base n'est utilisée.
jest.mock('../../models', () => ({
  Pays: { findByPk: jest.fn(), findOne: jest.fn() },
  Destination: { findByPk: jest.fn(), count: jest.fn() },
  Activite: { count: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  Client: { findByPk: jest.fn(), findOne: jest.fn() },
}));

const { Pays, Destination, Activite, Client } = require('../../models');
const paysService = require('../../services/pays.service');
const activitesService = require('../../services/activites.service');
const clientsService = require('../../services/clients.service');

afterEach(() => jest.clearAllMocks());

describe('pays.service.supprimer (règle 8)', () => {
  const pays = { id: 1, actif: true, destroy: jest.fn() };

  it('refuse si le pays contient des destinations', async () => {
    Pays.findByPk.mockResolvedValue(pays);
    Destination.count.mockResolvedValue(2);
    Activite.count.mockResolvedValue(0);
    await expect(paysService.supprimer(1)).rejects.toMatchObject({ status: 409 });
    expect(pays.destroy).not.toHaveBeenCalled();
  });

  it('refuse si le pays contient des activités', async () => {
    Pays.findByPk.mockResolvedValue(pays);
    Destination.count.mockResolvedValue(0);
    Activite.count.mockResolvedValue(1);
    await expect(paysService.supprimer(1)).rejects.toMatchObject({ status: 409 });
  });

  it('supprime un pays vide', async () => {
    Pays.findByPk.mockResolvedValue(pays);
    Destination.count.mockResolvedValue(0);
    Activite.count.mockResolvedValue(0);
    await paysService.supprimer(1);
    expect(pays.destroy).toHaveBeenCalled();
  });

  it('renvoie 404 pour un pays inexistant', async () => {
    Pays.findByPk.mockResolvedValue(null);
    await expect(paysService.supprimer(99)).rejects.toMatchObject({ status: 404 });
  });
});

describe('activites.service.creer : cohérence pays / destination', () => {
  it('refuse une destination d\'un autre pays', async () => {
    Pays.findByPk.mockResolvedValue({ id: 1 });
    Destination.findByPk.mockResolvedValue({ id: 5, paysId: 2 });
    await expect(
      activitesService.creer({ paysId: 1, destinationId: 5, nom: 'X', categorie: 'culture', duree: 1, prixParPersonne: 1 })
    ).rejects.toMatchObject({ status: 400 });
    expect(Activite.create).not.toHaveBeenCalled();
  });
});

describe('clients.service.modifier (règle 4)', () => {
  it('ignore tout champ mot de passe, même s\'il atteint le service', async () => {
    const client = { id: 1, email: 'a@b.be', update: jest.fn() };
    Client.findByPk.mockResolvedValue(client);
    await clientsService.modifier(1, { nom: 'Nouveau', motDePasse: 'Pirate-2026xx' });
    expect(client.update).toHaveBeenCalledWith({ nom: 'Nouveau' });
  });
});
