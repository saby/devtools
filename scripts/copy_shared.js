const { input, output } = require('../config/config');
const { resolve } = require('path');

const { readdir, symlink } = require('fs').promises;


let copyShared = async () => {
    const files = await readdir(input.sharedDir);
    for (let file of files) {
        let path = resolve(input.sharedDir, file);
        for (let dir of output.sharedDirs) {
            await symlink(
                path,
                resolve(dir, file),
                'dir'
            )
        }
    }
};

copyShared();
