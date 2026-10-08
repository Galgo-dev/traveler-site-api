// Briques de validation partagées entre ressources.
const Joi = require('joi');

const messages = {
  'any.required': '{{#label}} est obligatoire.',
  'any.only': '{{#label}} doit valoir : {{#valids}}.',
  'any.invalid': '{{#label}} contient une valeur non autorisée.',
  'string.empty': '{{#label}} ne peut pas être vide.',
  'string.min': '{{#label}} doit contenir au moins {{#limit}} caractères.',
  'string.max': '{{#label}} doit contenir au plus {{#limit}} caractères.',
  'string.email': '{{#label}} doit être une adresse e-mail valide.',
  'string.uri': '{{#label}} doit être une URL valide.',
  'string.pattern.name': '{{#label}} {{#name}}.',
  'number.base': '{{#label}} doit être un nombre.',
  'number.integer': '{{#label}} doit être un entier.',
  'number.min': '{{#label}} doit être supérieur ou égal à {{#limit}}.',
  'number.max': '{{#label}} doit être inférieur ou égal à {{#limit}}.',
  'number.positive': '{{#label}} doit être strictement positif.',
  'boolean.base': '{{#label}} doit être vrai ou faux.',
  'date.base': '{{#label}} doit être une date valide (AAAA-MM-JJ).',
  'date.max': '{{#label}} ne peut pas être dans le futur.',
  'date.min': '{{#label}} est trop ancienne.',
  'object.unknown': '{{#label}} n\'est pas un champ autorisé.',
  'object.min': 'Au moins un champ doit être fourni.',
};

const id = Joi.number().integer().positive();
const paramsId = Joi.object({ id: id.required() });

const pagination = {
  page: Joi.number().integer().min(1).default(1),
  limite: Joi.number().integer().min(1).max(100).default(20),
};

const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(255);
const nomPersonne = Joi.string().trim().min(1).max(100);
const telephone = Joi.string()
  .trim()
  .max(30)
  .pattern(/^\+?[0-9 ./()-]{6,30}$/, { name: 'doit être un numéro de téléphone valide' })
  .allow(null, '');
const dateNaissance = Joi.date().iso().max('now').min('1900-01-01').allow(null);

const statut = Joi.object({ actif: Joi.boolean().required() });

module.exports = { Joi, messages, id, paramsId, pagination, email, nomPersonne, telephone, dateNaissance, statut };
