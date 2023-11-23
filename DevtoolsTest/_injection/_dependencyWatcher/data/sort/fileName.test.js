define(['injection/_dependencyWatcher/data/sort/fileName'], function(fileName) {
   fileName = fileName.default;

   describe('injection/_dependencyWatcher/data/sort/fileName', function() {
      it('should correctly sort by fileName', function() {
         assert.equal(
            fileName({ fileName: 'Application' }, { fileName: 'Application' }),
            0
         );
         assert.isAbove(
            fileName({ fileName: 'Bpplication' }, { fileName: 'Application' }),
            0
         );
         assert.isBelow(
            fileName({ fileName: 'Application' }, { fileName: 'Bpplication' }),
            0
         );
      });
   });
});
