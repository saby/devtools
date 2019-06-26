const rollupTypescript = require('rollup-plugin-typescript');
const { terser } = require('rollup-plugin-terser');
const tsconfig = require('./tsconfig.json');
const { input } = require('./config');

module.exports = {
    input: input.content,
    plugins: [
        rollupTypescript(tsconfig.compilerOptions),
        terser()
    ]
};
