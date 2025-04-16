define([
   'injection/_dependencyWatcher/data/sort/itemsSort',
   'injection/_dependencyWatcher/data/sort/name',
   'injection/_dependencyWatcher/data/sort/used',
   'injection/_dependencyWatcher/data/sort/fileName'
], function(itemsSort, name, used, fileName) {
   itemsSort = itemsSort.default;

   describe('injection/_dependencyWatcher/data/sort/itemsSort', function() {
      it('should export correct sort functions', function() {
         assert.hasAllKeys(itemsSort, ['name', 'used', 'fileName']);
         assert.equal(itemsSort.name, name.default);
         assert.equal(itemsSort.used, used.default);
         assert.equal(itemsSort.fileName, fileName.default);
      });
   });
});
