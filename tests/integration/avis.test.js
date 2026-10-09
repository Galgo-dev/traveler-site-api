// V3 — Avis clients : routes /api/avis et /api/destinations/:id/avis (récap réunion 3).
const { sequelize, Demande, DemandeActivite, Avis } = require('../../models');
const h = require('../helpers');

beforeEach(h.viderBase);
afterAll(h.fermer);

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const jour = (n) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString().slice(0, 10);

// Commande créée directement en base (les dates passées ne sont pas commandables via l'API).
async function commande(client, destination, { etat = 'confirmee', depart = -20, retour = -13, activites = [] } = {}) {
  const demande = await Demande.create({
    clientId: client.id,
    destinationId: destination.id,
    dateDepart: jour(depart),
    dateRetour: jour(retour),
    nbAdultes: 2,
    nbEnfants: 0,
    etat,
  });
  await DemandeActivite.bulkCreate(
    activites.map((a) => ({ demandeId: demande.id, activiteId: a.id, prixParPersonne: a.prixParPersonne }))
  );
  return demande;
}

async function preparer() {
  const cat = await h.creerCatalogue();
  const client = await h.creerClient({ prenom: 'Julie', nom: 'Dubois' });
  const agent = await h.creerAgent({ prenom: 'Sophie' });
  const demande = await commande(client, cat.florence, { activites: [cat.cuisine] });
  return {
    cat,
    client,
    agent,
    demande,
    tokenClient: await h.connecterClient(client),
    tokenAgent: await h.connecterAgent(agent),
    avis: { demandeId: demande.id, note: 5, titre: 'Séjour magnifique', commentaire: 'Tout était parfait.' },
  };
}

const creer = (token, donnees) => h.api().post('/api/avis').set(auth(token)).send(donnees);
const valider = (token, id) => h.api().post(`/api/avis/${id}/validation`).set(auth(token));
const publics = (destinationId, query = '') => h.api().get(`/api/destinations/${destinationId}/avis${query}`);

async function avisPublie(ctx, surcharge = {}) {
  const { body } = await creer(ctx.tokenClient, { ...ctx.avis, ...surcharge });
  await valider(ctx.tokenAgent, body.id);
  return body.id;
}

describe('Rédiger un avis', () => {
  it('crée un avis en attente, invisible du public, avec ses notes d\'activités', async () => {
    const ctx = await preparer();
    const eligibles = await h.api().get('/api/avis/commandes-eligibles').set(auth(ctx.tokenClient));
    expect(eligibles.body.map((d) => d.id)).toEqual([ctx.demande.id]);
    expect(eligibles.body[0].activites[0].nom).toBe('Cours de cuisine toscane');

    const res = await creer(ctx.tokenClient, { ...ctx.avis, notesActivites: [{ activiteId: ctx.cat.cuisine.id, note: 4 }] });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ etat: 'en_attente', destination: { nom: 'Florence' }, modifiable: true, anonyme: false });
    expect(res.body.notesActivites).toEqual([expect.objectContaining({ nom: 'Cours de cuisine toscane', note: 4 })]);

    expect((await publics(ctx.cat.florence.id)).body.donnees).toEqual([]);
    const apres = await h.api().get('/api/avis/commandes-eligibles').set(auth(ctx.tokenClient));
    expect(apres.body).toEqual([]);
  });

  it.each([
    ['commande en attente (R2)', { etat: 'en_attente' }],
    ['commande annulée (R2)', { etat: 'annulee' }],
    ['voyage pas encore terminé (R3)', { depart: 20, retour: 27 }],
  ])('refuse : %s', async (_cas, options) => {
    const ctx = await preparer();
    const autre = await commande(ctx.client, ctx.cat.amalfi, options);
    const res = await creer(ctx.tokenClient, { ...ctx.avis, demandeId: autre.id });
    expect(res.status).toBe(400);
  });

  it('refuse un deuxième avis (R4), la commande d\'un autre client et un commentaire manquant (R8)', async () => {
    const ctx = await preparer();
    await creer(ctx.tokenClient, ctx.avis);
    expect((await creer(ctx.tokenClient, ctx.avis)).status).toBe(409);

    const autre = await h.connecterClient(await h.creerClient());
    expect((await creer(autre, ctx.avis)).status).toBe(404);

    const demande2 = await commande(ctx.client, ctx.cat.amalfi);
    const sansCommentaire = await creer(ctx.tokenClient, { demandeId: demande2.id, note: 2, titre: 'Bof' });
    expect(sansCommentaire.status).toBe(400);
    expect(sansCommentaire.body.error.message).toMatch(/commentaire est obligatoire/);
  });

  it('refuse la note d\'une activité hors de la commande (R20)', async () => {
    const ctx = await preparer();
    const res = await creer(ctx.tokenClient, { ...ctx.avis, notesActivites: [{ activiteId: ctx.cat.rando.id, note: 3 }] });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/activités de votre commande/);
  });

  it('est réservé aux clients connectés (R1)', async () => {
    const ctx = await preparer();
    expect((await h.api().post('/api/avis').send(ctx.avis)).status).toBe(401);
    expect((await creer(ctx.tokenAgent, ctx.avis)).status).toBe(403);
  });
});

describe('Modération', () => {
  it('valide, refuse et masque avec motif, et historise chaque action', async () => {
    const ctx = await preparer();
    const { body } = await creer(ctx.tokenClient, ctx.avis);

    expect((await h.api().get('/api/avis/compteur').set(auth(ctx.tokenAgent))).body).toEqual({ aModerer: 1 });

    const valide = await valider(ctx.tokenAgent, body.id);
    expect(valide.status).toBe(200);
    expect(valide.body).toMatchObject({ etat: 'publie', moderateurId: ctx.agent.id });
    expect((await valider(ctx.tokenAgent, body.id)).status).toBe(409);

    const sansMotif = await h.api().post(`/api/avis/${body.id}/masquage`).set(auth(ctx.tokenAgent)).send({});
    expect(sansMotif.status).toBe(400);
    const masque = await h.api().post(`/api/avis/${body.id}/masquage`).set(auth(ctx.tokenAgent))
      .send({ motif: 'Contient un numéro de téléphone' });
    expect(masque.body).toMatchObject({ etat: 'refuse', motifRefus: 'Contient un numéro de téléphone' });
    expect(masque.body.historique.map((l) => [l.ancienEtat, l.nouvelEtat])).toEqual([
      [null, 'en_attente'], ['en_attente', 'publie'], ['publie', 'refuse'],
    ]);
    expect(masque.body.historique[2]).toMatchObject({ motif: 'Contient un numéro de téléphone', auteur: { type: 'agent' } });
    expect((await publics(ctx.cat.florence.id)).body.donnees).toEqual([]);

    // P3 : le client voit le motif de refus.
    const miens = await h.api().get('/api/avis/moi').set(auth(ctx.tokenClient));
    expect(miens.body[0]).toMatchObject({ etat: 'refuse', motifRefus: 'Contient un numéro de téléphone' });
  });

  it('refuse un avis en attente avec motif, mais pas un avis déjà refusé', async () => {
    const ctx = await preparer();
    const { body } = await creer(ctx.tokenClient, ctx.avis);
    const refus = await h.api().post(`/api/avis/${body.id}/refus`).set(auth(ctx.tokenAgent)).send({ motif: 'Hors sujet' });
    expect(refus.body.etat).toBe('refuse');
    const encore = await h.api().post(`/api/avis/${body.id}/refus`).set(auth(ctx.tokenAgent)).send({ motif: 'x' });
    expect(encore.status).toBe(409);
  });

  it('file de modération (plus anciens d\'abord) et liste avec les avis négatifs en premier', async () => {
    const ctx = await preparer();
    const d2 = await commande(ctx.client, ctx.cat.amalfi);
    const premier = await creer(ctx.tokenClient, ctx.avis);
    const negatif = await creer(ctx.tokenClient, { demandeId: d2.id, note: 1, titre: 'Déçu', commentaire: 'Hôtel bruyant.' });

    const file = await h.api().get('/api/avis/moderation').set(auth(ctx.tokenAgent));
    expect(file.body.donnees.map((a) => a.id)).toEqual([premier.body.id, negatif.body.id]);

    await valider(ctx.tokenAgent, premier.body.id);
    const liste = await h.api().get('/api/avis').set(auth(ctx.tokenAgent));
    expect(liste.body.donnees.map((a) => a.id)).toEqual([negatif.body.id, premier.body.id]);
    const filtre = await h.api().get(`/api/avis?etat=publie&paysId=${ctx.cat.italie.id}`).set(auth(ctx.tokenAgent));
    expect(filtre.body.donnees.map((a) => a.id)).toEqual([premier.body.id]);
    expect((await h.api().get('/api/avis/moderation').set(auth(ctx.tokenClient))).status).toBe(403);
  });

  it('le détail personnel montre le vrai client d\'un avis anonyme (R17)', async () => {
    const ctx = await preparer();
    const { body } = await creer(ctx.tokenClient, { ...ctx.avis, anonyme: true });
    const detail = await h.api().get(`/api/avis/${body.id}`).set(auth(ctx.tokenAgent));
    expect(detail.body.client).toMatchObject({ nom: 'Dubois', email: ctx.client.email, telephone: ctx.client.telephone });
    expect(detail.body.auteurPublic).toBe('Voyageur anonyme');
    expect(detail.body.demande.id).toBe(ctx.demande.id);
  });
});

describe('Réponse de l\'agence', () => {
  it('uniquement sur un avis publié (P6), signée par le dernier agent (P7)', async () => {
    const ctx = await preparer();
    const { body } = await creer(ctx.tokenClient, ctx.avis);
    const repondre = (token, texte) => h.api().put(`/api/avis/${body.id}/reponse`).set(auth(token)).send({ texte });

    expect((await repondre(ctx.tokenAgent, 'Merci !')).status).toBe(409);
    await valider(ctx.tokenAgent, body.id);
    expect((await repondre(ctx.tokenAgent, 'Merci Julie !')).status).toBe(200);

    const autre = await h.connecterAgent(await h.creerAgent({ prenom: 'Marc' }));
    await repondre(autre, 'Merci Julie, à bientôt !');

    const res = await publics(ctx.cat.florence.id);
    expect(res.body.donnees[0].reponse).toMatchObject({ texte: 'Merci Julie, à bientôt !', agent: 'Marc' });
  });
});

describe('Le client modifie ou supprime son avis', () => {
  it('une modification du contenu repasse en attente et retire l\'avis du public (R12)', async () => {
    const ctx = await preparer();
    const id = await avisPublie(ctx);
    expect((await publics(ctx.cat.florence.id)).body.donnees).toHaveLength(1);

    const res = await h.api().patch(`/api/avis/${id}`).set(auth(ctx.tokenClient)).send({ titre: 'Séjour inoubliable' });
    expect(res.body).toMatchObject({ etat: 'en_attente', titre: 'Séjour inoubliable', publieLe: null });
    expect((await publics(ctx.cat.florence.id)).body.donnees).toEqual([]);
  });

  it('changer seulement l\'anonymat ne relance pas la modération (P5)', async () => {
    const ctx = await preparer();
    const id = await avisPublie(ctx);
    const res = await h.api().patch(`/api/avis/${id}`).set(auth(ctx.tokenClient)).send({ anonyme: true });
    expect(res.body).toMatchObject({ etat: 'publie', anonyme: true });
    expect((await publics(ctx.cat.florence.id)).body.donnees[0].auteur).toBe('Voyageur anonyme');
  });

  it('après 30 jours, l\'avis est figé (R9, P13)', async () => {
    const ctx = await preparer();
    const { body } = await creer(ctx.tokenClient, ctx.avis);
    await sequelize.query("UPDATE avis SET created_at = NOW() - INTERVAL '31 days' WHERE id = :id", { replacements: { id: body.id } });

    const modif = await h.api().patch(`/api/avis/${body.id}`).set(auth(ctx.tokenClient)).send({ titre: 'Autre' });
    expect(modif.status).toBe(409);
    expect((await h.api().delete(`/api/avis/${body.id}`).set(auth(ctx.tokenClient))).status).toBe(409);
    const miens = await h.api().get('/api/avis/moi').set(auth(ctx.tokenClient));
    expect(miens.body[0].modifiable).toBe(false);
  });

  it('supprime son avis dans le délai, mais pas celui d\'un autre', async () => {
    const ctx = await preparer();
    const id = await avisPublie(ctx);
    const autre = await h.connecterClient(await h.creerClient());
    expect((await h.api().delete(`/api/avis/${id}`).set(auth(autre))).status).toBe(404);
    expect((await h.api().delete(`/api/avis/${id}`).set(auth(ctx.tokenClient))).status).toBe(204);
    expect(await Avis.count()).toBe(0);
  });
});

describe('Affichage public', () => {
  it('affiche note moyenne, auteur, séjour et « Pas encore d\'avis » (R15, R16, P9, P10)', async () => {
    const ctx = await preparer();
    const avant = await h.api().get('/api/destinations');
    expect(avant.body.donnees.find((d) => d.nom === 'Florence').avis).toMatchObject({ nombreAvis: 0, libelle: "Pas encore d'avis" });

    await avisPublie(ctx);
    const d2 = await commande(ctx.client, ctx.cat.florence, { depart: -60, retour: -50 });
    await avisPublie(ctx, { demandeId: d2.id, note: 4 });
    const d3 = await commande(ctx.client, ctx.cat.florence, { depart: -90, retour: -80 });
    await creer(ctx.tokenClient, { demandeId: d3.id, note: 1, titre: 'Bof', commentaire: 'Non publié' });

    const fiche = await h.api().get(`/api/destinations/${ctx.cat.florence.id}`);
    expect(fiche.body.avis).toEqual({ noteMoyenne: 4.5, noteMoyenneAffichee: '4,5', nombreAvis: 2, libelle: '★ 4,5 (2 avis)' });

    const res = await publics(ctx.cat.florence.id);
    expect(res.body.resume.nombreAvis).toBe(2);
    expect(res.body.donnees[0]).toMatchObject({ auteur: 'Julie D.', note: 4 });
    expect(res.body.donnees[0].sejour.libelle).toMatch(/\d{4}$/);
    expect(res.body.donnees[0]).not.toHaveProperty('client');

    const meilleures = await publics(ctx.cat.florence.id, '?tri=meilleures');
    expect(meilleures.body.donnees.map((a) => a.note)).toEqual([5, 4]);
    expect((await publics(ctx.cat.florence.id, '?note=4')).body.donnees).toHaveLength(1);
  });

  it('masque les avis d\'une destination désactivée, puis les réaffiche (R18)', async () => {
    const ctx = await preparer();
    await avisPublie(ctx);
    await ctx.cat.florence.update({ actif: false });
    expect((await publics(ctx.cat.florence.id)).status).toBe(404);
    expect((await h.api().get('/api/avis/derniers')).body).toEqual([]);

    await ctx.cat.florence.update({ actif: true });
    expect((await publics(ctx.cat.florence.id)).body.donnees).toHaveLength(1);
  });

  it('anonymise l\'auteur quand le compte est supprimé (R19)', async () => {
    const ctx = await preparer();
    await avisPublie(ctx);
    await h.api().delete(`/api/clients/${ctx.client.id}`).set(auth(ctx.tokenAgent));
    const res = await publics(ctx.cat.florence.id);
    expect(res.body.donnees[0].auteur).toBe('Voyageur anonyme');
  });

  it('les derniers avis 5★ pour la page d\'accueil', async () => {
    const ctx = await preparer();
    await avisPublie(ctx);
    const d2 = await commande(ctx.client, ctx.cat.amalfi);
    await avisPublie(ctx, { demandeId: d2.id, note: 4 });
    const res = await h.api().get('/api/avis/derniers');
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ note: 5, destination: { nom: 'Florence' } });
  });

  it('moyenne des notes d\'activités (P11) et voyage terminé sur la commande (§10)', async () => {
    const ctx = await preparer();
    await avisPublie(ctx, { notesActivites: [{ activiteId: ctx.cat.cuisine.id, note: 4 }] });
    const activite = await h.api().get(`/api/activites/${ctx.cat.cuisine.id}`);
    expect(activite.body.avis).toMatchObject({ noteMoyenne: 4, nombreAvis: 1 });

    const demande = await h.api().get(`/api/demandes/${ctx.demande.id}`).set(auth(ctx.tokenClient));
    expect(demande.body.voyageTermine).toBe(true);
  });
});
