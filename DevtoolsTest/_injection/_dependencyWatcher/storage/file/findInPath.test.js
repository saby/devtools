define(['injection/_dependencyWatcher/storage/file/findInPath'], function(
   findInPath
) {
   findInPath = findInPath.default;

   describe('injection/_dependencyWatcher/storage/file/findInPath', function() {
      it('should return the correct file', function() {
         const files = [
            {
               path: 'resources/Types/entity.min.js'
            },
            {
               path: 'resources/Controls/Application.min.js'
            }
         ];
         const partOfPath = 'Controls/Application';

         assert.deepEqual(findInPath(partOfPath, files), {
            path: 'resources/Controls/Application.min.js'
         });
      });
   });
});
