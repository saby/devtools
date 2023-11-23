define(['injection/_dependencyWatcher/storage/module/addStatic'], function(
   addStatic
) {
   addStatic = addStatic.default;

   describe('injection/_dependencyWatcher/storage/module/addStatic', function() {
      it('should update static dependencies of modules and return updated modules', function() {
         const existingStaticDependency = {};
         const newDependency = {
            dependent: {
               static: new Set()
            }
         };
         const module = {
            dependencies: {
               static: new Set([existingStaticDependency])
            }
         };
         const dependencies = [existingStaticDependency, newDependency];

         const result = addStatic(module, dependencies);

         assert.deepEqual(result, [newDependency]);
         assert.deepEqual(
            module.dependencies.static,
            new Set([existingStaticDependency, newDependency])
         );
         assert.deepEqual(
            newDependency.dependent.static,
            new Set([module])
         );
      });
   });
});
