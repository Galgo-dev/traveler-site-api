// Diffusion d'événements en direct aux navigateurs ouverts (Server-Sent Events).
// Les pages du site s'abonnent et rechargent leurs données dès qu'un événement arrive :
// un client voit tout de suite une modification du catalogue faite par un agent.

// Un commentaire envoyé régulièrement empêche les proxys de couper une connexion silencieuse.
const INTERVALLE_MAINTIEN_MS = 25000;
// Délai suggéré au navigateur avant de se reconnecter après une coupure.
const DELAI_RECONNEXION_MS = 3000;

const abonnes = new Set();

/**
 * Ouvre un flux d'événements pour ce navigateur, jusqu'à ce qu'il se déconnecte.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function abonner(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Désactive la mise en tampon d'un éventuel proxy (nginx) : les événements partent immédiatement.
    'X-Accel-Buffering': 'no',
  });
  res.write(`retry: ${DELAI_RECONNEXION_MS}\n\n`);
  abonnes.add(res);

  const maintien = setInterval(() => res.write(': maintien\n\n'), INTERVALLE_MAINTIEN_MS);
  maintien.unref();

  req.on('close', () => {
    clearInterval(maintien);
    abonnes.delete(res);
  });
}

/**
 * Envoie un événement à tous les navigateurs abonnés.
 * @param {string} type nom de l'événement (ex. « catalogue »)
 * @param {object} donnees contenu, transmis en JSON
 */
function diffuser(type, donnees) {
  const message = `event: ${type}\ndata: ${JSON.stringify(donnees)}\n\n`;
  abonnes.forEach((res) => res.write(message));
}

function nombreAbonnes() {
  return abonnes.size;
}

module.exports = { abonner, diffuser, nombreAbonnes };
