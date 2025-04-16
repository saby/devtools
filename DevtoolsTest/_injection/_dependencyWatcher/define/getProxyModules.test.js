define(['injection/_dependencyWatcher/define/getProxyModules'], function(
   getProxyModules
) {
   let sandbox;
   getProxyModules = getProxyModules.getProxyModules;

   describe('injection/_dependencyWatcher/define/getProxyModules', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should return correct proxies', function() {
         const proxies = getProxyModules({});

         assert.hasAllKeys(proxies, [
            'require',
            'Core/library',
            'Core/moduleStubs'
         ]);
      });

      describe('require', function() {
         it('should proxy require for the module', function() {
            const storage = {
               require: sandbox.stub()
            };
            const proxies = getProxyModules(storage);
            const callback = () => {};
            const dependencies = ['wml!Controls/Application', 'css!Controls/Application'];
            const expectedResult = {};
            const fakeRequire = sandbox.stub().returns(expectedResult);

            const requireProxy = proxies['require']('Controls/Application', fakeRequire);
            const result = requireProxy(dependencies, callback);

            sinon.assert.calledWithExactly(storage.require, 'Controls/Application', dependencies);
            sinon.assert.calledWithExactly(fakeRequire, dependencies, callback);
            assert.equal(result, expectedResult);
         });
      });

      describe('Core/moduleStubs', function() {
         it('should proxy Core/moduleStubs.requireModule for the module', function() {
            const storage = {
               require: sandbox.stub()
            };
            const proxies = getProxyModules(storage);
            const dependencies = ['wml!Controls/Application', 'css!Controls/Application'];
            const expectedResult = {};
            const fakeModuleStubs = {
               requireModule: sandbox.stub().returns(expectedResult)
            };

            const moduleStubsProxy = proxies['Core/moduleStubs']('Controls/Application', fakeModuleStubs);
            const result = moduleStubsProxy.requireModule(dependencies);

            sinon.assert.calledWithExactly(storage.require, 'Controls/Application', dependencies);
            sinon.assert.calledWithExactly(fakeModuleStubs.requireModule, dependencies);
            assert.equal(result, expectedResult);
         });

         it('should proxy Core/moduleStubs.require for the module', function() {
            const storage = {
               require: sandbox.stub()
            };
            const proxies = getProxyModules(storage);
            const dependencies = ['wml!Controls/Application', 'css!Controls/Application'];
            const expectedResult = {};
            const fakeModuleStubs = {
               require: sandbox.stub().returns(expectedResult)
            };

            const moduleStubsProxy = proxies['Core/moduleStubs']('Controls/Application', fakeModuleStubs);
            const result = moduleStubsProxy.require(dependencies);

            sinon.assert.calledWithExactly(storage.require, 'Controls/Application', dependencies);
            sinon.assert.calledWithExactly(fakeModuleStubs.require, dependencies);
            assert.equal(result, expectedResult);
         });

         it('should return property of Core/moduleStubs without proxying', function() {
            const proxies = getProxyModules({});
            const fakeModuleStubs = {
               testProp: () => 123
            };

            const moduleStubsProxy = proxies['Core/moduleStubs']('Controls/Application', fakeModuleStubs);
            const result = moduleStubsProxy.testProp();

            assert.equal(result, 123);
         });
      });

      describe('Core/moduleStubs', function() {
         it('should proxy Core/library.load for the module', function() {
            const storage = {
               require: sandbox.stub()
            };
            const proxies = getProxyModules(storage);
            const loader = () => {};
            const expectedResult = {};
            const fakeLibrary = {
               load: sandbox.stub().returns(expectedResult),
               parse: (name) => {
                  return {
                     name: name.split(':').pop()
                  }
               }
            };

            const libraryProxy = proxies['Core/library']('Controls/buttons:Button', fakeLibrary);
            const result = libraryProxy.load('Controls/buttons:Button', loader);

            sinon.assert.calledWithExactly(storage.require, 'Controls/buttons:Button', 'Button');
            sinon.assert.calledWithExactly(fakeLibrary.load, 'Controls/buttons:Button', loader);
            assert.equal(result, expectedResult);
         });

         it('should return property of Core/library without proxying', function() {
            const proxies = getProxyModules({});
            const fakeLibrary = {
               testProp: () => 123
            };

            const libraryProxy = proxies['Core/library']('Controls/Application', fakeLibrary);
            const result = libraryProxy.testProp();

            assert.equal(result, 123);
         });
      });
   });
});
