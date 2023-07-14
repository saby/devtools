define(['injection/_dependencyWatcher/data/sort/used'], function(used) {
   used = used.default;

   describe('injection/_dependencyWatcher/data/sort/used', function() {
      it('should correctly sort by usage', function() {
         assert.equal(
            used({ initialized: false, defined: false }, { initialized: false, defined: false }),
            0
         );

         assert.isAbove(
            used({ initialized: true, defined: false }, { initialized: false, defined: false }),
            0
         );

         assert.isBelow(
            used({ initialized: false, defined: true }, { initialized: false, defined: false }),
            0
         );

         assert.isBelow(
            used({ initialized: false, defined: false }, { initialized: true, defined: false }),
            0
         );

         assert.isAbove(
            used({ initialized: false, defined: false }, { initialized: false, defined: true }),
            0
         );

         assert.isAbove(
            used({ initialized: true, defined: true }, { initialized: false, defined: false }),
            0
         );

         assert.equal(
            used({ initialized: true, defined: false }, { initialized: true, defined: false }),
            0
         );

         assert.isAbove(
            used({ initialized: true, defined: false }, { initialized: false, defined: true }),
            0
         );

         assert.isBelow(
            used({ initialized: true, defined: true }, { initialized: true, defined: false }),
            0
         );

         assert.isAbove(
            used({ initialized: true, defined: true }, { initialized: false, defined: true }),
            0
         );

         assert.isBelow(
            used({ initialized: false, defined: true }, { initialized: true, defined: true }),
            0
         );

         assert.equal(
            used({ initialized: true, defined: true }, { initialized: true, defined: true }),
            0
         );
      });
   });
});
