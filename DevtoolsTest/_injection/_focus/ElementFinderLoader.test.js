define([
   'DevtoolsTest/mockChrome',
   'injection/_focus/ElementFinderLoader',
   'DevtoolsTest/getJSDOM'
], function (mockChrome, ElementFinderLoader, getJSDOM) {
   ElementFinderLoader = ElementFinderLoader.ElementFinderLoader;
   let sandbox;
   let instance;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_focus/ElementFinderLoader', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.window;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
         instance = new ElementFinderLoader();
      });

      afterEach(function () {
         sandbox.restore();
      });

      function stubWasabyDevHook() {
         if (!window.__WASABY_DEV_HOOK__) {
            window.__WASABY_DEV_HOOK__ = {};
         }
      }

      describe('getElementFinder', function () {
         it('should return the cached value', async function () {
            const elementFinder = {};
            instance.elementFinder = elementFinder;

            const result = await instance.getElementFinder();

            assert.strictEqual(result, elementFinder);
         });

         it('should load element finder, save it on instance and return it', async function () {
            const elementFinder = {};
            const oldRequire = window.require;
            window.require = sandbox.stub().callsArgWith(1, {
               ElementFinder: elementFinder
            });
            stubWasabyDevHook();
            window.__WASABY_DEV_HOOK__._$hasWasaby = true;

            const result = await instance.getElementFinder();

            assert.strictEqual(result, elementFinder);
            assert.strictEqual(instance.elementFinder, elementFinder);
            sinon.assert.calledWith(window.require, ['UI/Focus']);

            window.require = oldRequire;
            delete window.__WASABY_DEV_HOOK__;
         });
      });
   });
});
