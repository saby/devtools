define([
   'injection/_dependencyWatcher/data/filter/fileFilters',
   'injection/_dependencyWatcher/data/filter/getForName'
], function(fileFilters, getForName) {
   fileFilters = fileFilters.default;

   describe('injection/_dependencyWatcher/data/filter/fileFilters', function() {
      it('should export correct filters', function() {
         assert.hasAllKeys(fileFilters, ['name']);
         assert.equal(fileFilters.name, getForName.getForName);
      });
   });
});
