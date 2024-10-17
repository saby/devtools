define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/storage/Module',
   'Extension/Plugins/DependencyWatcher/const'
], function(mockChrome, Module, DWConst) {
   let sandbox;
   let instance;
   Module = Module.Module;

   describe('DependencyWatcher/_data/storage/Module', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Module({});
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('query', function() {
         beforeEach(function() {
            instance._rpc.execute = sandbox.stub();
         });

         it('should call method with the passed queryParams', async function() {
            await instance.query({
               isDeprecated: true
            });

            assert.isTrue(
               instance._rpc.execute.calledOnceWithExactly({
                  methodName: DWConst.RPCMethodNames.moduleQuery,
                  args: {
                     isDeprecated: true
                  }
               })
            );
         });
      });

      describe('getItems', function() {
         it('should update the cache and then return the requested items', async function() {
            const keys = [1, 2, 3];
            sandbox
               .stub(instance, '__updateCache')
               .withArgs(keys)
               .resolves();
            sandbox.stub(instance._items, 'get').callsFake((id) => {
               return {
                  id
               };
            });

            assert.deepEqual(await instance.getItems(keys), [
               {
                  id: 1
               },
               {
                  id: 2
               },
               {
                  id: 3
               }
            ]);
         });
      });

      describe('__updateCache', function() {
         it('should return undefined because there are no keys', async function() {
            assert.isUndefined(await instance.__updateCache([]));
         });

         it('should not update items because there are no updates for them', async function() {
            instance._rpc.execute = sandbox
               .stub()
               .withArgs({
                  methodName: DWConst.RPCMethodNames.moduleHasUpdates,
                  args: [1, 2, 3]
               })
               .resolves([false, false, false]);
            sandbox.stub(instance._items, 'has').returns(true);
            const setStub = sandbox.stub(instance._items, 'set');

            await instance.__updateCache([1, 2, 3]);

            assert.isTrue(setStub.notCalled);
         });

         it('should request missing items even if there were no updates for them', async function() {
            const executeStub = sandbox.stub();
            executeStub
               .withArgs({
                  methodName: DWConst.RPCMethodNames.moduleHasUpdates,
                  args: [1, 2, 3]
               })
               .resolves([false, false, false]);
            instance._rpc.execute = executeStub;
            const hasStub = sandbox.stub(instance._items, 'has');
            hasStub.withArgs(1).returns(true);
            hasStub.withArgs(2).returns(true);
            hasStub.withArgs(3).returns(false);
            executeStub
               .withArgs({
                  methodName: DWConst.RPCMethodNames.moduleGetItems,
                  args: [3]
               })
               .resolves([
                  {
                     id: 3
                  }
               ]);
            const setStub = sandbox.stub(instance._items, 'set');

            await instance.__updateCache([1, 2, 3]);

            assert.isTrue(
               setStub.calledOnceWithExactly(3, {
                  id: 3
               })
            );
         });
      });
   });
});
