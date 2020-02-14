define(['injection/_dependencyWatcher/data/filter/getDeprecated'], function(
   getDeprecated
) {
   let sandbox;
   getDeprecated = getDeprecated.getDeprecated;

   describe('injection/_dependencyWatcher/data/filter/getDeprecated', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it("should return true when filterValue is false or item's isDeprecated field is true", function() {
         assert.isFalse(
            getDeprecated(true)({
               isDeprecated: false
            })
         );
         assert.isTrue(
            getDeprecated(true)({
               isDeprecated: true
            })
         );
         assert.isTrue(
            getDeprecated(false)({
               isDeprecated: false
            })
         );
      });
   });
});
