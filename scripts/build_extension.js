const { input, output } = require('../config/config');

const execCommand = require('./util/execCommand');

const copyDirectory = require('./util/copyDirectory');
const { blackList } = require('./util/filters/fileName');

const BLACK_EXTENSION_LIST = ['.ts'];


let filterBlackListExtension = blackList.endsWith(BLACK_EXTENSION_LIST);

let buildTS = () => {
    return execCommand('tsc -p ./config/tsconfig.extension.json');
};

let build_extension = async () => {
    try {
        await copyDirectory(input.extension, output.root, [filterBlackListExtension]);
        await buildTS();
    } catch (error) {
        console.log('=>', error);
    }
};

build_extension();
