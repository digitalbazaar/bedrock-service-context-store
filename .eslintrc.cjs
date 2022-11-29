module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'digitalbazaar',
    'digitalbazaar/jsdoc',
    'digitalbazaar/module',
    'digitalbazaar/import'
  ],
  ignorePatterns: ['node_modules/'],
  rules: {
    'unicorn/prefer-node-protocol': 'error'
  }
};
