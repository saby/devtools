define(['injection/_dependencyWatcher/data/applyPaging'], function(applyPaging) {
   applyPaging = applyPaging.applyPaging;

   describe('injection/_dependencyWatcher/data/applyPaging', function() {
      it('should return slice of items based on limit and offset', function() {
         const items = [0, 1, 2, 3, 4, 5];

         assert.deepEqual(applyPaging(items, 0, 2), {
            data: [0, 1],
            hasMore: true
         });

         assert.deepEqual(applyPaging(items, 2, 2), {
            data: [2, 3],
            hasMore: true
         });

         assert.deepEqual(applyPaging(items, 2, 100), {
            data: [2, 3, 4, 5],
            hasMore: false
         });
      });

      it('should return slice of items starting from offset', function() {
         const items = [0, 1, 2, 3, 4, 5];

         assert.deepEqual(applyPaging(items, 0), {
            data: [0, 1, 2, 3, 4, 5],
            hasMore: false
         });

         assert.deepEqual(applyPaging(items, 2), {
            data: [2, 3, 4, 5],
            hasMore: false
         });
      });
   });
});
