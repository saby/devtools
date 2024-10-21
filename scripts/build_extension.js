const { input, output } = require('../config/config');
const { resolve } = require('path');

const execCommand = require('./util/execCommand');

const copyDirectory = require('./util/copyDirectory');
const { blackList } = require('./util/filters/fileName');
const addMinPrefix = require('./util/addMinPrefix');

const BLACK_EXTENSION_LIST = ['.ts'];


let filterBlackListExtension = blackList.endsWith(BLACK_EXTENSION_LIST);
let filterBlackListFolder = blackList.startsWith([
    resolve(input.extension, 'Extension'),
    input.content,
]);

let buildTS = () => {
    return execCommand('tsc -p ./config/tsconfig.extension.json');
};

let build_extension = async () => {
    try {
        await copyDirectory(input.extension, output.root, [
            filterBlackListExtension,
            filterBlackListFolder
        ]);
        await buildTS();
        if (process.env.NODE_ENV === 'production') {
            await addMinPrefix();
        }
    } catch (error) {
        console.log('=>', error);
    }
};

build_extension();
