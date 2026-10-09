// Demandes de voyage (v2, récap réunion 2). Règles R1 à R15.
const { Op } = require('sequelize');
const {
  sequelize, Pays, Destination, Activite, Client, Agent, Demande, DemandeActivite, HistoriqueDemande,
} = require('../models');
const ApiError = require('../utils/ApiError');
const pagination = require('../utils/pagination');
const config = require('../config/config');
const { aujourdhui, ajouterJours } = require('../utils/dates');
const { contient, et } = require('./recherche.utils');

const MENTION_PRIX = 'Estimation, non contractuel';
const MESSAGE_CONFIRMATION =
  'Votre demande a bien été enregistrée, un conseiller vous rappellera sous 48 heures.';
const AVERTISSEMENT_DOUBLON =
  'Vous avez déjà une demande en attente pour cette destination aux mêmes dates.';

// --- Dates : on raisonne en jours calendaires belges (AAAA-MM-JJ) ---

// R1, R2, R3
function verifierDates(dateDepart, dateRetour) {
  const jour = aujourdhui();
  if (dateRetour <= dateDepart) {
    throw ApiError.requeteInvalide('La date de retour doit être postérieure à la date de départ.');
  }
  if (dateDepart <= jour) throw ApiError.requeteInvalide('La date de départ doit être dans le futur.');
  const delai = config.demandes.delaiMinJours;
  if (dateDepart < ajouterJours(jour, delai)) {
    throw ApiError.requeteInvalide(`Le départ doit avoir lieu au moins ${delai} jours après la demande.`);
  }
}

// R5
function verifierVoyageurs(nbAdultes, nbEnfants) {
  if (nbAdultes + nbEnfants > Demande.MAX_VOYAGEURS) {
    throw ApiError.requeteInvalide(`Une demande ne peut pas dépasser ${Demande.MAX_VOYAGEURS} voyageurs.`);
  }
}

// --- Catalogue : R6, R7, R8 ---

async function destinationCommandable(destinationId) {
  const destination = await Destination.findByPk(destinationId, {
    include: [{ model: Pays, as: 'pays', attributes: ['id', 'nom', 'actif'] }],
  });
  if (!destination || !destination.actif || !destination.pays.actif) {
    throw ApiError.requeteInvalide('Cette destination n\'est pas disponible à la commande.');
  }
  return destination;
}

async function activitesCommandables(activiteIds, destination) {
  if (!activiteIds.length) return [];
  const activites = await Activite.findAll({ where: { id: activiteIds }, order: [['nom', 'ASC']] });
  if (activites.length !== activiteIds.length || activites.some((a) => !a.actif)) {
    throw ApiError.requeteInvalide('Une des activités choisies n\'est pas disponible.');
  }
  if (activites.some((a) => a.paysId !== destination.paysId)) {
    throw ApiError.requeteInvalide('Les activités doivent appartenir au pays de la destination.');
  }
  return activites;
}

// --- Prix : calcul en centimes pour éviter les erreurs d'arrondi ---

const centimes = (montant) => Math.round(Number(montant) * 100);

/**
 * Prix unitaire = prix indicatif destination + Σ prix des activités (par personne, P7)
 * Prix estimé   = prix unitaire × (adultes + 0,5 × enfants)
 * P8 : sans prix indicatif pour la destination, aucune estimation n'est calculée.
 */
function calculerPrix(destination, activites, nbAdultes, nbEnfants) {
  if (destination.prixAPartirDe === null || destination.prixAPartirDe === undefined) {
    return { prixDestination: null, prixUnitaire: null, prixEstime: null };
  }
  const unitaire = centimes(destination.prixAPartirDe)
    + activites.reduce((total, a) => total + centimes(a.prixParPersonne), 0);
  // × (2 × adultes + enfants) / 2, arrondi au centime.
  const estime = Math.round((unitaire * (2 * nbAdultes + nbEnfants)) / 2);
  return {
    prixDestination: Number(destination.prixAPartirDe),
    prixUnitaire: unitaire / 100,
    prixEstime: estime / 100,
  };
}

// R14 / P3 : doublon = même client, même destination, mêmes dates, demande encore en attente.
async function aUnDoublon(clientId, { destinationId, dateDepart, dateRetour }) {
  const nb = await Demande.count({
    where: { clientId, destinationId, dateDepart, dateRetour, etat: 'en_attente' },
  });
  return nb > 0;
}

// Contrôles et calculs communs à l'estimation et à la création.
async function preparer(clientId, donnees) {
  const nbEnfants = donnees.nbEnfants ?? 0;
  verifierDates(donnees.dateDepart, donnees.dateRetour);
  verifierVoyageurs(donnees.nbAdultes, nbEnfants);
  const destination = await destinationCommandable(donnees.destinationId);
  const activites = await activitesCommandables(donnees.activiteIds || [], destination);
  const prix = calculerPrix(destination, activites, donnees.nbAdultes, nbEnfants);
  const doublon = await aUnDoublon(clientId, donnees);
  return { destination, activites, nbEnfants, prix, doublon };
}

// Le formulaire affiche le prix estimé (et l'éventuel doublon) avant la validation.
async function estimer(clientId, donnees) {
  const { destination, activites, prix, doublon } = await preparer(clientId, donnees);
  return {
    destination: { id: destination.id, nom: destination.nom, prixAPartirDe: destination.prixAPartirDe },
    activites: activites.map((a) => ({
      id: a.id, nom: a.nom, prixParPersonne: a.prixParPersonne, ageMinimum: a.ageMinimum,
    })),
    ...prix,
    mentionPrix: MENTION_PRIX,
    ...(doublon ? { avertissement: AVERTISSEMENT_DOUBLON } : {}),
  };
}

async function creer(clientId, donnees) {
  const { activites, nbEnfants, prix, doublon } = await preparer(clientId, donnees);

  const id = await sequelize.transaction(async (transaction) => {
    const demande = await Demande.create(
      {
        clientId,
        destinationId: donnees.destinationId,
        dateDepart: donnees.dateDepart,
        dateRetour: donnees.dateRetour,
        nbAdultes: donnees.nbAdultes,
        nbEnfants,
        remarques: donnees.remarques || null,
        ...prix,
      },
      { transaction }
    );
    // Prix des activités figés dans la demande (§5).
    await DemandeActivite.bulkCreate(
      activites.map((a) => ({ demandeId: demande.id, activiteId: a.id, prixParPersonne: a.prixParPersonne })),
      { transaction }
    );
    await HistoriqueDemande.create(
      { demandeId: demande.id, ancienEtat: null, nouvelEtat: 'en_attente', auteurType: 'client', auteurClientId: clientId },
      { transaction }
    );
    return demande.id;
  });

  return {
    message: MESSAGE_CONFIRMATION,
    ...(doublon ? { avertissement: AVERTISSEMENT_DOUBLON } : {}),
    demande: await obtenir(id, { type: 'client', id: clientId }),
  };
}

// --- Consultation ---

const estPersonnel = (utilisateur) => utilisateur.type === 'agent';

const inclureDestination = {
  model: Destination,
  as: 'destination',
  attributes: ['id', 'nom', 'paysId', 'actif'],
  include: [{ model: Pays, as: 'pays', attributes: ['id', 'nom'] }],
};
const ATTRIBUTS_CLIENT = ['id', 'nom', 'prenom', 'email', 'telephone'];

// Le client ne voit pas le motif d'annulation interne (P5, à trancher) ni ce qui est réservé au personnel.
function vuePourClient(demande) {
  const { motifAnnulation, clientId, client, historique, ...reste } = demande;
  return reste;
}

function presenter(demande, utilisateur) {
  const brut = demande.get({ plain: true });
  if (brut.lignesActivites) {
    // Activités avec le prix figé à la commande (R9 : conservées même si masquées depuis).
    brut.activites = brut.lignesActivites.map(({ prixParPersonne, activite }) => ({
      id: activite.id,
      nom: activite.nom,
      categorie: activite.categorie,
      ageMinimum: activite.ageMinimum, // R10 : affiché, pas vérifié
      actif: activite.actif,
      prixParPersonne,
    }));
    delete brut.lignesActivites;
  }
  if (brut.historique) {
    brut.historique = brut.historique.map(({ auteurClient, auteurAgent, ...ligne }) => ({
      ...ligne,
      auteur: auteurAgent
        ? { type: 'agent', id: auteurAgent.id, nom: auteurAgent.nom, prenom: auteurAgent.prenom }
        : { type: ligne.auteurType, ...(auteurClient ? { id: auteurClient.id, nom: auteurClient.nom, prenom: auteurClient.prenom } : {}) },
    }));
  }
  brut.mentionPrix = MENTION_PRIX;
  // V3 (§10) : voyage terminé = commande confirmée dont la date de retour est dépassée.
  brut.voyageTermine = brut.etat === 'confirmee' && brut.dateRetour < aujourdhui();
  return estPersonnel(utilisateur) ? brut : vuePourClient(brut);
}

// R15 : un client ne voit que ses propres demandes ; le personnel les voit toutes.
async function lister(utilisateur, filtres) {
  const { page, limite, etat } = filtres;
  let where = { ...(etat ? { etat } : {}) };
  const include = [inclureDestination];

  if (estPersonnel(utilisateur)) {
    const { paysId, destinationId, clientId, departDu, departAu, q } = filtres;
    if (destinationId) where.destinationId = destinationId;
    if (clientId) where.clientId = clientId;
    if (departDu || departAu) {
      where.dateDepart = { ...(departDu ? { [Op.gte]: departDu } : {}), ...(departAu ? { [Op.lte]: departAu } : {}) };
    }
    // Colonne SQL de la destination jointe (nom de champ, pas d'attribut, dans la syntaxe $…$).
    if (paysId) where['$destination.pays_id$'] = paysId;
    include.push({ model: Client, as: 'client', attributes: ATTRIBUTS_CLIENT, required: Boolean(q) });
    where = et(where, contient(['client.nom', 'client.prenom', 'client.email'], q));
  } else {
    where.clientId = utilisateur.id;
  }

  const resultat = await Demande.findAndCountAll({
    where,
    include,
    // §7 : tri par date de commande décroissante.
    order: [['dateCommande', 'DESC'], ['id', 'DESC']],
    distinct: true,
    ...pagination.versOptions({ page, limite }),
  });
  const reponse = pagination.formater(resultat, { page, limite });
  reponse.donnees = reponse.donnees.map((d) => presenter(d, utilisateur));
  return reponse;
}

async function trouver(id, utilisateur, options = {}) {
  const demande = await Demande.findByPk(id, options);
  // R15 : la demande d'un autre client est traitée comme inexistante.
  if (!demande || (!estPersonnel(utilisateur) && demande.clientId !== utilisateur.id)) {
    throw ApiError.introuvable('Demande introuvable.');
  }
  return demande;
}

async function obtenir(id, utilisateur) {
  const demande = await trouver(id, utilisateur, {
    include: [
      inclureDestination,
      // Détail personnel : nom, téléphone et e-mail du client (§7) ; null si le compte a été supprimé.
      { model: Client, as: 'client', attributes: ATTRIBUTS_CLIENT },
      {
        model: DemandeActivite,
        as: 'lignesActivites',
        include: [{ model: Activite, as: 'activite', attributes: ['id', 'nom', 'categorie', 'ageMinimum', 'actif'] }],
      },
      {
        model: HistoriqueDemande,
        as: 'historique',
        include: [
          { model: Client, as: 'auteurClient', attributes: ['id', 'nom', 'prenom'] },
          { model: Agent, as: 'auteurAgent', attributes: ['id', 'nom', 'prenom'] },
        ],
      },
    ],
    order: [[{ model: HistoriqueDemande, as: 'historique' }, 'createdAt', 'ASC'], [{ model: HistoriqueDemande, as: 'historique' }, 'id', 'ASC']],
  });
  return presenter(demande, utilisateur);
}

// --- Cycle de vie (§6) : chaque changement d'état est historisé ---

async function changerEtat(id, utilisateur, nouvelEtat, motif) {
  await sequelize.transaction(async (transaction) => {
    // Verrou : deux agents ne peuvent pas traiter la même demande en même temps.
    const demande = await trouver(id, utilisateur, { transaction, lock: transaction.LOCK.UPDATE });
    const ancienEtat = demande.etat;

    if (ancienEtat === 'annulee') throw ApiError.conflit('Cette demande est déjà annulée.');
    if (nouvelEtat === 'confirmee' && ancienEtat !== 'en_attente') {
      throw ApiError.conflit('Seule une demande en attente peut être confirmée.');
    }
    // R11 : le client n'annule que si la demande est en attente (sinon, il téléphone à l'agence).
    if (nouvelEtat === 'annulee' && !estPersonnel(utilisateur) && ancienEtat !== 'en_attente') {
      throw ApiError.conflit('Cette demande est confirmée : contactez l\'agence pour l\'annuler.');
    }

    await demande.update(
      { etat: nouvelEtat, ...(nouvelEtat === 'annulee' ? { motifAnnulation: motif || null } : {}) },
      { transaction }
    );
    await HistoriqueDemande.create(
      {
        demandeId: demande.id,
        ancienEtat,
        nouvelEtat,
        auteurType: estPersonnel(utilisateur) ? 'agent' : 'client',
        ...(estPersonnel(utilisateur) ? { auteurAgentId: utilisateur.id } : { auteurClientId: utilisateur.id }),
      },
      { transaction }
    );
  });
  return obtenir(id, utilisateur);
}

// Personnel uniquement (contrôlé par la route).
const confirmer = (id, utilisateur) => changerEtat(id, utilisateur, 'confirmee');

// P2 : ouverte à tout le personnel (décision provisoire). R13 : motif obligatoire pour le personnel.
async function annuler(id, utilisateur, motif) {
  const texte = typeof motif === 'string' ? motif.trim() : '';
  if (estPersonnel(utilisateur) && !texte) {
    throw ApiError.requeteInvalide('Le motif d\'annulation est obligatoire.');
  }
  return changerEtat(id, utilisateur, 'annulee', texte);
}

module.exports = {
  MENTION_PRIX,
  MESSAGE_CONFIRMATION,
  AVERTISSEMENT_DOUBLON,
  calculerPrix,
  estimer,
  creer,
  lister,
  obtenir,
  confirmer,
  annuler,
};
