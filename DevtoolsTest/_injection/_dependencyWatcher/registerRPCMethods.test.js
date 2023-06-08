define([
   'injection/_dependencyWatcher/registerRPCMethods',
   'injection/_dependencyWatcher/storage/File',
   'injection/_dependencyWatcher/rpcStorage/Module',
   'Extension/Plugins/DependencyWatcher/const'
], function(registerRPCMethods, FileStorage, ModuleStorage, dwConstants) {
   let sandbox;
   registerRPCMethods = registerRPCMethods.default;
   const { RPCMethodNames } = dwConstants;

   describe('injection/_dependencyWatcher/registerRPCMethods', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should register methods', function() {
         function stubBind(obj, methodName) {
            const stub = sandbox.stub().withArgs(obj);
            obj[methodName] = {
               bind: stub.returns(stub)
            };
            return stub;
         }

         const rpc = {
            registerMethod: sandbox.stub()
         };
         const moduleStorage = {};
         const fakeRequire = {};
         const fakeFileStorage = {};
         const fileStorageMethods = ['query', 'getItems'];
         const fileStorageBinds = fileStorageMethods.map((methodName) => {
            return stubBind(fakeFileStorage, methodName);
         });
         sandbox.stub(FileStorage, 'FileStorage').returns(fakeFileStorage);
         const fakeRPCModulesStorage = {};
         const RPCModulesStorageMethods = [
            'query',
            'getItems',
            'hasUpdates',
            'openSource'
         ];
         const RPCModulesStorageBinds = RPCModulesStorageMethods.map(
            (methodName) => {
               return stubBind(fakeRPCModulesStorage, methodName);
            }
         );
         sandbox
            .stub(ModuleStorage, 'Module')
            .withArgs(moduleStorage, fakeFileStorage, fakeRequire)
            .returns(fakeRPCModulesStorage);

         registerRPCMethods({
            rpc,
            moduleStorage,
            require: fakeRequire
         });

         fileStorageBinds.forEach((bind) => {
            sinon.assert.calledOnce(bind);
         });
         RPCModulesStorageBinds.forEach((bind) => {
            sinon.assert.calledOnce(bind);
         });
         sinon.assert.calledWithExactly(
            rpc.registerMethod,
            RPCMethodNames.moduleQuery,
            RPCModulesStorageBinds[0]
         );
         sinon.assert.calledWithExactly(
            rpc.registerMethod,
            RPCMethodNames.moduleGetItems,
            RPCModulesStorageBinds[1]
         );
         sinon.assert.calledWithExactly(
            rpc.registerMethod,
            RPCMethodNames.moduleHasUpdates,
            RPCModulesStorageBinds[2]
         );
         sinon.assert.calledWithExactly(
            rpc.registerMethod,
            RPCMethodNames.moduleOpenSource,
            RPCModulesStorageBinds[3]
         );
         sinon.assert.calledWithExactly(
            rpc.registerMethod,
            RPCMethodNames.fileQuery,
            fileStorageBinds[0]
         );
         sinon.assert.calledWithExactly(
            rpc.registerMethod,
            RPCMethodNames.fileGetItems,
            fileStorageBinds[1]
         );
      });
   });
});
