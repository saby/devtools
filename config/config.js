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
    injectScript: resolve(source, "injection", "injection.ts"),
    /**
     * Директория с исходниками входных точек расширения
     */
    extension: resolve(source, "extension"),

    content: resolve(source, "extension", "content", "index.ts"),
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
    resource: resolve(build, 'resources'),
    /**
     * Встраиваемый в страницу сткрип
     */
    injectScript: resolve(build, "injection", "injection.js"),
    content: resolve(build, "content", "index.js"),
    cdn: resolve(build, "cdn"),
  },
  logs: {
    root: resolve(root, 'logs')
  }
};
