define(['injection/_dependencyWatcher/storage/module/isDeprecated'], function(
   isDeprecated
) {
   isDeprecated = isDeprecated.default;

   describe('injection/_dependencyWatcher/storage/module/isDeprecated', function() {
      it('should correctly identify deprecated modules', function() {
         assert.isTrue(isDeprecated('Deprecated/Input'));
         assert.isTrue(isDeprecated('html!Controls/Application'));
         assert.isFalse(isDeprecated('Controls/Application'));
      });
   });
});
