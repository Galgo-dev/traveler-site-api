// Deux projets : les tests unitaires n'ont pas besoin de base de données,
// les tests d'intégration préparent la base de test (globalSetup).
module.exports = {
  testTimeout: 20000,
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      globalSetup: '<rootDir>/tests/setup/globalSetup.js',
    },
  ],
};
