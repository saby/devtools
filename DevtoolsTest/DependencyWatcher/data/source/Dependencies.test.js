define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/Dependencies'
], function(mockChrome, Dependencies) {
   Dependencies = Dependencies.Dependencies;

   describe('DependencyWatcher/_data/source/Dependencies', function() {
      describe('_getChildren', function() {
         let instance;

         beforeEach(function() {
            instance = new Dependencies({
               itemStorage: {},
               logger: {}
            });
         });

         afterEach(function() {
            instance = undefined;
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
