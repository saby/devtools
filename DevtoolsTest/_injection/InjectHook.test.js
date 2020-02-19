define([
   'injection/InjectHook',
   'injection/_hook/Hook',
   'DevtoolsTest/getJSDOM'
], function(InjectHook, Hook, getJSDOM) {
   let sandbox;
   InjectHook = InjectHook.InjectHook;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/InjectHook', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.window;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('getName', function() {
         assert.equal(InjectHook.getName(), 'InjectHook');
      });

      describe('constructor', function() {
         it('should not touch the existing hook', function() {
            const hookValue = Object.freeze({
               value: 123
            });
            window.__WASABY_DEV_HOOK__ = hookValue;

            new InjectHook();

            assert.equal(window.__WASABY_DEV_HOOK__, hookValue);

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });

         it('should create a new hook and save it on window.__WASABY_DEV_HOOK__', function() {
            const hookValue = Object.freeze({
               value: 123
            });
            const config = {
               logger: {
                  create: sandbox.stub()
               }
            };
            sandbox
               .stub(Hook, 'Hook')
               .withArgs(config.logger)
               .returns(hookValue);

            new InjectHook(config);

            assert.equal(window.__WASABY_DEV_HOOK__, hookValue);
            sinon.assert.calledWithNew(Hook.Hook);

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });
      });
   });
});
