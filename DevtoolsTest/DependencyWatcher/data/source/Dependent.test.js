define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/Dependent'
], function(mockChrome, Dependent) {
   let sandbox;
   Dependent = Dependent.Dependent;

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
            instance = new Dependent({
               itemStorage: items,
               logger
            });
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
