define([
   'injection/_dependencyWatcher/data/filter/itemFilters'
], function(itemFilters) {
   let sandbox;
   itemFilters = itemFilters.default;

   describe('injection/_dependencyWatcher/data/filter/itemFilters', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should export correct filters', function() {
         assert.hasAllKeys(itemFilters, ['name', 'css', 'json', 'i18n', 'onlyDeprecated']);
      });
   });
});
