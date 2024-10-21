const rollupTypescript = require('rollup-plugin-typescript');
const { terser } = require('rollup-plugin-terser');
const tsconfig = require('./tsconfig.json');
const { input, minimize } = require('./config');

const plugins = [
    rollupTypescript(tsconfig.compilerOptions),
];

if (minimize) {
    plugins.push(terser());
}

module.exports = {
    input: input.injectScript,
    plugins
};
