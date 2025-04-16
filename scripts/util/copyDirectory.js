const { readdir, stat, copyFile } = require('fs').promises;
const { resolve } = require('path');
var fs = require('fs');

let createDir = (path) => {
    if (!fs.existsSync(path)){
        fs.mkdirSync(path);
    }
};

/**
 * @param {Array.<*>} args
 * @param {Array.<function(*): boolean>} filters
 * @return {boolean}
 */
let filter = (args, filters = []) => {
    return !filters.some((f) => !f(...args));
};

/**
 *
 * @param {String} input
 * @param {String} output
 * @param {Array.<function(path: string, isDir: boolean): boolean>} [filters]
 * @return {Promise}
 */
let copyDirectory = async (input, output, filters = []) => {
    createDir(output);
    const subdirs = await readdir(input);
    return await Promise.all(subdirs.map(async (subdir) => {
        const _input = resolve(input, subdir);
        const _output = resolve(output, subdir);
        let isDir = (await stat(_input)).isDirectory();
        if (!filter([_input, isDir], filters)) {
            return;
        }
        if (isDir) {
            return await copyDirectory(_input, _output, filters);
        }
        return await copyFile(_input, _output);
    }));
};

module.exports = copyDirectory;
