const rollupTypescript = require('rollup-plugin-typescript');
const tsconfig = require('./tsconfig.json');
const { input } = require('./config');

module.exports = {
    input: input.content,
    plugins: [
        rollupTypescript(tsconfig.compilerOptions)
    ]
};
