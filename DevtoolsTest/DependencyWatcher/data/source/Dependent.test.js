define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/Dependent'
], function(mockChrome, Dependent) {
   Dependent = Dependent.Dependent;

   describe('DependencyWatcher/_data/source/Dependencies', function() {
      describe('_getChildren', function() {
         let instance;

         beforeEach(function() {
            instance = new Dependent({
               itemStorage: {},
               logger: {}
            });
         });

         afterEach(function() {
            instance = undefined;
         });

         it("should return items' dependent", function() {
            const item = {
               dependent: []
            };
            assert.equal(instance._getChildren(item), item.dependent);
         });
      });
   });
});
