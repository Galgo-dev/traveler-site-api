// Envoi d'e-mails. V1 : pas de serveur SMTP, le message est affiché dans la console du serveur.
// Pour brancher un vrai envoi plus tard (ex. nodemailer), seule la fonction envoyer() est à remplacer.
const config = require('../config/config');

async function envoyer({ a, sujet, texte }) {
  if (config.env === 'test') return;
  console.log(`\n[mail] À : ${a}\n[mail] Sujet : ${sujet}\n${texte}\n`);
}

module.exports = { envoyer };
