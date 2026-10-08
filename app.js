// Création de l'application Express : middlewares globaux, routes /api, gestion des erreurs.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('morgan');
const config = require('./config/config');
const routes = require('./routes');
const { routeIntrouvable, gestionnaireErreurs } = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.cors.origines }));
if (config.env !== 'test') app.use(logger('dev'));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', routes);

app.use(routeIntrouvable);
app.use(gestionnaireErreurs);

module.exports = app;
