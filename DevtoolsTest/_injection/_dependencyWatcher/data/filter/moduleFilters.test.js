define(['injection/_dependencyWatcher/data/filter/moduleFilters'], function(
   moduleFilters
) {
   let sandbox;
   moduleFilters = moduleFilters.default;

   describe('injection/_dependencyWatcher/data/filter/moduleFilters', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

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
