define(['injection/_dependencyWatcher/storage/module/isDeprecated'], function(
   isDeprecated
) {
   let sandbox;
   isDeprecated = isDeprecated.default;

   describe('injection/_dependencyWatcher/storage/module/isDeprecated', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should correctly identify deprecated modules', function() {
         assert.isTrue(isDeprecated('Deprecated/Input'));
         assert.isTrue(isDeprecated('html!Controls/Application'));
         assert.isFalse(isDeprecated('Controls/Application'));
      });
   });
});
