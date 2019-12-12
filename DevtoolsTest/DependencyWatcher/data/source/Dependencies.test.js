define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/Dependencies'
], function(mockChrome, Dependencies) {
   let sandbox;
   Dependencies = Dependencies.Dependencies;

   describe('DependencyWatcher/_data/source/Dependencies', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_getChildren', function() {
         let instance;
         beforeEach(function() {
            const items = {};
            const logger = {
               log: sandbox.stub()
            };
            instance = new Dependencies({
               itemStorage: items,
               logger
            });
         });

         it("should return items' dependencies", function() {
            const item = {
               dependencies: []
            };
            assert.equal(instance._getChildren(item), item.dependencies);
         });
      });
   });
});
