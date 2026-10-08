// Convertit page / limite en options Sequelize et formate la réponse paginée.
const versOptions = ({ page = 1, limite = 20 } = {}) => ({ limit: limite, offset: (page - 1) * limite });

const formater = ({ rows, count }, { page = 1, limite = 20 } = {}) => ({
  donnees: rows,
  pagination: { page, limite, total: count, pages: Math.ceil(count / limite) },
});

module.exports = { versOptions, formater };
