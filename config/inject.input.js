const rollupTypescript = require('rollup-plugin-typescript');
const tsconfig = require('./tsconfig.json');
const { input } = require('./config');

module.exports = {
    input: input.injectScript,
    plugins: [
        rollupTypescript(tsconfig.compilerOptions)
    ]
};
