// Outils partagés par les services du catalogue : recherche texte et visibilité publique.
const { Op, fn, col, where } = require('sequelize');

// Échappe les caractères spéciaux de LIKE pour qu'un "%" saisi soit cherché littéralement.
const echapperLike = (texte) => texte.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * Condition « contient le mot-clé » sur plusieurs colonnes, insensible à la casse et aux accents.
 * @param {string[]} colonnes  ex. ['Destination.nom', 'Destination.description']
 */
function contient(colonnes, q) {
  if (!q) return null;
  const motif = `%${echapperLike(q.trim())}%`;
  return {
    [Op.or]: colonnes.map((c) => where(fn('unaccent', col(c)), { [Op.iLike]: fn('unaccent', motif) })),
  };
}

// Combine des conditions en ignorant les valeurs nulles.
const et = (...conditions) => {
  const liste = conditions.filter(Boolean);
  return liste.length ? { [Op.and]: liste } : {};
};

module.exports = { contient, et };
