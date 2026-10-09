// Avis clients (v3, récap réunion 3). Règles R1 à R20.
const { Op, literal } = require('sequelize');
const {
  sequelize, Pays, Destination, Activite, Client, Agent, Demande, DemandeActivite,
  Avis, ReponseAvis, NoteActivite, HistoriqueAvis,
} = require('../models');
const ApiError = require('../utils/ApiError');
const pagination = require('../utils/pagination');
const config = require('../config/config');
const { aujourdhui, ajouterJours, moisAnnee } = require('../utils/dates');
const { et } = require('./recherche.utils');
const { resumeNotes } = require('./avis.utils');

const AUTEUR_ANONYME = 'Voyageur anonyme';
const NB_DERNIERS = 5;
const JOUR_MS = 24 * 3600 * 1000;

const estPersonnel = (utilisateur) => Boolean(utilisateur) && utilisateur.type === 'agent';

// --- Délais ---

// R9 / P1 : le client agit sur son avis pendant N jours à partir de sa création.
const limiteModification = (avis) =>
  new Date(new Date(avis.createdAt).getTime() + config.avis.delaiModificationJours * JOUR_MS);

const estModifiable = (avis) => Date.now() < limiteModification(avis).getTime();

function verifierDelai(avis) {
  // P13 : après le délai, l'avis est figé, quel que soit son état.
  if (!estModifiable(avis)) {
    throw ApiError.conflit(
      `Le délai de ${config.avis.delaiModificationJours} jours est dépassé : cet avis ne peut plus être modifié ni supprimé.`
    );
  }
}

// --- Éligibilité (R2, R3, R4, P2) ---

// §10 : voyage terminé = commande confirmée dont la date de retour est dépassée.
const voyageTermine = (demande) => demande.etat === 'confirmee' && demande.dateRetour < aujourdhui();

function filtreEligible(clientId) {
  const dateRetour = { [Op.lt]: aujourdhui() };
  if (config.avis.delaiMaxRedactionJours) {
    dateRetour[Op.gte] = ajouterJours(aujourdhui(), -config.avis.delaiMaxRedactionJours);
  }
  return { clientId, etat: 'confirmee', dateRetour };
}

const inclureActivitesCommande = {
  model: DemandeActivite,
  as: 'lignesActivites',
  attributes: ['activiteId'],
  include: [{ model: Activite, as: 'activite', attributes: ['id', 'nom', 'categorie'] }],
};

// Commandes pour lesquelles le client peut encore donner son avis (bouton « Donner mon avis »).
async function commandesEligibles(clientId) {
  const demandes = await Demande.findAll({
    where: { ...filtreEligible(clientId), '$avis.id$': null },
    include: [
      { model: Avis, as: 'avis', attributes: [], required: false },
      { model: Destination, as: 'destination', attributes: ['id', 'nom'] },
      inclureActivitesCommande,
    ],
    order: [['dateRetour', 'DESC'], ['id', 'DESC']],
  });
  return demandes.map((d) => ({
    id: d.id,
    destination: d.destination,
    dateDepart: d.dateDepart,
    dateRetour: d.dateRetour,
    activites: d.lignesActivites.map((l) => l.activite),
  }));
}

async function demandeEligible(clientId, demandeId) {
  const demande = await Demande.findByPk(demandeId, { include: [inclureActivitesCommande] });
  if (!demande || demande.clientId !== clientId) throw ApiError.introuvable('Commande introuvable.');
  if (!voyageTermine(demande)) {
    throw ApiError.requeteInvalide('Un avis ne peut être donné qu\'après un voyage confirmé et terminé.');
  }
  const limite = config.avis.delaiMaxRedactionJours;
  if (limite && demande.dateRetour < ajouterJours(aujourdhui(), -limite)) {
    throw ApiError.requeteInvalide(`Un avis doit être donné dans les ${limite} jours qui suivent le retour.`);
  }
  if (await Avis.count({ where: { demandeId } })) {
    throw ApiError.conflit('Vous avez déjà donné votre avis sur ce voyage.');
  }
  return demande;
}

// --- Contrôles du contenu ---

const texteOuNull = (valeur) => (typeof valeur === 'string' && valeur.trim() ? valeur.trim() : null);

// R8
function verifierCommentaire(note, commentaire) {
  if (note <= Avis.NOTE_MAX_SANS_COMMENTAIRE && !commentaire) {
    throw ApiError.requeteInvalide(
      `Merci d'expliquer votre note : un commentaire est obligatoire pour ${Avis.NOTE_MAX_SANS_COMMENTAIRE} étoiles ou moins.`
    );
  }
}

// R20 : seules les activités de la commande peuvent être notées.
async function verifierNotesActivites(demandeId, notes) {
  if (!notes.length) return;
  const lignes = await DemandeActivite.findAll({ where: { demandeId }, attributes: ['activiteId'] });
  const commandees = new Set(lignes.map((l) => l.activiteId));
  if (notes.some((n) => !commandees.has(n.activiteId))) {
    throw ApiError.requeteInvalide('Seules les activités de votre commande peuvent être notées.');
  }
}

const enregistrerNotes = (avis, notes, transaction) =>
  NoteActivite.bulkCreate(
    notes.map((n) => ({ avisId: avis.id, demandeId: avis.demandeId, activiteId: n.activiteId, note: n.note })),
    { transaction }
  );

const historiser = (avis, ancienEtat, nouvelEtat, utilisateur, motif, transaction) =>
  HistoriqueAvis.create(
    {
      avisId: avis.id,
      ancienEtat,
      nouvelEtat,
      auteurType: estPersonnel(utilisateur) ? 'agent' : 'client',
      ...(estPersonnel(utilisateur) ? { auteurAgentId: utilisateur.id } : { auteurClientId: utilisateur.id }),
      motif: motif || null,
    },
    { transaction }
  );

// --- Le client rédige, modifie, supprime ---

async function creer(utilisateur, donnees) {
  const demande = await demandeEligible(utilisateur.id, donnees.demandeId);
  const commentaire = texteOuNull(donnees.commentaire);
  verifierCommentaire(donnees.note, commentaire);
  await verifierNotesActivites(demande.id, donnees.notesActivites);

  const id = await sequelize.transaction(async (transaction) => {
    // R5 : destination et client déduits de la commande ; R10 : en attente de validation.
    const avis = await Avis.create(
      {
        demandeId: demande.id,
        destinationId: demande.destinationId,
        clientId: utilisateur.id,
        note: donnees.note,
        titre: donnees.titre,
        commentaire,
        anonyme: donnees.anonyme,
      },
      { transaction }
    );
    await enregistrerNotes(avis, donnees.notesActivites, transaction);
    await historiser(avis, null, 'en_attente', utilisateur, null, transaction);
    return avis.id;
  });
  return obtenir(id, utilisateur);
}

async function modifier(id, utilisateur, donnees) {
  await sequelize.transaction(async (transaction) => {
    const avis = await trouver(id, utilisateur, { transaction, lock: transaction.LOCK.UPDATE });
    verifierDelai(avis);

    const contenu = {
      note: donnees.note ?? avis.note,
      titre: donnees.titre ?? avis.titre,
      commentaire: donnees.commentaire !== undefined ? texteOuNull(donnees.commentaire) : avis.commentaire,
    };
    verifierCommentaire(contenu.note, contenu.commentaire);
    const contenuModifie = Object.keys(contenu).some((champ) => contenu[champ] !== avis[champ]);
    const anonymatModifie = donnees.anonyme !== undefined && donnees.anonyme !== avis.anonyme;

    const changements = { ...contenu };
    if (donnees.anonyme !== undefined) changements.anonyme = donnees.anonyme;
    // R12 : un contenu modifié repasse en modération et quitte l'affichage public.
    // P5 : changer seulement l'anonymat ne déclenche pas de nouvelle modération.
    const ancienEtat = avis.etat;
    if (contenuModifie) Object.assign(changements, { etat: 'en_attente', motifRefus: null, publieLe: null });

    if (donnees.notesActivites !== undefined) {
      // P11 : notes d'activités sans modération.
      await verifierNotesActivites(avis.demandeId, donnees.notesActivites);
      await NoteActivite.destroy({ where: { avisId: avis.id }, transaction });
      await enregistrerNotes(avis, donnees.notesActivites, transaction);
    }
    if (contenuModifie || anonymatModifie || donnees.notesActivites !== undefined) changements.modifieLe = new Date();

    await avis.update(changements, { transaction });
    if (contenuModifie && ancienEtat !== 'en_attente') {
      await historiser(avis, ancienEtat, 'en_attente', utilisateur, null, transaction);
    }
  });
  return obtenir(id, utilisateur);
}

// §8 : suppression définitive (réponse, notes et historique compris), dans le délai, depuis tout état.
async function supprimer(id, utilisateur) {
  const avis = await trouver(id, utilisateur);
  verifierDelai(avis);
  await avis.destroy();
}

// --- Modération par le personnel (§6) ---

const TRANSITIONS = {
  validation: { de: 'en_attente', vers: 'publie', erreur: 'Seul un avis en attente peut être validé.' },
  refus: { de: 'en_attente', vers: 'refuse', erreur: 'Seul un avis en attente peut être refusé.', motif: true },
  masquage: { de: 'publie', vers: 'refuse', erreur: 'Seul un avis publié peut être masqué.', motif: true },
};

async function moderer(action, id, agent, motif) {
  const transition = TRANSITIONS[action];
  const texte = texteOuNull(motif);
  // R11 : tout refus ou masquage exige un motif (visible par le client : P3).
  if (transition.motif && !texte) throw ApiError.requeteInvalide('Le motif est obligatoire.');

  await sequelize.transaction(async (transaction) => {
    const avis = await trouver(id, agent, { transaction, lock: transaction.LOCK.UPDATE });
    if (avis.etat !== transition.de) throw ApiError.conflit(transition.erreur);
    const maintenant = new Date();
    await avis.update(
      {
        etat: transition.vers,
        motifRefus: transition.motif ? texte : null,
        publieLe: transition.vers === 'publie' ? maintenant : avis.publieLe,
        moderateurId: agent.id,
        modereLe: maintenant,
      },
      { transaction }
    );
    // P14 : chaque action de modération est tracée.
    await historiser(avis, transition.de, transition.vers, agent, texte, transaction);
  });
  return obtenir(id, agent);
}

const valider = (id, agent) => moderer('validation', id, agent);
const refuser = (id, agent, motif) => moderer('refus', id, agent, motif);
const masquer = (id, agent, motif) => moderer('masquage', id, agent, motif);

// R14 : une seule réponse, modifiable par tout agent (P7) ; uniquement sur un avis publié (P6).
async function repondre(id, agent, texte) {
  await sequelize.transaction(async (transaction) => {
    const avis = await trouver(id, agent, { transaction, lock: transaction.LOCK.UPDATE });
    if (avis.etat !== 'publie') throw ApiError.conflit('L\'agence ne peut répondre qu\'à un avis publié.');
    const existante = await ReponseAvis.findOne({ where: { avisId: avis.id }, transaction });
    if (existante) await existante.update({ texte, agentId: agent.id }, { transaction });
    else await ReponseAvis.create({ avisId: avis.id, texte, agentId: agent.id }, { transaction });
  });
  return obtenir(id, agent);
}

// --- Présentation ---

// R17 / R19 : « Julie D. », ou « Voyageur anonyme » si l'avis est anonyme ou le compte supprimé.
function nomPublic(avis) {
  if (avis.anonyme || !avis.client) return AUTEUR_ANONYME;
  return `${avis.client.prenom} ${avis.client.nom.charAt(0).toUpperCase()}.`;
}

const reponsePublique = (reponse) =>
  reponse && {
    texte: reponse.texte,
    date: reponse.createdAt,
    modifieeLe: reponse.updatedAt,
    // P7 : signée par le dernier agent ayant écrit ou modifié la réponse.
    agent: reponse.agent ? reponse.agent.prenom : null,
  };

const sejour = (demande) => demande && { dateDepart: demande.dateDepart, libelle: moisAnnee(demande.dateDepart) };

// Vue publique d'un avis publié (§7).
function vuePublique(avis) {
  return {
    id: avis.id,
    note: avis.note,
    titre: avis.titre,
    commentaire: avis.commentaire,
    auteur: nomPublic(avis),
    // P10 : mois et année de départ.
    sejour: sejour(avis.demande),
    publieLe: avis.publieLe,
    ...(avis.destination ? { destination: { id: avis.destination.id, nom: avis.destination.nom } } : {}),
    reponse: reponsePublique(avis.reponse) || null,
  };
}

const vueNotes = (avis) =>
  (avis.notesActivites || []).map((n) => ({
    activiteId: n.activiteId,
    nom: n.activite ? n.activite.nom : undefined,
    note: n.note,
  }));

// Vue du client sur ses propres avis : état, motif de refus (P3), délai de modification.
function vueClient(avis) {
  return {
    id: avis.id,
    demandeId: avis.demandeId,
    destination: avis.destination && { id: avis.destination.id, nom: avis.destination.nom },
    note: avis.note,
    titre: avis.titre,
    commentaire: avis.commentaire,
    anonyme: avis.anonyme,
    etat: avis.etat,
    motifRefus: avis.motifRefus,
    publieLe: avis.publieLe,
    creeLe: avis.createdAt,
    modifieLe: avis.modifieLe,
    modifiableJusquau: limiteModification(avis),
    modifiable: estModifiable(avis),
    sejour: sejour(avis.demande),
    notesActivites: vueNotes(avis),
    reponse: avis.etat === 'publie' ? reponsePublique(avis.reponse) || null : null,
  };
}

// Vue du personnel : tout, y compris le vrai client d'un avis anonyme (R17).
function vuePersonnel(avis) {
  const brut = avis.get({ plain: true });
  return {
    ...brut,
    auteurPublic: nomPublic(avis),
    notesActivites: vueNotes(avis),
    reponse: reponsePublique(avis.reponse) || null,
    modifiableParLeClientJusquau: limiteModification(avis),
    ...(brut.historique
      ? {
        historique: brut.historique.map(({ auteurClient, auteurAgent, ...ligne }) => ({
          ...ligne,
          auteur: auteurAgent
            ? { type: 'agent', id: auteurAgent.id, nom: auteurAgent.nom, prenom: auteurAgent.prenom }
            : { type: ligne.auteurType, ...(auteurClient ? { id: auteurClient.id, nom: auteurClient.nom, prenom: auteurClient.prenom } : {}) },
        })),
      }
      : {}),
  };
}

// --- Consultation ---

const ATTRIBUTS_CLIENT = ['id', 'nom', 'prenom', 'email', 'telephone'];
const inclureDestination = {
  model: Destination,
  as: 'destination',
  attributes: ['id', 'nom', 'paysId', 'actif'],
  include: [{ model: Pays, as: 'pays', attributes: ['id', 'nom', 'actif'] }],
};
const inclureDemande = { model: Demande, as: 'demande', attributes: ['id', 'dateDepart', 'dateRetour', 'etat'] };
const inclureReponse = {
  model: ReponseAvis,
  as: 'reponse',
  include: [{ model: Agent, as: 'agent', attributes: ['id', 'prenom', 'nom'] }],
};
const inclureNotes = {
  model: NoteActivite,
  as: 'notesActivites',
  include: [{ model: Activite, as: 'activite', attributes: ['id', 'nom'] }],
};

async function trouver(id, utilisateur, options = {}) {
  const avis = await Avis.findByPk(id, options);
  // Un client ne voit que ses avis : celui d'un autre est traité comme inexistant.
  if (!avis || (!estPersonnel(utilisateur) && avis.clientId !== utilisateur.id)) {
    throw ApiError.introuvable('Avis introuvable.');
  }
  return avis;
}

async function obtenir(id, utilisateur) {
  const personnel = estPersonnel(utilisateur);
  const avis = await trouver(id, utilisateur, {
    include: [
      inclureDestination,
      { ...inclureDemande, ...(personnel ? { attributes: ['id', 'dateDepart', 'dateRetour', 'etat', 'nbAdultes', 'nbEnfants'] } : {}) },
      { model: Client, as: 'client', attributes: personnel ? ATTRIBUTS_CLIENT : ['id', 'prenom', 'nom'] },
      inclureReponse,
      inclureNotes,
      ...(personnel
        ? [
          { model: Agent, as: 'moderateur', attributes: ['id', 'nom', 'prenom'] },
          {
            model: HistoriqueAvis,
            as: 'historique',
            include: [
              { model: Client, as: 'auteurClient', attributes: ['id', 'nom', 'prenom'] },
              { model: Agent, as: 'auteurAgent', attributes: ['id', 'nom', 'prenom'] },
            ],
          },
        ]
        : []),
    ],
    order: personnel ? [[{ model: HistoriqueAvis, as: 'historique' }, 'id', 'ASC']] : undefined,
  });
  return personnel ? vuePersonnel(avis) : vueClient(avis);
}

async function mesAvis(clientId) {
  const avis = await Avis.findAll({
    where: { clientId },
    include: [inclureDestination, inclureDemande, inclureReponse, inclureNotes],
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
  });
  return avis.map(vueClient);
}

// R15 / R18 : visible du public = publié, sur une destination active d'un pays actif.
const inclureDestinationVisible = {
  ...inclureDestination,
  required: true,
  where: { actif: true },
  include: [{ model: Pays, as: 'pays', attributes: [], required: true, where: { actif: true } }],
};
const inclusionsPubliques = [
  { model: Client, as: 'client', attributes: ['id', 'prenom', 'nom'] },
  inclureDemande,
  inclureReponse,
];

async function avisDeDestination(destinationId, { page, limite, tri, note }) {
  const destination = await Destination.findByPk(destinationId, { include: [{ model: Pays, as: 'pays' }] });
  if (!destination || !destination.actif || !destination.pays.actif) {
    throw ApiError.introuvable('Destination introuvable.');
  }

  const resultat = await Avis.findAndCountAll({
    where: { destinationId, etat: 'publie', ...(note ? { note } : {}) },
    include: inclusionsPubliques,
    order: tri === 'meilleures'
      ? [['note', 'DESC'], ['publieLe', 'DESC'], ['id', 'DESC']]
      : [['publieLe', 'DESC'], ['id', 'DESC']],
    distinct: true,
    ...pagination.versOptions({ page, limite }),
  });
  const reponse = pagination.formater(resultat, { page, limite });
  reponse.donnees = reponse.donnees.map(vuePublique);
  const resumes = await resumeNotes([destination.id]);
  return { resume: resumes.get(destination.id), ...reponse };
}

// Page d'accueil (souhaitable) : les 5 derniers avis publiés à 5 étoiles.
async function derniersAvisCinqEtoiles() {
  const avis = await Avis.findAll({
    where: { etat: 'publie', note: 5 },
    include: [inclureDestinationVisible, ...inclusionsPubliques],
    order: [['publieLe', 'DESC'], ['id', 'DESC']],
    limit: NB_DERNIERS,
  });
  return avis.map(vuePublique);
}

// --- Back-office ---

const compteur = async () => ({ aModerer: await Avis.count({ where: { etat: 'en_attente' } }) });

const inclusionsPersonnel = [
  inclureDestination,
  { model: Client, as: 'client', attributes: ATTRIBUTS_CLIENT },
  inclureDemande,
];

// File de modération : avis en attente, les plus anciens d'abord.
async function fileModeration({ page, limite }) {
  const resultat = await Avis.findAndCountAll({
    where: { etat: 'en_attente' },
    include: inclusionsPersonnel,
    order: [['createdAt', 'ASC'], ['id', 'ASC']],
    distinct: true,
    ...pagination.versOptions({ page, limite }),
  });
  const reponse = pagination.formater(resultat, { page, limite });
  reponse.donnees = reponse.donnees.map(vuePersonnel);
  return reponse;
}

// Tous les avis, avis négatifs (P8 : note ≤ 2) en premier, puis les plus récents.
async function lister({ page, limite, etat, destinationId, paysId, note, du, au }) {
  const where = {};
  if (etat) where.etat = etat;
  if (destinationId) where.destinationId = destinationId;
  if (note) where.note = note;
  if (paysId) where['$destination.pays_id$'] = paysId;
  const periode = du || au
    ? { createdAt: { ...(du ? { [Op.gte]: `${du}T00:00:00` } : {}), ...(au ? { [Op.lt]: `${ajouterJours(au, 1)}T00:00:00` } : {}) } }
    : null;

  const resultat = await Avis.findAndCountAll({
    where: et(where, periode),
    include: inclusionsPersonnel,
    order: [
      [literal(`CASE WHEN "Avis"."note" <= ${Avis.NOTE_MAX_SANS_COMMENTAIRE} THEN 0 ELSE 1 END`), 'ASC'],
      ['createdAt', 'DESC'],
      ['id', 'DESC'],
    ],
    distinct: true,
    ...pagination.versOptions({ page, limite }),
  });
  const reponse = pagination.formater(resultat, { page, limite });
  reponse.donnees = reponse.donnees.map(vuePersonnel);
  return reponse;
}

module.exports = {
  AUTEUR_ANONYME,
  commandesEligibles,
  creer,
  modifier,
  supprimer,
  valider,
  refuser,
  masquer,
  repondre,
  obtenir,
  mesAvis,
  avisDeDestination,
  derniersAvisCinqEtoiles,
  compteur,
  fileModeration,
  lister,
};
