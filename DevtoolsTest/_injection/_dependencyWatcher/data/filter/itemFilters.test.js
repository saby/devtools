define([
   'injection/_dependencyWatcher/data/filter/itemFilters'
], function(itemFilters) {
   itemFilters = itemFilters.default;

   describe('injection/_dependencyWatcher/data/filter/itemFilters', function() {
      it('should export correct filters', function() {
         assert.hasAllKeys(itemFilters, ['name', 'css', 'json', 'i18n', 'onlyDeprecated']);
      });
   });
});
