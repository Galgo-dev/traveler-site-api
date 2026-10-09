// Outils partagés : note moyenne et nombre d'avis publiés (destinations), moyenne des notes (activités).
const { fn, col } = require('sequelize');
const { Avis, NoteActivite } = require('../models');

const SANS_AVIS = "Pas encore d'avis";

// P9 : une décimale, virgule (« 4,6 »).
const arrondir = (moyenne) => Math.round(Number(moyenne) * 10) / 10;
const afficher = (note) => note.toLocaleString('fr-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// R16 : jamais « 0 étoile » pour une destination sans avis publié.
function resume(moyenne, nombre) {
  if (!nombre) return { noteMoyenne: null, noteMoyenneAffichee: null, nombreAvis: 0, libelle: SANS_AVIS };
  const note = arrondir(moyenne);
  const affichee = afficher(note);
  return {
    noteMoyenne: note,
    noteMoyenneAffichee: affichee,
    nombreAvis: nombre,
    libelle: `★ ${affichee} (${nombre} avis)`,
  };
}

const parId = (lignes, cle) =>
  new Map(lignes.map((l) => [Number(l[cle]), { moyenne: l.moyenne, nombre: Number(l.nombre) }]));

// R15 : seuls les avis publiés comptent. Une seule requête pour toutes les destinations demandées.
async function resumeNotes(destinationIds) {
  const ids = [...new Set(destinationIds)].filter(Boolean);
  const lignes = ids.length
    ? await Avis.findAll({
      attributes: ['destinationId', [fn('AVG', col('note')), 'moyenne'], [fn('COUNT', col('id')), 'nombre']],
      where: { destinationId: ids, etat: 'publie' },
      group: ['destinationId'],
      raw: true,
    })
    : [];
  const stats = parId(lignes, 'destinationId');
  return new Map(ids.map((id) => {
    const s = stats.get(id);
    return [id, resume(s && s.moyenne, s ? s.nombre : 0)];
  }));
}

// P11 : moyenne par activité ; seules les notes d'avis publiés sont comptées (cohérent avec R15).
async function moyennesActivites(activiteIds) {
  const ids = [...new Set(activiteIds)].filter(Boolean);
  const lignes = ids.length
    ? await NoteActivite.findAll({
      attributes: [
        'activiteId',
        [fn('AVG', col('NoteActivite.note')), 'moyenne'],
        [fn('COUNT', col('NoteActivite.id')), 'nombre'],
      ],
      include: [{ model: Avis, as: 'avis', attributes: [], where: { etat: 'publie' } }],
      where: { activiteId: ids },
      group: ['activiteId'],
      raw: true,
    })
    : [];
  const stats = parId(lignes, 'activiteId');
  return new Map(ids.map((id) => {
    const s = stats.get(id);
    return [id, resume(s && s.moyenne, s ? s.nombre : 0)];
  }));
}

// Ajoute le champ « avis » à des destinations ou activités (instances Sequelize ou objets).
async function ajouterResume(elements, calcul) {
  const liste = elements.map((e) => (e && typeof e.get === 'function' ? e.get({ plain: true }) : e));
  const resumes = await calcul(liste.map((e) => e.id));
  return liste.map((e) => ({ ...e, avis: resumes.get(e.id) }));
}

module.exports = { SANS_AVIS, resume, resumeNotes, moyennesActivites, ajouterResume };
