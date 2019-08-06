// TODO: почистим контролы сами, потому что пока билдер собирает много лишнего
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

const BLACK_LIST = ['_LoadingIndicator', '_dragnDrop'];

async function cleanupControls() {
   const controlsDir = resolve(config.output.resource, 'Controls');
   const files = await readdir(controlsDir);
   return Promise.all(files.map((name) => {
      const isPrivateDir = name.startsWith('_') || name === 'interface';
      /**
       * TODO: Пытаемся таким образом определять библиотеки. Если папка библиотечная, то
       * её гарантированно можно сносить.
       */
      if (isPrivateDir && BLACK_LIST.indexOf(name) === -1 && files.indexOf(`${name.slice(1)}.min.css`) !== -1) {
         return deleteDirectory(resolve(controlsDir, name));
      }
      // TODO: css чистить не получилось, потому что css без постфикса все равно грузится
      // if (name.endsWith('min.css') && name.indexOf('_default') === -1) {
      //    return unlink(resolve(controlsDir, name));
      // }
   }));
}

cleanupControls();
