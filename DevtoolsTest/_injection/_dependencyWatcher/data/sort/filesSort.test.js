define([
   'injection/_dependencyWatcher/data/sort/filesSort',
   'injection/_dependencyWatcher/data/sort/size',
   'injection/_dependencyWatcher/data/sort/name'
], function(filesSort, size, name) {
   filesSort = filesSort.default;

   describe('injection/_dependencyWatcher/data/sort/filesSort', function() {
      it('should export correct sort functions', function() {
         assert.hasAllKeys(filesSort, ['size', 'name']);
         assert.equal(filesSort.size, size.default);
         assert.equal(filesSort.name, name.default);
      });
   });
});
