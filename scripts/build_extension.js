var fs = require('fs');

const execCommand = require('./execCommand');

const BUILD_DIRECTORY = 'build';
const SOURCE_DIRECTORY = 'src\\extension';

const { resolve } = require('path');
const { readdir, stat, unlink, copyFile } = require('fs').promises;

let buildTS = () => {
    return execCommand('tsc -p ./config/tsconfig.extension.json');
};
// let copy = (origin, copyTo) => {
//     return fs.createReadStream(origin).pipe(
//         fs.createWriteStream(copyTo));
// };
let copy = (origin, copyTo) => {
    return copyFile(origin, copyTo);
};
let cleanDirectory = async (directory) => {
    try {
        let files = await readdir(directory);
        const unlinkPromises = files.map(
            filename => unlink(`${directory}/${filename}`)
        );
        return Promise.all(unlinkPromises);
    } catch (e) {
        console.log('=>', e)
    }
};
let copyStaticFile = async (sourcePath, buildPath, extensions = ['.ts']) => {
    if (extensions.some(
        (extension) => sourcePath.endsWith(extension)
    )) {
        return;
    }
    return await copy(sourcePath, buildPath);
};

let copyStaticFiles = async (sourceDir) => {
    const subdirs = await readdir(sourceDir);
    return await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(sourceDir, subdir);
        const buildPath = res.replace(SOURCE_DIRECTORY, BUILD_DIRECTORY);
        let isDir = (await stat(res)).isDirectory();
        if (isDir) {
            if (!fs.existsSync(buildPath)){
                fs.mkdirSync(buildPath);
            }
            return await copyStaticFiles(res);
        }
        return await copyStaticFile(res, buildPath);
    }));
};

let build_extension = async () => {
    try {
        // await cleanDirectory(BUILD_DIRECTORY);
        await buildTS();
        await copyStaticFiles(SOURCE_DIRECTORY, BUILD_DIRECTORY);
    } catch (error) {
        console.log('=>', error);
    }
};
build_extension();
