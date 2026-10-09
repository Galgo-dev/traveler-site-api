// V3 — Schéma des avis clients : contraintes garanties par la base et les modèles.
const {
  sequelize, Demande, DemandeActivite, Avis, ReponseAvis, NoteActivite, HistoriqueAvis, Client,
} = require('../../models');
const h = require('../helpers');

beforeEach(h.viderBase);
afterAll(h.fermer);

const ilYaJours = (n) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString().slice(0, 10);

// Un voyage terminé : commande confirmée, retour dépassé, avec une activité commandée.
async function preparer() {
  const cat = await h.creerCatalogue();
  const client = await h.creerClient();
  const agent = await h.creerAgent();
  const demande = await Demande.create({
    clientId: client.id,
    destinationId: cat.florence.id,
    dateDepart: ilYaJours(20),
    dateRetour: ilYaJours(13),
    nbAdultes: 2,
    nbEnfants: 0,
    etat: 'confirmee',
  });
  await DemandeActivite.create({ demandeId: demande.id, activiteId: cat.cuisine.id, prixParPersonne: 95 });
  const avis = {
    demandeId: demande.id,
    destinationId: cat.florence.id,
    clientId: client.id,
    note: 5,
    titre: 'Séjour magnifique',
    commentaire: 'Florence est superbe, organisation parfaite.',
  };
  return { cat, client, agent, demande, avis };
}

// Insertion SQL directe : vérifie les contraintes de la base, sans les validations du modèle.
const insererSql = (a) =>
  sequelize.query(
    `INSERT INTO avis (demande_id, destination_id, client_id, note, titre, commentaire, etat, motif_refus, publie_le)
     VALUES (:demandeId, :destinationId, :clientId, :note, :titre, :commentaire, :etat, :motifRefus, :publieLe)`,
    { replacements: { etat: 'en_attente', motifRefus: null, publieLe: null, commentaire: null, ...a } }
  );

describe('Table avis', () => {
  it('crée un avis en attente avec sa réponse, ses notes d\'activités et son historique', async () => {
    const { cat, client, agent, demande, avis } = await preparer();
    const cree = await Avis.create(avis);
    await ReponseAvis.create({ avisId: cree.id, texte: 'Merci pour votre retour !', agentId: agent.id });
    await NoteActivite.create({ avisId: cree.id, demandeId: demande.id, activiteId: cat.cuisine.id, note: 4 });
    await HistoriqueAvis.create({
      avisId: cree.id, nouvelEtat: 'en_attente', auteurType: 'client', auteurClientId: client.id,
    });

    const relu = await Avis.findByPk(cree.id, {
      include: ['demande', 'destination', 'client', 'reponse', 'notesActivites', 'historique'],
    });
    expect(relu.etat).toBe('en_attente');
    expect(relu.anonyme).toBe(false);
    expect(relu.modifieLe).toBeInstanceOf(Date);
    expect(relu.destination.nom).toBe('Florence');
    expect(relu.reponse.texte).toBe('Merci pour votre retour !');
    expect(relu.notesActivites[0].note).toBe(4);
    expect(relu.historique[0].ancienEtat).toBeNull();
    expect((await Demande.findByPk(demande.id, { include: ['avis'] })).avis.id).toBe(cree.id);
  });

  it('refuse un deuxième avis sur la même commande (R4)', async () => {
    const { avis } = await preparer();
    await Avis.create(avis);
    // Sequelize traduit la violation d'unicité en UniqueConstraintError : on vérifie la contrainte d'origine.
    await expect(insererSql(avis)).rejects.toMatchObject({
      name: 'SequelizeUniqueConstraintError',
      parent: expect.objectContaining({ constraint: 'avis_demande_unique' }),
    });
  });

  it('refuse un avis sur une autre destination que celle de la commande (R5)', async () => {
    const { cat, avis } = await preparer();
    await expect(insererSql({ ...avis, destinationId: cat.amalfi.id })).rejects.toThrow(/avis_demande_destination_fkey/);
  });

  it.each([
    ['une note de 0 (R6)', { note: 0 }, /avis_note_check/],
    ['une note de 6 (R6)', { note: 6 }, /avis_note_check/],
    ['un titre vide', { titre: '   ' }, /avis_titre_check/],
    ['une note de 2 sans commentaire (R8)', { note: 2, commentaire: null }, /avis_commentaire_check/],
    ['une note de 1 avec un commentaire vide (R8)', { note: 1, commentaire: '  ' }, /avis_commentaire_check/],
    ['un refus sans motif (R11)', { etat: 'refuse' }, /avis_motif_check/],
    ['un motif sur un avis non refusé', { motifRefus: 'Coordonnées dans le texte' }, /avis_motif_check/],
    ['un avis publié sans date de publication', { etat: 'publie' }, /avis_publie_le_check/],
  ])('refuse en base : %s', async (_cas, surcharge, contrainte) => {
    const { avis } = await preparer();
    await expect(insererSql({ ...avis, ...surcharge })).rejects.toThrow(contrainte);
    await expect(Avis.create({ ...avis, ...surcharge })).rejects.toThrow();
  });

  it('accepte une note de 3 sans commentaire et un refus avec motif', async () => {
    const { avis } = await preparer();
    await expect(
      Avis.create({ ...avis, note: 3, commentaire: null, etat: 'refuse', motifRefus: 'Contient un numéro de téléphone' })
    ).resolves.toBeDefined();
  });
});

describe('Réponse, notes d\'activités et historique', () => {
  it('refuse une deuxième réponse de l\'agence (R14)', async () => {
    const { agent, avis } = await preparer();
    const cree = await Avis.create(avis);
    await ReponseAvis.create({ avisId: cree.id, texte: 'Merci !', agentId: agent.id });
    await expect(ReponseAvis.create({ avisId: cree.id, texte: 'Encore merci', agentId: agent.id })).rejects.toThrow();
  });

  it('refuse la note d\'une activité absente de la commande (R20) ou hors de 1 à 5', async () => {
    const { cat, demande, avis } = await preparer();
    const cree = await Avis.create(avis);
    await expect(
      NoteActivite.create({ avisId: cree.id, demandeId: demande.id, activiteId: cat.rando.id, note: 4 })
    ).rejects.toThrow(/notes_activites_demande_activite_fkey/);
    await expect(
      sequelize.query(
        'INSERT INTO notes_activites (avis_id, demande_id, activite_id, note) VALUES (:a, :d, :act, 6)',
        { replacements: { a: cree.id, d: demande.id, act: cat.cuisine.id } }
      )
    ).rejects.toThrow(/notes_activites_note_check/);
  });

  it('refuse un auteur d\'historique incohérent avec son type', async () => {
    const { client, avis } = await preparer();
    const cree = await Avis.create(avis);
    await expect(
      sequelize.query(
        `INSERT INTO historique_avis (avis_id, nouvel_etat, auteur_type, auteur_client_id)
         VALUES (:avisId, 'publie', 'agent', :clientId)`,
        { replacements: { avisId: cree.id, clientId: client.id } }
      )
    ).rejects.toThrow(/historique_avis_auteur_check/);
  });
});

describe('Conservation des avis', () => {
  it('conserve l\'avis anonymisé à la suppression du compte client (R19)', async () => {
    const { client, avis } = await preparer();
    const cree = await Avis.create(avis);
    await HistoriqueAvis.create({
      avisId: cree.id, nouvelEtat: 'en_attente', auteurType: 'client', auteurClientId: client.id,
    });

    await Client.destroy({ where: { id: client.id } });

    const relu = await Avis.findByPk(cree.id, { include: ['historique'] });
    expect(relu.clientId).toBeNull();
    expect(relu.titre).toBe('Séjour magnifique');
    expect(relu.historique[0].auteurClientId).toBeNull();
  });

  it('supprime la réponse, les notes et l\'historique avec l\'avis', async () => {
    const { cat, agent, demande, avis } = await preparer();
    const cree = await Avis.create(avis);
    await ReponseAvis.create({ avisId: cree.id, texte: 'Merci !', agentId: agent.id });
    await NoteActivite.create({ avisId: cree.id, demandeId: demande.id, activiteId: cat.cuisine.id, note: 5 });
    await HistoriqueAvis.create({ avisId: cree.id, nouvelEtat: 'en_attente', auteurType: 'client' });

    await cree.destroy();
    expect(await ReponseAvis.count()).toBe(0);
    expect(await NoteActivite.count()).toBe(0);
    expect(await HistoriqueAvis.count()).toBe(0);
  });
});
