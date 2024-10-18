define([
   'injection/_dependencyWatcher/Define',
   'injection/_dependencyWatcher/define/proxy',
   'DevtoolsTest/getJSDOM'
], function(Define, proxyDefine, getJSDOM) {
   let sandbox;
   Define = Define.Define;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_dependencyWatcher/Define', function() {
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
         it('should not proxy define if require is not proxied', function() {
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

            descriptor.set(fakeDefine);

            assert.isUndefined(instance._define);
            assert.equal(instance._proxy, fakeDefine);
            assert.equal(descriptor.get(), fakeDefine);
         });

         it("should not proxy define if require doesn't have isWasaby field", function() {
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

            const oldRequire = window.require;
            window.require = {};

            const fakeDefine = () => {};

            descriptor.set(fakeDefine);

            assert.isUndefined(instance._define);
            assert.equal(instance._proxy, fakeDefine);
            assert.equal(descriptor.get(), fakeDefine);

            window.require = oldRequire;
         });

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

            const oldRequire = window.require;
            window.require = {
               isWasaby: true
            };

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

            window.require = oldRequire;
         });
      });
   });
});
