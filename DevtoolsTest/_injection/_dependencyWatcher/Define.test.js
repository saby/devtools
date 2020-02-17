define([
   'injection/_dependencyWatcher/Define',
   'injection/_dependencyWatcher/define/proxy'
], function(Define, proxyDefine) {
   let sandbox;
   Define = Define.Define;

   describe('injection/_dependencyWatcher/Define', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should save storage on instance', function() {
            const moduleStorage = {};

            const instance = new Define({
               moduleStorage
            });

            assert.equal(instance._storage, moduleStorage);
         });
      });

      describe('getDescriptor', function() {
         it('should return correct descriptor', function() {
            const moduleStorage = {};
            const instance = new Define({
               moduleStorage
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

            const fakeDefine = () => {};
            const defineProxy = () => {};
            sandbox
               .stub(proxyDefine, 'proxyDefine')
               .withArgs(fakeDefine, moduleStorage)
               .returns(defineProxy);

            descriptor.set(fakeDefine);

            assert.equal(instance._define, fakeDefine);
            assert.equal(instance._proxy, defineProxy);
            assert.equal(descriptor.get(), defineProxy);

            const anotherDefineProxy = () => {};

            descriptor.set(anotherDefineProxy);
            assert.equal(instance._define, fakeDefine);
            assert.equal(instance._proxy, anotherDefineProxy);
            assert.equal(descriptor.get(), anotherDefineProxy);
            sinon.assert.calledOnce(proxyDefine.proxyDefine);
         });
      });
   });
});
