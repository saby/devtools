define(['injection/_dependencyWatcher/storage/module/filterHelpers'], function(
   filterHelpers
) {
   let sandbox;
   filterHelpers = filterHelpers.default;

   describe('injection/_dependencyWatcher/storage/module/filterHelpers', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

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
