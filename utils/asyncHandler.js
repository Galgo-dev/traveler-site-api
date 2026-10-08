// Enveloppe un contrôleur async : toute promesse rejetée est transmise à next(err) (Express 4).
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
