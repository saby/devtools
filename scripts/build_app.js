const { resolve } = require('path');
const runBuilder = require('./util/runBuilder');
const execCommand = require('./util/execCommand');

const SABY_TYPESCRIPT = "saby-typescript --install --tsconfig=tsconfig.base.json";

async function build () {
    await execCommand(SABY_TYPESCRIPT);
    await runBuilder(resolve(__dirname, "../config/buildTemplate"));
}

build();
