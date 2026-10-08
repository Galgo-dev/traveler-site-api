// Envoi d'e-mails via SMTP (nodemailer).
// - en test : aucun envoi ;
// - sans SMTP_HOST : le message est affiché dans la console du serveur ;
// - sinon : envoi réel (en développement, Mailpit capture les mails → http://localhost:8025).
const nodemailer = require('nodemailer');
const config = require('../config/config');

let transporteur;

function obtenirTransporteur() {
  if (!transporteur) {
    const { host, port, secure, user, password } = config.mail;
    transporteur = nodemailer.createTransport({
      host,
      port,
      secure,
      ...(user ? { auth: { user, pass: password } } : {}),
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
