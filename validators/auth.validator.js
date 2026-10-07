const { Joi, email, nomPersonne, telephone, dateNaissance } = require('./commun.validator');

// Point à confirmer n°6 tranché : au moins 10 caractères, une majuscule, une minuscule et un chiffre,
// et refus des mots de passe les plus courants.
const MOTS_DE_PASSE_COURANTS = new Set(
  [
    '123456789a', 'azertyuiop', 'motdepasse', 'password12', 'password123', 'motdepasse1', 'azerty1234',
    'qwerty1234', 'bonjour123', 'soleil1234', 'belgique123', 'bruxelles1', 'voyage1234', 'iloveyou12',
    'administrateur1', 'admin12345', 'welcome123', 'changeme123',
  ].map((m) => m.toLowerCase())
);

const motDePasse = Joi.string()
  .min(10)
  .max(72) // limite de bcrypt
  .pattern(/[A-Z]/, { name: 'doit contenir au moins une majuscule' })
  .pattern(/[a-z]/, { name: 'doit contenir au moins une minuscule' })
  .pattern(/[0-9]/, { name: 'doit contenir au moins un chiffre' })
  .custom((valeur, helpers) =>
    MOTS_DE_PASSE_COURANTS.has(valeur.toLowerCase())
      ? helpers.message('{{#label}} est trop courant, choisissez-en un autre.')
      : valeur
  )
  .label('motDePasse');

const inscription = Joi.object({
  nom: nomPersonne.required(),
  prenom: nomPersonne.required(),
  email: email.required(),
  telephone: telephone.required(),
  dateNaissance: dateNaissance.required(),
  motDePasse: motDePasse.required(),
});

const connexion = Joi.object({
  email: email.required(),
  motDePasse: Joi.string().max(200).required(),
});

const motDePasseOublie = Joi.object({ email: email.required() });

const reinitialisation = Joi.object({
  token: Joi.string().hex().length(64).required(),
  motDePasse: motDePasse.required(),
});

const changementMotDePasse = Joi.object({
  motDePasseActuel: Joi.string().max(200).required(),
  nouveauMotDePasse: motDePasse.required().label('nouveauMotDePasse'),
});

module.exports = { motDePasse, inscription, connexion, motDePasseOublie, reinitialisation, changementMotDePasse };
