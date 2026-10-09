// Dates calendaires belges (AAAA-MM-JJ), pour les règles métier exprimées en jours.
const FUSEAU = 'Europe/Brussels';

const jourDe = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: FUSEAU }).format(date);

const aujourdhui = () => jourDe(new Date());

function ajouterJours(jour, n) {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// « mai 2026 » à partir d'une date AAAA-MM-JJ.
const moisAnnee = (jour) =>
  new Intl.DateTimeFormat('fr-BE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${jour}T00:00:00Z`)
  );

module.exports = { FUSEAU, jourDe, aujourdhui, ajouterJours, moisAnnee };
