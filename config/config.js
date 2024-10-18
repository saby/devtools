const { resolve } = require('path');

const root = resolve(__dirname, "../");
const source = resolve(root, 'src');
const build = resolve(root, 'build');

module.exports = {
  root,
  minimize: process.env.NODE_ENV === 'production',
  input: {
    /**
     * Корневая директория с исходниками
     */
    root: source,
    /**
     * Встраиваемый в страницу сткрип
     */
    injectScript: resolve(source, "injection", "wasaby_devtool.ts"),
    /**
     * Директория с исходниками входных точек расширения
     */
    extension: resolve(source, "extension"),

    content: resolve(source, "extension", "content", "index.ts"),
    /**
     * Директория с исходниками приложения
     */
    app: resolve(source, "app"),
    sharedDir: resolve(source, 'shared'),
    injectionDir: resolve(source, "injection")
  },
  output: {
    /**
     * Корневая директория сборки
     */
    root: build,
    resource: resolve(build, 'resources'),
    /**
     * Встраиваемый в страницу сткрип
     */
    injectScript: resolve(build, "wasaby_devtool.js"),
    content: resolve(build, "content", "index.js"),
    cdn: resolve(build, "cdn"),
    sharedDirs: [
      resolve(source, 'app'),
      resolve(source, 'injection'),
      resolve(source, 'extension'),
    ]
  },
  logs: {
    root: resolve(root, 'logs')
  }
};
