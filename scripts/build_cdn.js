const { root, output } = require('../config/config');
const { resolve } = require('path');
const copyDirectory = require('./util/copyDirectory');
const { blackList, whiteList } = require('./util/filters/fileName');

const NODE_MODULES = resolve(root, "node_modules");
const CDN_ROOT = resolve(NODE_MODULES, 'cdn');

const WHITE_FOLDER_LIST = [
    'LoaderIndicator',
    'EmojiFont',
    'TensorFont',
    'Maintenance',
    'CbucIcons'
].map(str => resolve(CDN_ROOT, str));
const BLACK_EXTENSION_LIST = ['.s3mod', '.md', '.json', '-IE'];


let filterBlackListExtension = blackList.endsWith(BLACK_EXTENSION_LIST);

let filterWhiteListName = whiteList.startsWith(WHITE_FOLDER_LIST);
let filterWhiteFolderListName = (path, isDir) => {
    if (isDir) {
        return filterWhiteListName(path);
    }
    return true;
};

copyDirectory(
    CDN_ROOT,
    output.cdn,
    [filterBlackListExtension, filterWhiteFolderListName]
);
