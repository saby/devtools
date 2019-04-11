const { exec } = require('child_process');
const { resolve } = require('path');

const NODE_MODULES = resolve(__dirname, "../node_modules");

const SABY_TYPESCRIPT = "saby-typescript --install --tsconfig=tsconfig.base.json";
const CREATE_BUILD_TEMPLATE = "node ./scripts/buildTemplate.js";

const RUN_BUILDER = [
    "node",
    resolve(NODE_MODULES, "gulp/bin/gulp.js"),
    `--gulpfile=${ resolve(NODE_MODULES, "sbis3-builder/gulpfile.js") }`,
    "build",
    `--config=${ resolve(__dirname, "../config/buildTemplate.json") }`,
    "-LLLL"
].join(' ');

const COMMANDS = [
    SABY_TYPESCRIPT,
    CREATE_BUILD_TEMPLATE,
    RUN_BUILDER
];

/**
 *
 * @param {string} command
 * @return {Promise<Promise<any> | Promise>}
 */
let execCommand = async (command) => {
    return new Promise((resolve, reject) => {
        console.log('exec command: ', command);
        exec(command, (err, stdout, stderr) => {
            if (err) {
                return reject(err);
            }
            resolve({ stdout, stderr });
        });
    });
};

async function runBuilder () {
    console.log('run build');
    for (let command of COMMANDS) {
        try {
            await execCommand(command);
        } catch (error) {
            console.log('build error: ', error)
        }
    }
    console.log('complete build');
}

runBuilder();
