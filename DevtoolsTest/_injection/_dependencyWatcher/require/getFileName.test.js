define([
   'injection/_dependencyWatcher/require/getFileNames',
   'Extension/Plugins/DependencyWatcher/const',
   'injection/_dependencyWatcher/require/pathPlugins',
   'DevtoolsTest/getJSDOM'
], function(getFileNames, dwConstants, pathPlugins, getJSDOM) {
   let sandbox;
   getFileNames = getFileNames.getFileNames;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_dependencyWatcher/require/getFileNames', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
            global.location = dom.window.location;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.window;
            delete global.location;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should return location.href for the root module', function() {
         const fakeRequire = {};
         const bundles = {};
         const staticDependents = new Set();

         const result = getFileNames(
            dwConstants.GLOBAL_MODULE_NAME,
            fakeRequire,
            false,
            bundles,
            staticDependents
         );

         assert.deepEqual(result, [location.href]);
      });

      it('should return file names from bundles', function() {
         const fakeRequire = {};
         const bundles = {
            'resources/Types/display.min': [
               'Types/_display/Abstract',
               'Types/_display/CollectionEnumerator'
            ],
            'resources/Controls/controls.package.min': [
               'Controls/list',
               'Controls/Application'
            ],
            'resources/online-superbundle.min': [
               'UI/Base',
               'Controls/Application'
            ]
         };
         const staticDependents = new Set();

         const result = getFileNames(
            'Controls/Application',
            fakeRequire,
            true,
            bundles,
            staticDependents
         );

         assert.deepEqual(result, [
            'resources/Controls/controls.package.min.js',
            'resources/online-superbundle.min.js'
         ]);
      });

      it('should return file names from the path plugins (release mode)', function() {
         const fakeRequire = {};
         const bundles = {
            'resources/online-superbundle.min': [
               'UI/Base'
            ]
         };
         const staticDependents = new Set();
         const pathPluginStub = sandbox
            .stub()
            .withArgs('Controls/Application', fakeRequire, false);
         pathPluginStub.onFirstCall().returns(undefined);
         pathPluginStub.onSecondCall().returns('Controls');
         pathPluginStub.onThirdCall().returns('Controls/Application.js');
         sandbox
            .stub(pathPlugins, 'pathPlugins')
            .value([pathPluginStub, pathPluginStub, pathPluginStub]);

         const result = getFileNames(
            'Controls/Application',
            fakeRequire,
            true,
            bundles,
            staticDependents
         );

         assert.deepEqual(result, ['Controls', 'Controls/Application.js']);
      });

      it('should return file names from the path plugins (debug mode)', function() {
         const fakeRequire = {};
         const bundles = {
            'resources/online-superbundle.min': [
               'UI/Base',
               'Controls/Application'
            ]
         };
         const staticDependents = new Set();
         const pathPluginStub = sandbox
            .stub()
            .withArgs('Controls/Application', fakeRequire, false);
         pathPluginStub.onFirstCall().returns(undefined);
         pathPluginStub.onSecondCall().returns('Controls');
         pathPluginStub.onThirdCall().returns('Controls/Application.js');
         sandbox
            .stub(pathPlugins, 'pathPlugins')
            .value([pathPluginStub, pathPluginStub, pathPluginStub]);

         const result = getFileNames(
            'Controls/Application',
            fakeRequire,
            false,
            bundles,
            staticDependents
         );

         assert.deepEqual(result, ['Controls', 'Controls/Application.js']);
      });

      describe('should return file names from the path plugins and static dependents', function() {
         const hardPlugins = ['i18n', 'css', 'wml', 'tmpl'];

         hardPlugins.forEach((plugin) => {
            it(plugin, () => {
               const fakeRequire = {};
               const bundles = {
                  'resources/online-superbundle.min': [
                     'UI/Base',
                     'Controls/Application'
                  ]
               };
               const staticDependents = new Set();
               staticDependents.add({
                  name: 'Undefined/Module',
                  defined: false
               });
               staticDependents.add({
                  name: 'Defined/Module',
                  defined: true,
                  dependent: {
                     static: new Set()
                  }
               });
               const firstStub = sandbox.stub();
               firstStub
                  .withArgs(
                     `${plugin}!Controls/Application`,
                     fakeRequire,
                     false
                  )
                  .returns(`Controls/Application.${plugin}`);
               const secondStub = sandbox.stub();
               secondStub
                  .withArgs('Defined/Module', fakeRequire, false)
                  .returns('Defined');
               sandbox
                  .stub(pathPlugins, 'pathPlugins')
                  .value([firstStub, secondStub]);

               const result = getFileNames(
                  `${plugin}!Controls/Application`,
                  fakeRequire,
                  false,
                  bundles,
                  staticDependents
               );

               assert.deepEqual(result, [
                  `Controls/Application.${plugin}`,
                  'Defined'
               ]);
            });
         });

         it('_localization', () => {
            const fakeRequire = {};
            const bundles = {
               'resources/online-superbundle.min': [
                  'UI/Base',
                  'Controls/Application'
               ]
            };
            const staticDependents = new Set();
            staticDependents.add({
               name: 'Undefined/Module',
               defined: false
            });
            staticDependents.add({
               name: 'Defined/Module',
               defined: true,
               dependent: {
                  static: new Set()
               }
            });
            const firstStub = sandbox.stub();
            firstStub
               .withArgs(
                  `Controls_localization`,
                  fakeRequire,
                  false
               )
               .returns(`Controls`);
            const secondStub = sandbox.stub();
            secondStub
               .withArgs('Defined/Module', fakeRequire, false)
               .returns('Defined');
            sandbox
               .stub(pathPlugins, 'pathPlugins')
               .value([firstStub, secondStub]);

            const result = getFileNames(
               `Controls_localization`,
               fakeRequire,
               false,
               bundles,
               staticDependents
            );

            assert.deepEqual(result, [`Controls`, 'Defined']);
         });
      });
   });
});
