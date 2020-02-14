define([
   'injection/_dependencyWatcher/data/sort/modulesSort',
   'injection/_dependencyWatcher/data/sort/name',
   'injection/_dependencyWatcher/data/sort/used'
], function(modulesSort, name, used) {
   let sandbox;
   modulesSort = modulesSort.default;

   describe('injection/_dependencyWatcher/data/sort/modulesSort', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should export correct sort functions', function() {
         assert.hasAllKeys(modulesSort, ['name', 'used']);
         assert.equal(modulesSort.name, name.default);
         assert.equal(modulesSort.used, used.default);
      });
   });
});
