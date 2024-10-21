define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/list/hasChildren'
], function(mockChrome, hasChildren) {
   hasChildren = hasChildren.hasChildren;

   describe('DependencyWatcher/_data/source/list/hasChildren', function() {
      it('hasChildren', function() {
         assert.isNull(hasChildren({
            dynamic: [],
            static: []
         }));

         assert.isTrue(hasChildren({
            dynamic: [123, 456],
            static: []
         }));

         assert.isTrue(hasChildren({
            dynamic: [],
            static: [123, 456]
         }));

         assert.isTrue(hasChildren({
            dynamic: [123, 456],
            static: [123, 456]
         }));
      });
   });
});
