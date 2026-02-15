module.exports = {
    env: {
        es6: true,
        node: true,
    },
    parserOptions: {
        "ecmaVersion": 2018,
    },
    extends: [
        "eslint:recommended",
        "google",
    ],
    rules: {
        "no-restricted-globals": ["error", "name", "length"],
        "prefer-arrow-callback": "error",
        "quotes": ["error", "double", { "allowTemplateLiterals": true }],
        "object-curly-spacing": ["off"],
        "max-len": ["off"], // Disable line length check for easier development
        "indent": ["off"], // Disable strict indent check
        "comma-dangle": ["off"],
        "require-jsdoc": ["off"], // Disable JSDoc requirements for valid-jsdoc
        "no-unused-vars": ["warn"],
    },
    overrides: [
        {
            files: ["**/*.spec.*"],
            env: {
                mocha: true,
            },
            rules: {},
        },
    ],
    globals: {},
};
