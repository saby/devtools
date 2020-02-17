define(['injection/_dependencyWatcher/data/applySort'], function(applySort) {
   applySort = applySort.default;

   describe('injection/_dependencyWatcher/data/applySort', function() {
      it('should correctly sort items', function() {
         const items = Object.freeze([
            {
               name: 'Application'
            },
            {
               name: 'Bpplication'
            },
            {
               name: 'application'
            }
         ]);
         const allSortFunctions = {
            name: (first, second) =>
               first.name.localeCompare(second.name, undefined, {
                  sensitivity: 'base'
               })
         };

         assert.deepEqual(applySort(items, {}, allSortFunctions), items);

         assert.deepEqual(
            applySort(
               items,
               {
                  name: true
               },
               allSortFunctions
            ),
            [
               {
                  name: 'Application'
               },
               {
                  name: 'application'
               },
               {
                  name: 'Bpplication'
               }
            ]
         );

         assert.deepEqual(
            applySort(
               items,
               {
                  name: false
               },
               allSortFunctions
            ),
            [
               {
                  name: 'Bpplication'
               },
               {
                  name: 'Application'
               },
               {
                  name: 'application'
               }
            ]
         );
      });
   });
});
