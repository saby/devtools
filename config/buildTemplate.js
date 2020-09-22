const { input, output, root, logs, minimize } = require('./config');
const { resolve } = require('path');
const NODE_MODULES = resolve(root, "node_modules");

const WASABY_MODULES = [
  {
    "name": "Controls",
    "path": "wasaby-controls/Controls"
  },
  {
    "name": "Controls-default-theme",
    "path": "wasaby-controls/Controls-default-theme"
  },
  {
    "name": "WS.Core",
    "path": "sbis3-ws/WS.Core"
  },
  {
    "name": "View",
    "path": "sbis3-ws/View"
  },
  {
    "name": "Types",
    "path": "saby-types/Types"
  },
  {
    "name": "I18n",
    "path": "saby-i18n/I18n"
  },
  {
    "name": "Layout",
    "path": "sbis3.engine/client/Layout"
  },
  {
    "name": "Layout-default-theme",
    "path": "sbis3.engine/client/Layout-default-theme"
  },
  {
    "name": "Application",
    "path": "wasaby-app/src/Application"
  },
  {
    "name": "Env",
    "path": "rmi/src/client/Env"
  },
  {
    "name": "Browser",
    "path": "rmi/src/client/Browser"
  },
  {
    "name": "SbisEnv",
    "path": "rmi/src/client/SbisEnv"
  },
  {
    "name": "SbisEnvUI",
    "path": "rmi/src/client/SbisEnvUI"
  },
  {
    "name": "SbisEnvUI-default-theme",
    "path": "rmi/src/client/SbisEnvUI-default-theme"
  },
  {
    "name": "File",
    "path": "rmi/src/client/File"
  },
  {
    "name": "SbisFile",
    "path": "rmi/src/client/SbisFile"
  },
  {
    "name": "Vdom",
    "path": "sbis3-ws/Vdom"
  },
  {
    "name": "Inferno",
    "path": "saby-inferno/Inferno"
  },
  {
    "name": "UI",
    "path": "saby-ui/UI"
  },
  {
    "name": "RequireJsLoader",
    "path": "wasaby-requirejs-loader/RequireJsLoader"
  }
].map(({ path, ...config}) => {
  return {
    path: resolve(NODE_MODULES, path),
      "required": true,
    ...config
  }
});


const EXTENSION_MODULES = [
  {
    "name": "Extension",
    "path": resolve(input.sharedDir, "Extension")
  },
  {
    "name": "DependencyWatcher",
    "path": resolve(input.app, "DependencyWatcher")
  },
  {
    "name": "Elements",
    "path": resolve(input.app, "Elements")
  },
  {
    "name": "Search",
    "path": resolve(input.app, "Search")
  },
  {
    "name": "Profiler",
    "path": resolve(input.app, "Profiler")
  },
  {
    "name": "Devtool",
    "path": resolve(input.app, "Devtool")
  },
  {
    "name": "Debugging",
    "path": resolve(input.app, "Debugging")
  },
  {
    "name": "DevtoolsTest",
    "path": resolve("DevtoolsTest")
  },
  {
    "name": "Injection",
    "path": resolve(input.injectionDir)
  },
  {
    "name": "Controls-devtools-theme",
    "path": resolve(input.app, "Controls-devtools-theme")
  },
  {
    "name": "Layout-devtools-theme",
    "path": resolve(input.app, "Layout-devtools-theme")
  },
  {
    "name": "Debugging-devtools-theme",
    "path": resolve(input.app, "Debugging-devtools-theme")
  },
  {
    "name": "DependencyWatcher-devtools-theme",
    "path": resolve(input.app, "DependencyWatcher-devtools-theme")
  },
  {
    "name": "Debugging-devtools-theme",
    "path": resolve(input.app, "Devtool-devtools-theme")
  },
  {
    "name": "Elements-devtools-theme",
    "path": resolve(input.app, "Elements-devtools-theme")
  },
  {
    "name": "Profiler-devtools-theme",
    "path": resolve(input.app, "Profiler-devtools-theme")
  },
  {
    "name": "LogicParentPanel",
    "path": resolve(input.app, "LogicParentPanel")
  }
];

const MODULES = [].concat(WASABY_MODULES, EXTENSION_MODULES);

const browsersList = ['Chrome>=60'];

// TODO: поставить oldThemes: false после https://online.sbis.ru/opendoc.html?guid=5ed54ee2-0e05-49a8-b860-7cb22197d536
module.exports = {
  "cache":  resolve(logs.root, "builder-ui/builder-json-cache"),
  "output": output.resource,
  "logs": resolve(logs.root, "builder-ui/logs"),
  "typescript": true,
  "less": true,
  "contents": true,
  "themes": ["devtools__light", "devtools__dark"],
  "sources": false,
  "symlinks": false,
  "minimize": minimize,
  "wml": true,
  "joinedMeta": true,
  "modules": MODULES,
  "autoprefixer": { browsers: browsersList, remove: true },
  "localization": ["en-US"],
  "default-localization": "en-US"
};
