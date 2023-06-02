define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/storage/File',
   'Extension/Plugins/DependencyWatcher/const'
], function(mockChrome, File, DWConst) {
   let sandbox;
   let instance;
   File = File.File;

   describe('DependencyWatcher/_data/storage/File', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new File({});
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('query', function() {
         beforeEach(function() {
            instance._rpc.execute = sandbox.stub();
         });
         it('should call method with default queryParams', async function() {
            await instance.query();

            assert.isTrue(
               instance._rpc.execute.calledOnceWithExactly({
                  methodName: DWConst.RPCMethodNames.fileQuery,
                  args: {}
               })
            );
         });

         it('should call method with the passed queryParams', async function() {
            await instance.query({
               isDeprecated: true
            });

            assert.isTrue(
               instance._rpc.execute.calledOnceWithExactly({
                  methodName: DWConst.RPCMethodNames.fileQuery,
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
            sandbox.stub(instance._files, 'get').callsFake((id) => {
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

         it('should request files that were not already requested', async function() {
            const keys = [1, 2, 3];
            const hasStub = sandbox.stub(instance._files, 'has');
            hasStub.withArgs(1).returns(true);
            hasStub.withArgs(2).returns(false);
            hasStub.withArgs(3).returns(true);
            const items = [{
               id: 1
            }, {
               id: 3
            }];
            instance._rpc.execute = sandbox.stub().withArgs({
               methodName: DWConst.RPCMethodNames.fileGetItems,
               args: [1, 3]
            }).resolves(items);
            const setStub = sandbox.stub(instance._files, 'set');

            await instance.__updateCache(keys);

            assert.isTrue(setStub.calledWithExactly(1, items[0]));
            assert.isTrue(setStub.calledWithExactly(3, items[1]));
         });
      });
   });
});
