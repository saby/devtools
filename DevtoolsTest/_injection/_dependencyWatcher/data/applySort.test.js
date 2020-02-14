define(['injection/_dependencyWatcher/data/applySort'], function(applySort) {
   let sandbox;
   applySort = applySort.default;

   describe('injection/_dependencyWatcher/data/applySort', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

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
