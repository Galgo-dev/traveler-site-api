// Envoi d'e-mails via SMTP (nodemailer).
// - en test : aucun envoi ;
// - sans SMTP_HOST : le message est affiché dans la console du serveur ;
// - sinon : envoi réel (en développement, Mailpit capture les mails → http://localhost:8025).
const nodemailer = require('nodemailer');
const config = require('../config/config');

// Délais courts : par défaut nodemailer attend jusqu'à 2 min (connexion) ou 10 min (inactivité).
// Un serveur SMTP bloqué ferait alors attendre la requête au-delà du délai du front (10 s) ;
// avec ces délais, l'envoi échoue vite et l'erreur est journalisée par le service appelant.
const DELAIS_SMTP_MS = {
  connectionTimeout: 4000,
  greetingTimeout: 4000,
  socketTimeout: 4000,
};

let transporteur;

function obtenirTransporteur() {
  if (!transporteur) {
    const { host, port, secure, user, password } = config.mail;
    transporteur = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user ? { auth: { user, pass: password } } : {}),
      ...DELAIS_SMTP_MS,
    });
  }
  return transporteur;
}

async function envoyer({ a, sujet, texte, html }) {
  if (config.env === 'test') return;

  if (!config.mail.host) {
    console.log(`\n[mail] À : ${a}\n[mail] Sujet : ${sujet}\n${texte}\n`);
    return;
  }

  await obtenirTransporteur().sendMail({
    from: config.mail.expediteur,
    to: a,
    subject: sujet,
    text: texte,
    ...(html ? { html } : {}),
  });
}

module.exports = { envoyer };
