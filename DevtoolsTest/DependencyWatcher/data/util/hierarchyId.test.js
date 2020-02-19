define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/util/hierarchyId'
], function(mockChrome, hierarchyId) {
   describe('DependencyWatcher/_data/util/hierarchyId', function() {
      it('create', function() {
         assert.equal(hierarchyId.create(1), '1;');
         assert.equal(hierarchyId.create(1, 3), '1;3');
      });

      it('split', function() {
         assert.deepEqual(hierarchyId.split('1;'), [1]);
         assert.deepEqual(hierarchyId.split('1;3;'), [1, 3]);
      });
   });
});
