define(['injection/_dependencyWatcher/storage/module/filterHelpers'], function(
   filterHelpers
) {
   filterHelpers = filterHelpers.default;

   describe('injection/_dependencyWatcher/storage/module/filterHelpers', function() {
      it('should correctly identify helpers', function() {
         const HELPERS_MODULES = ['module', 'require', 'exports', 'tslib'];

         HELPERS_MODULES.forEach((helper) => {
            assert.isFalse(filterHelpers(helper));
         });

         assert.isTrue(filterHelpers('requireWrapper'));
         assert.isTrue(filterHelpers('notAHelper'));
      });
   });
});
