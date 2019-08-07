const { input, output, root, logs, minimize } = require('./config');
const { resolve } = require('path');
const NODE_MODULES = resolve(root, "node_modules");

const WASABY_MODULES = [
  {
    "name": "Controls",
    "path": "sbis3-controls/Controls"
  },
  {
    "name": "Controls-theme",
    "path": "sbis3-controls/Controls-theme"
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
    "name": "Layout-theme",
    "path": "sbis3.engine/client/Layout-theme"
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
    "name": "Vdom",
    "path": "sbis3-ws/Vdom"
  },
  {
    "name": "Inferno",
    "path": "sbis3-ws/Inferno"
  },
  {
    "name": "UI",
    "path": "saby-ui/UI"
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
];

const MODULES = [].concat(WASABY_MODULES, EXTENSION_MODULES);

module.exports = {
  "cache":  resolve(logs.root, "builder-ui/builder-json-cache"),
  "output": output.resource,
  "logs": resolve(logs.root, "builder-ui/logs"),
  "typescript": true,
  "less": true,
  "contents": true,
  "themes": true,
  "sources": false,
  "symlinks": false,
  "minimize": minimize,
  "wml": true,
  "joinedMeta": true,
  "modules": MODULES
};
