const { resolve } = require('path');
const { writeFile } = require('fs').promises;

const CONFIG_PATH = '../config';
const FILE_NAME = 'buildTemplate';

const BUILD_TEMPLATE = resolve(__dirname, CONFIG_PATH, FILE_NAME);

const buildTemplate = require(BUILD_TEMPLATE);

writeFile(`${ BUILD_TEMPLATE }.json`, JSON.stringify(buildTemplate, undefined, 2));
