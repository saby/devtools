define([
   'injection/_dependencyWatcher/data/sort/filesSort',
   'injection/_dependencyWatcher/data/sort/size',
   'injection/_dependencyWatcher/data/sort/name'
], function(filesSort, size, name) {
   let sandbox;
   filesSort = filesSort.default;

   describe('injection/_dependencyWatcher/data/sort/filesSort', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should export correct sort functions', function() {
         assert.hasAllKeys(filesSort, ['size', 'name']);
         assert.equal(filesSort.size, size.default);
         assert.equal(filesSort.name, name.default);
      });
   });
});
