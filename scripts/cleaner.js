const { readdir, unlink, rmdir, lstat } = require('fs').promises;
const { resolve, join } = require('path');
const config = require('../config/config');

async function deleteFile(dir, file) {
   const filePath = join(dir, file);
   const stats = await lstat(filePath);
   return stats.isDirectory() ? deleteDirectory(filePath) : unlink(filePath);
}

async function deleteDirectory(dir) {
   const files = await readdir(dir);
   await Promise.all(files.map(function (file) {
      return deleteFile(dir, file);
   }));
   return rmdir(dir);
}

async function cleanupWSCore() {
   const rootDir = resolve(config.output.resource, 'WS.Core');
   const folders = ['img', 'lib', 'res', 'transport'];
   return Promise.all(folders.map((name) => {
      return deleteDirectory(resolve(rootDir, name));
   }));
}

cleanupWSCore();
