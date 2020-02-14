define(['injection/_dependencyWatcher/storage/file/findInPath'], function(
   findInPath
) {
   let sandbox;
   findInPath = findInPath.default;

   describe('injection/_dependencyWatcher/storage/file/findInPath', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

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
