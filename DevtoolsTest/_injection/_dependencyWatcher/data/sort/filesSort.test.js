define([
   'injection/_dependencyWatcher/data/sort/filesSort',
   'injection/_dependencyWatcher/data/sort/name'
], function(filesSort, name) {
   filesSort = filesSort.default;

   describe('injection/_dependencyWatcher/data/sort/filesSort', function() {
      it('should export correct sort functions', function() {
         assert.hasAllKeys(filesSort, ['name']);
         assert.equal(filesSort.name, name.default);
      });
   });
});
