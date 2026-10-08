// Le mailer est testé avec une configuration simulée et un transport nodemailer factice.
const configDeBase = {
  env: 'development',
  mail: {
    host: 'smtp.exemple.be',
    port: 587,
    secure: false,
    user: 'no-reply@exemple.be',
    password: 'secret',
    expediteur: 'Agence <no-reply@exemple.be>',
  },
};

function chargerMailer(config) {
  jest.resetModules();
  const sendMail = jest.fn().mockResolvedValue({});
  const createTransport = jest.fn(() => ({ sendMail }));
  jest.doMock('nodemailer', () => ({ createTransport }));
  jest.doMock('../../config/config', () => config);
  const mailer = require('../../utils/mailer');
  return { mailer, sendMail, createTransport };
}

const message = { a: 'client@mail.be', sujet: 'Sujet', texte: 'Texte', html: '<p>Texte</p>' };

describe('mailer.envoyer', () => {
  afterEach(() => jest.restoreAllMocks());

  it('envoie le message via SMTP avec l\'expéditeur configuré', async () => {
    const { mailer, sendMail, createTransport } = chargerMailer(configDeBase);
    await mailer.envoyer(message);

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.exemple.be',
      port: 587,
      secure: false,
      auth: { user: 'no-reply@exemple.be', pass: 'secret' },
    });
    expect(sendMail).toHaveBeenCalledWith({
      from: 'Agence <no-reply@exemple.be>',
      to: 'client@mail.be',
      subject: 'Sujet',
      text: 'Texte',
      html: '<p>Texte</p>',
    });
  });

  it('réutilise le même transport et omet l\'authentification sans utilisateur', async () => {
    const { mailer, createTransport } = chargerMailer({
      ...configDeBase,
      mail: { ...configDeBase.mail, user: undefined, password: undefined },
    });
    await mailer.envoyer(message);
    await mailer.envoyer(message);

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(createTransport.mock.calls[0][0]).not.toHaveProperty('auth');
  });

  it('affiche le message dans la console sans SMTP_HOST', async () => {
    const { mailer, sendMail } = chargerMailer({ ...configDeBase, mail: { ...configDeBase.mail, host: undefined } });
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    await mailer.envoyer(message);

    expect(sendMail).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.stringContaining('client@mail.be'));
  });

  it('n\'envoie rien en environnement de test', async () => {
    const { mailer, sendMail } = chargerMailer({ ...configDeBase, env: 'test' });
    await mailer.envoyer(message);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
