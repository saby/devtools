define([
   'injection/_dependencyWatcher/data/sort/itemsSort',
   'injection/_dependencyWatcher/data/sort/size',
   'injection/_dependencyWatcher/data/sort/name',
   'injection/_dependencyWatcher/data/sort/used',
   'injection/_dependencyWatcher/data/sort/fileName'
], function(itemsSort, size, name, used, fileName) {
   let sandbox;
   itemsSort = itemsSort.default;

   describe('injection/_dependencyWatcher/data/sort/itemsSort', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should export correct sort functions', function() {
         assert.hasAllKeys(itemsSort, ['size', 'name', 'used', 'fileName']);
         assert.equal(itemsSort.size, size.default);
         assert.equal(itemsSort.name, name.default);
         assert.equal(itemsSort.used, used.default);
         assert.equal(itemsSort.fileName, fileName.default);
      });
   });
});
