define(['injection/_dependencyWatcher/data/filter/dependentOnFiles'], function(
   dependentOnFiles
) {
   dependentOnFiles = dependentOnFiles.dependentOnFiles;

   describe('injection/_dependencyWatcher/data/filter/dependentOnFiles', function() {
      it("should return true if keys don't include fileId but include fileId of some of its dependencies", function() {
         assert.isFalse(
            dependentOnFiles([0, 1])({
               fileId: 1
            })
         );

         assert.isFalse(
            dependentOnFiles([0, 1])({
               fileId: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               }
            })
         );

         assert.isTrue(
            dependentOnFiles([0, 1])({
               fileId: 2,
               dependencies: {
                  static: new Set([
                     {
                        fileId: 1
                     }
                  ]),
                  dynamic: new Set()
               }
            })
         );

         assert.isTrue(
            dependentOnFiles([0, 1])({
               fileId: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set([
                     {
                        fileId: 1
                     }
                  ])
               }
            })
         );
      });
   });
});
