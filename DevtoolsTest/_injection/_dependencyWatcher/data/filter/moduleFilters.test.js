define(['injection/_dependencyWatcher/data/filter/moduleFilters'], function(
   moduleFilters
) {
   moduleFilters = moduleFilters.default;

   describe('injection/_dependencyWatcher/data/filter/moduleFilters', function() {
      it('should export correct filters', function() {
         assert.hasAllKeys(moduleFilters, [
            'name',
            'css',
            'json',
            'i18n',
            'dependentOnFiles',
            'onlyDeprecated'
         ]);
      });
   });
});
