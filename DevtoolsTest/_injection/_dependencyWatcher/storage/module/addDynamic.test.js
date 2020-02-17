define(['injection/_dependencyWatcher/storage/module/addDynamic'], function(
   addDynamic
) {
   addDynamic = addDynamic.default;

   describe('injection/_dependencyWatcher/storage/module/addDynamic', function() {
      it('should update dynamic dependencies of modules and return updated modules', function() {
         const existingStaticDependency = {};
         const existingDynamicDependency = {};
         const newDependency = {
            dependent: {
               static: new Set(),
               dynamic: new Set()
            }
         };
         const module = {
            dependencies: {
               static: new Set([existingStaticDependency]),
               dynamic: new Set([existingDynamicDependency])
            }
         };
         const dependencies = [existingStaticDependency, newDependency];

         const result = addDynamic(module, dependencies);

         assert.deepEqual(result, [newDependency]);
         assert.deepEqual(
            module.dependencies.static,
            new Set([existingStaticDependency])
         );
         assert.deepEqual(
            module.dependencies.dynamic,
            new Set([existingDynamicDependency, newDependency])
         );
         assert.deepEqual(newDependency.dependent.dynamic, new Set([module]));
      });
   });
});
