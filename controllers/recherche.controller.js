const asyncHandler = require('../utils/asyncHandler');
const rechercheService = require('../services/recherche.service');

exports.rechercher = asyncHandler(async (req, res) => {
  res.json(await rechercheService.rechercher(req.query));
});
