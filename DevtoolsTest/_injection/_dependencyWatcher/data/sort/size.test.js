define(['injection/_dependencyWatcher/data/sort/size'], function(size) {
   let sandbox;
   size = size.default;

   describe('injection/_dependencyWatcher/data/sort/size', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should correctly sort by size', function() {
         assert.equal(
            size({ size: 10 }, { size: 10 }),
            0
         );
         assert.isAbove(
            size({ size: 10 }, { size: 5 }),
            0
         );
         assert.isBelow(
            size({ size: 5 }, { size: 10 }),
            0
         );
      });
   });
});
