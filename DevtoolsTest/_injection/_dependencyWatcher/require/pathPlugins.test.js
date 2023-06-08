define([
   'injection/_dependencyWatcher/require/pathPlugins',
   'DevtoolsTest/getJSDOM'
], function(pathPlugins, getJSDOM) {
   let sandbox;
   pathPlugins = pathPlugins.pathPlugins;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_dependencyWatcher/require/pathPlugins', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.document;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('json', function() {
         const fakeRequire = {
            toUrl: (moduleName) =>
               `resources/${moduleName}.json?x_module=19.725-136`
         };

         assert.equal(
            pathPlugins[0]('json!Controls/Application', fakeRequire),
            'resources/Controls/Application.json'
         );
         assert.isUndefined(
            pathPlugins[0]('Controls/Application', fakeRequire)
         );
      });

      it('cssTheme', function() {
         const fakeRequire = {
            toUrl: (moduleName) => `resources/${moduleName}`
         };

         assert.equal(
            pathPlugins[1]('css!theme?Controls/Application', fakeRequire),
            'resources/Controls/Application_'
         );
         assert.isUndefined(
            pathPlugins[1]('Controls/Application', fakeRequire)
         );
      });

      it('css', function() {
         const fakeRequire = {
            toUrl: (moduleName) =>
               `resources/${moduleName}.css?x_module=19.725-136`
         };

         assert.equal(
            pathPlugins[2]('css!Controls/Application', fakeRequire),
            'resources/Controls/Application.css'
         );
         assert.isUndefined(
            pathPlugins[2]('Controls/Application', fakeRequire)
         );
      });

      it('wml', function() {
         const fakeRequire = {
            toUrl: (moduleName) =>
               `resources/${moduleName}.wml?x_module=19.725-136`
         };

         assert.equal(
            pathPlugins[3]('wml!Controls/Application', fakeRequire),
            'resources/Controls/Application.wml'
         );
         assert.isUndefined(
            pathPlugins[3]('Controls/Application', fakeRequire)
         );
      });

      it('tmpl', function() {
         const fakeRequire = {
            toUrl: (moduleName) =>
               `resources/${moduleName}.tmpl?x_module=19.725-136`
         };

         assert.equal(
            pathPlugins[4]('tmpl!Controls/Application', fakeRequire),
            'resources/Controls/Application.tmpl'
         );
         assert.isUndefined(
            pathPlugins[4]('Controls/Application', fakeRequire)
         );
      });

      it('text', function() {
         const fakeRequire = {
            toUrl: (moduleName) =>
               `resources/${moduleName}.html?x_module=19.725-136`
         };

         assert.equal(
            pathPlugins[5]('text!Controls/Application', fakeRequire),
            'resources/Controls/Application.html'
         );
         assert.isUndefined(
            pathPlugins[5]('Controls/Application', fakeRequire)
         );
      });

      it('i18n', function() {
         sandbox.stub(document, 'cookie').value('lang=en-US');

         assert.equal(
            pathPlugins[6]('i18n!Controls/Application'),
            'Controls/lang/en-US/en-US.json'
         );
         assert.equal(
            pathPlugins[6]('i18n!Types/entity'),
            'Types/lang/en-US/en-US.json'
         );
         assert.isUndefined(pathPlugins[6]('Controls/Application'));
      });

      it('cdn', function() {
         assert.equal(
            pathPlugins[7]('cdn!Controls/Application'),
            '/cdn/Controls/Application'
         );
         assert.isUndefined(pathPlugins[7]('Controls/Application'));
      });

      it('js', function() {
         assert.equal(
            pathPlugins[8]('css!Controls/Application', {
               toUrl: (moduleName) =>
                  `resources/${moduleName}.js?x_module=19.725-136`
            }),
            'resources/Controls/Application.js'
         );
         assert.equal(
            pathPlugins[8](
               'css!Controls/Application/Application',
               {
                  toUrl: (moduleName) =>
                     `resources/${moduleName}`
               },
               true
            ),
            'resources/Controls/Application.js'
         );
         assert.equal(
            pathPlugins[8](
               'css!Controls/Application',
               {
                  toUrl: (moduleName) =>
                     `resources/${moduleName}`
               },
               true
            ),
            'resources/Controls/Application.js'
         );
         assert.equal(
            pathPlugins[8]('Controls/Application', {
               toUrl: (moduleName) =>
                  `resources/${moduleName}.js?x_module=19.725-136`
            }),
            'resources/Controls/Application.js'
         );
         assert.equal(
            pathPlugins[8]('Controls/Application', {
               toUrl: (moduleName) => `resources/${moduleName}`
            }),
            'resources/Controls/Application.js'
         );
      });
   });
});
