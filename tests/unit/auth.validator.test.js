const { motDePasse } = require('../../validators/auth.validator');

const valider = (mdp) => motDePasse.validate(mdp).error;

describe('Règle de complexité du mot de passe', () => {
  it.each(['Voyage-Test-2026', 'Bruxelles2026', 'AvionDePapier7'])('accepte %s', (mdp) => {
    expect(valider(mdp)).toBeUndefined();
  });

  it.each([
    ['moins de 10 caractères', 'Court123'],
    ['sans majuscule', 'voyage-2026-test'],
    ['sans minuscule', 'VOYAGE-2026-TEST'],
    ['sans chiffre', 'Voyage-Test-Belge'],
    ['trop courant', 'Motdepasse1'],
    ['plus de 72 caractères', `Aa1${'x'.repeat(80)}`],
  ])('refuse un mot de passe %s', (_, mdp) => {
    expect(valider(mdp)).toBeDefined();
  });
});
