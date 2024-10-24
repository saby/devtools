define(['injection/_dependencyWatcher/define/replaceDependency'], function(
   replaceDependencies
) {
   let sandbox;
   replaceDependencies = replaceDependencies.replaceDependencies;

   describe('injection/_dependencyWatcher/define/replaceDependency', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should replace original modules with proxies', function() {
         const proxyRequire = sandbox.stub();
         const proxyLibrary = sandbox.stub();
         const proxyModuleStubs = sandbox.stub();
         const proxyModules = {
            require: sandbox.stub().returns(proxyRequire),
            'Core/library': sandbox.stub().returns(proxyLibrary),
            'Core/moduleStubs': sandbox.stub().returns(proxyModuleStubs)
         };
         const moduleName = 'Controls/buttons:Button';
         const fakeRequire = () => {};
         const exports = {};
         const fakeLibrary = () => {};
         const args = [fakeRequire, exports, fakeLibrary];

         const newArgs = replaceDependencies({
            moduleName,
            proxyModules,
            args,
            dependencies: ['require', 'exports', 'Core/library']
         });

         assert.deepEqual(newArgs, [proxyRequire, exports, proxyLibrary]);
      });

      it('should return the same args if moduleName is a key of proxyModules', function() {
         const proxyRequire = sandbox.stub();
         const proxyLibrary = sandbox.stub();
         const proxyModuleStubs = sandbox.stub();
         const proxyModules = {
            require: sandbox.stub().returns(proxyRequire),
            'Core/library': sandbox.stub().returns(proxyLibrary),
            'Core/moduleStubs': sandbox.stub().returns(proxyModuleStubs)
         };
         const moduleName = 'require';
         const fakeRequire = () => {};
         const exports = {};
         const fakeLibrary = () => {};
         const args = [fakeRequire, exports, fakeLibrary];

         const newArgs = replaceDependencies({
            moduleName,
            proxyModules,
            args,
            dependencies: ['require', 'exports', 'Core/library']
         });

         assert.equal(newArgs, args);
      });
   });
});
