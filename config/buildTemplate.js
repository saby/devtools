const { input, output, root, logs, minimize } = require('./config');
const { resolve } = require('path');
const NODE_MODULES = resolve(root, 'node_modules');

const WASABY_MODULES = [
   {
      name: 'Controls',
      path: 'wasaby-controls/Controls'
   },
   {
      name: 'Controls-default-theme',
      path: 'wasaby-controls/Controls-default-theme'
   },
   {
      name: 'WS.Core',
      path: 'sbis3-ws/WS.Core'
   },
   {
      name: 'View',
      path: 'sbis3-ws/View'
   },
   {
      name: 'Types',
      path: 'saby-types/Types'
   },
   {
      name: 'I18n',
      path: 'saby-i18n/I18n'
   },
   {
      name: 'Layout',
      path: 'sbis3.engine/client/Layout'
   },
   {
      name: 'Layout-default-theme',
      path: 'sbis3.engine/client/Layout-default-theme'
   },
   {
      name: 'Application',
      path: 'wasaby-app/src/Application'
   },
   {
      name: 'Env',
      path: 'rmi/src/client/Env'
   },
   {
      name: 'EnvConfig',
      path: 'rmi/src/client/EnvConfig'
   },
   {
      name: 'Browser',
      path: 'rmi/src/client/Browser'
   },
   {
      name: 'SbisEnv',
      path: 'rmi/src/client/SbisEnv'
   },
   {
      name: 'SbisEnvUI',
      path: 'rmi/src/client/SbisEnvUI'
   },
   {
      name: 'TransportCore',
      path: 'rmi/src/client/TransportCore'
   },
   {
      name: 'ParametersWebAPI',
      path: 'rmi/src/client/ParametersWebAPI'
   },
   {
      name: 'File',
      path: 'rmi/src/client/File'
   },
   {
      name: 'SbisFile',
      path: 'rmi/src/client/SbisFile'
   },
   {
      name: 'Vdom',
      path: 'sbis3-ws/Vdom'
   },
   {
      name: 'Inferno',
      path: 'saby-inferno/Inferno'
   },
   {
      name: 'UI',
      path: 'saby-ui/UI'
   },
   {
      name: 'UICore',
      path: 'saby-ui/UIInferno/UICore'
   },
   {
      name: 'UICommon',
      path: 'saby-ui/UICommon'
   },
   {
      name: 'Compiler',
      path: 'saby-ui/Compiler'
   },
   {
      name: 'RequireJsLoader',
      path: 'wasaby-requirejs-loader/RequireJsLoader'
   },
   {
      name: 'WasabyLoader',
      path: 'wasaby-requirejs-loader/WasabyLoader'
   }
].map(({ path, ...config }) => {
   return {
      path: resolve(NODE_MODULES, path),
      required: true,
      ...config
   };
});

const EXTENSION_MODULES = [
   {
      name: 'Extension',
      path: resolve(input.sharedDir, 'Extension')
   },
   {
      name: 'DependencyWatcher',
      path: resolve(input.app, 'DependencyWatcher')
   },
   {
      name: 'Elements',
      path: resolve(input.app, 'Elements')
   },
   {
      name: 'Search',
      path: resolve(input.app, 'Search')
   },
   {
      name: 'Profiler',
      path: resolve(input.app, 'Profiler')
   },
   {
      name: 'Devtool',
      path: resolve(input.app, 'Devtool')
   },
   {
      name: 'Debugging',
      path: resolve(input.app, 'Debugging')
   },
   {
      "name": "Focus",
      "path": resolve(input.app, "Focus")
   },
   {
      name: 'Controls-devtools-theme',
      path: resolve(input.app, 'Controls-devtools-theme')
   },
   {
      name: 'Layout-devtools-theme',
      path: resolve(input.app, 'Layout-devtools-theme')
   },
   {
      name: 'LogicParentPanel',
      path: resolve(input.app, 'LogicParentPanel')
   }
];

if (!minimize) {
   EXTENSION_MODULES.push({
      name: 'DevtoolsTest',
      path: resolve('DevtoolsTest')
   });
   EXTENSION_MODULES.push({
      name: 'injection',
      path: resolve(input.injectionDir)
   });
}

const MODULES = [].concat(WASABY_MODULES, EXTENSION_MODULES);

const browsersList = ['Chrome>=60'];

module.exports = {
   cache: resolve(logs.root, 'builder-ui/builder-json-cache'),
   output: output.resource,
   logs: resolve(logs.root, 'builder-ui/logs'),
   typescript: true,
   less: true,
   contents: true,
   themes: ['devtools__light', 'devtools__dark'],
   sources: false,
   symlinks: false,
   minimize: minimize,
   wml: true,
   joinedMeta: true,
   modules: MODULES,
   autoprefixer: { browsers: browsersList, remove: true },
   localization: ['en-US'],
   'default-localization': 'en-US'
};
