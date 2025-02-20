define([
   'injection/_dependencyWatcher/require/proxy',
   'Extension/Plugins/DependencyWatcher/const'
], function(proxyRequire, dwConstants) {
   let sandbox;
   proxyRequire = proxyRequire.proxyRequire;

   describe('injection/_dependencyWatcher/require/proxy', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should wrap the only dependency in array and save it', function() {
         const fakeRequire = sandbox.stub();
         const storage = {
            require: sandbox.stub()
         };
         const logger = {
            error: sandbox.stub()
         };

         const requireProxy = proxyRequire(fakeRequire, storage, logger);

         requireProxy('Controls/Application');

         sinon.assert.calledWithExactly(
            storage.require,
            dwConstants.GLOBAL_MODULE_NAME,
            ['Controls/Application']
         );
         sinon.assert.calledOn(fakeRequire, undefined);
         sinon.assert.calledWithExactly(fakeRequire, 'Controls/Application');
      });

      it('should save dependencies', function() {
         const fakeRequire = sandbox.stub();
         const storage = {
            require: sandbox.stub()
         };
         const logger = {
            error: sandbox.stub()
         };

         const requireProxy = proxyRequire(fakeRequire, storage, logger);

         requireProxy(['Controls/Application', 'wml!Controls/Application']);

         sinon.assert.calledWithExactly(
            storage.require,
            dwConstants.GLOBAL_MODULE_NAME,
            ['Controls/Application', 'wml!Controls/Application']
         );
         sinon.assert.calledOn(fakeRequire, undefined);
         sinon.assert.calledWithExactly(fakeRequire, [
            'Controls/Application',
            'wml!Controls/Application'
         ]);
      });

      it("shouldn't save dependencies if there're none", function() {
         const fakeRequire = sandbox.stub();
         const storage = {
            require: sandbox.stub()
         };
         const logger = {
            error: sandbox.stub()
         };

         const requireProxy = proxyRequire(fakeRequire, storage, logger);

         requireProxy();

         sinon.assert.notCalled(storage.require);
         sinon.assert.calledOn(fakeRequire, undefined);
         sinon.assert.calledWithExactly(fakeRequire);
      });

      it('should log error', function() {
         const fakeRequire = sandbox.stub();
         const storage = {
            require: sandbox.stub().throws(new Error('test error'))
         };
         const logger = {
            error: sandbox.stub()
         };

         const requireProxy = proxyRequire(fakeRequire, storage, logger);

         requireProxy(['Controls/Application', 'wml!Controls/Application']);

         assert.equal(logger.error.firstCall.args[0].message, 'test error');
         sinon.assert.calledWithExactly(
            storage.require,
            dwConstants.GLOBAL_MODULE_NAME,
            ['Controls/Application', 'wml!Controls/Application']
         );
         sinon.assert.calledOn(fakeRequire, undefined);
         sinon.assert.calledWithExactly(fakeRequire, [
            'Controls/Application',
            'wml!Controls/Application'
         ]);
      });
   });
});
