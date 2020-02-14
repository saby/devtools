define([
   'injection/_dependencyWatcher/Require',
   'injection/_dependencyWatcher/require/proxy'
], function(Require, proxyRequire) {
   let sandbox;
   Require = Require.Require;

   describe('injection/_dependencyWatcher/Require', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should save storage and logger on instance', function() {
            const moduleStorage = {};
            const logger = {};

            const instance = new Require({
               moduleStorage,
               logger
            });

            assert.equal(instance._storage, moduleStorage);
            assert.equal(instance._logger, logger);
         });
      });

      describe('getDescriptor', function() {
         it('should return correct descriptor', function() {
            const moduleStorage = {};
            const logger = {};
            const instance = new Require({
               moduleStorage,
               logger
            });

            const descriptor = instance.getDescriptor();

            assert.hasAllKeys(descriptor, [
               'set',
               'get',
               'configurable',
               'enumerable'
            ]);
            assert.isTrue(descriptor.configurable);
            assert.isTrue(descriptor.enumerable);

            const requireConfig = {};
            descriptor.set(requireConfig);

            assert.isUndefined(instance._require);
            assert.isUndefined(instance._proxy);
            assert.equal(instance._init, requireConfig);
            assert.equal(descriptor.get(), requireConfig);

            const fakeRequire = () => {};
            const requireProxy = () => {};
            sandbox
               .stub(proxyRequire, 'proxyRequire')
               .withArgs(fakeRequire, moduleStorage, logger)
               .returns(requireProxy);

            descriptor.set(fakeRequire);
            assert.equal(instance._require, fakeRequire);
            assert.equal(instance._proxy, requireProxy);
            assert.equal(descriptor.get(), requireProxy);
         });
      });

      describe('getOrigin', function() {
         it('should return require from instance', function() {
            const moduleStorage = {};
            const logger = {};
            const instance = new Require({
               moduleStorage,
               logger
            });
            const fakeRequire = () => {};
            instance._require = fakeRequire;

            assert.equal(instance.getOrigin(), fakeRequire);
         });
      });

      describe('getConfig', function() {
         it('should return initial config', function() {
            const moduleStorage = {};
            const logger = {};
            const instance = new Require({
               moduleStorage,
               logger
            });
            const requireConfig = {};
            instance._init = requireConfig;

            assert.equal(instance.getConfig(), requireConfig);
         });

         it('should return actual confug from require', function() {
            const moduleStorage = {};
            const logger = {};
            const instance = new Require({
               moduleStorage,
               logger
            });
            const requireConfig = {};
            const fakeRequire = () => {};
            fakeRequire.s = {
               contexts: {
                  _: {
                     config: requireConfig
                  }
               }
            };
            instance._require = fakeRequire;

            assert.equal(instance.getConfig(), requireConfig);
         });

         it("should warn and return initial config if config can't be taken directly from require", function() {
            const moduleStorage = {};
            const logger = {
               warn: sandbox.stub()
            };
            const instance = new Require({
               moduleStorage,
               logger
            });
            const requireConfig = {};
            instance._init = requireConfig;
            instance._require = () => {};

            assert.equal(instance.getConfig(), requireConfig);
            assert.equal(
               logger.warn.firstCall.args[0].message,
               "Cannot read property 'contexts' of undefined"
            );
         });
      });
   });
});
