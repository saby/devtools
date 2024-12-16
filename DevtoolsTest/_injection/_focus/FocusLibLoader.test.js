define([
   'DevtoolsTest/mockChrome',
   'injection/_focus/FocusLibLoader',
   'DevtoolsTest/getJSDOM'
], function (mockChrome, FocusLibLoader, getJSDOM) {
   FocusLibLoader = FocusLibLoader.FocusLibLoader;
   let sandbox;
   let instance;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_focus/FocusLibLoader', function () {
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
         instance = new FocusLibLoader();
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
         it('should return the cached ElementFinder', async function () {
            const elementFinder = {};
            instance.focusLib = {
               ElementFinder: elementFinder
            };

            const result = await instance.getElementFinder();

            assert.strictEqual(result, elementFinder);
         });

         it('should load element finder, save the entire library on instance and return the element finder', async function () {
            const elementFinder = {};
            const oldRequire = window.require;
            const focusLib = {
               ElementFinder: elementFinder
            };
            window.require = sandbox.stub().callsArgWith(1, focusLib);
            stubWasabyDevHook();
            window.__WASABY_DEV_HOOK__._$hasWasaby = true;

            const result = await instance.getElementFinder();

            assert.strictEqual(result, elementFinder);
            assert.strictEqual(instance.focusLib, focusLib);
            sinon.assert.calledWith(window.require, ['UI/Focus']);

            window.require = oldRequire;
            delete window.__WASABY_DEV_HOOK__;
         });
      });

      describe('getFocusFromLib', function () {
         it('should return the cached focus', async function () {
            const focusFromLib = {};
            instance.focusLib = {
               focus: focusFromLib
            };

            const result = await instance.getFocusFromLib();

            assert.strictEqual(result, focusFromLib);
         });

         it('should load focus, save the entire library on instance and return the focus', async function () {
            const focusFromLib = {};
            const oldRequire = window.require;
            const focusLib = {
               focus: focusFromLib
            };
            window.require = sandbox.stub().callsArgWith(1, focusLib);
            stubWasabyDevHook();
            window.__WASABY_DEV_HOOK__._$hasWasaby = true;

            const result = await instance.getFocusFromLib();

            assert.strictEqual(result, focusFromLib);
            assert.strictEqual(instance.focusLib, focusLib);
            sinon.assert.calledWith(window.require, ['UI/Focus']);

            window.require = oldRequire;
            delete window.__WASABY_DEV_HOOK__;
         });
      });
   });
});
