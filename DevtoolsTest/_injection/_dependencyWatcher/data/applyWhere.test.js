define(['injection/_dependencyWatcher/data/applyWhere'], function(applyWhere) {
   let sandbox;
   applyWhere = applyWhere.default;

   describe('injection/_dependencyWatcher/data/applyWhere', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should correctly filter items', function() {
         const items = Object.freeze([
            {
               name: 'Application'
            },
            {
               name: 'Types'
            },
            {
               name: 'application'
            }
         ]);
         const filterFunctionGetters = {
            name: (name) => {
               const _name = name.toLowerCase();
               return (item) => {
                  return item.name.toLowerCase().includes(_name);
               };
            }
         };

         assert.deepEqual(applyWhere(items, {}, filterFunctionGetters), items);
         assert.deepEqual(
            applyWhere(
               items,
               {
                  onlyDeprecated: true
               },
               filterFunctionGetters
            ),
            items
         );
         assert.deepEqual(
            applyWhere(
               items,
               {
                  name: 'App'
               },
               filterFunctionGetters
            ),
            [
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
