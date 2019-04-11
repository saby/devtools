const { resolve } = require('path');

const root = resolve(__dirname, "../");
const source = resolve(root, 'src');
const build = resolve(root, 'build');

module.exports = {
  root,
  input: {
    /**
     * Корневая директория с исходниками
     */
    root: source,
    /**
     * Встраиваемый в страницу сткрип
     */
    injectScript: resolve(source, "injection/injection.ts"),
    /**
     * Директория с исходниками входных точек расширения
     */
    extension: resolve(source, "extension"),
    /**
     * Директория с исходниками приложения
     */
    app: resolve(source, "app")
  },
  output: {
    /**
     * Корневая директория сборки
     */
    root: build,
    resource: resolve(build, 'resource'),
    /**
     * Встраиваемый в страницу сткрип
     */
    injectScript: resolve(build, "injection/injection.js"),
  },
  logs: {
    root: resolve(root, 'logs')
  }
};
