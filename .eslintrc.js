module.exports = {
    env: {
        node: true,
        es6: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 8,
        sourceType: 'module',
    },
    rules: {
        'linebreak-style': ['error', 'unix'],
        semi: ['error', 'never'],
        'no-unused-vars': ['warn'],
        'no-useless-escape': ['off'],
        'no-console': ['off'],
    },
}
