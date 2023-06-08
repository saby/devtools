define(['injection/_dependencyWatcher/data/filter/ignoreWrap'], function(
   ignoreWrap
) {
   let sandbox;
   ignoreWrap = ignoreWrap.default;

   describe('injection/_dependencyWatcher/data/filter/ignoreWrap', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should return function that always returns true if called with true, otherwise should return wrapped function', function() {
         const wrappedFunction = sandbox.stub().returns(false);

         const result = ignoreWrap(wrappedFunction)(true);

         assert.notEqual(result, wrappedFunction);
         assert.isTrue(result());

         assert.equal(ignoreWrap(wrappedFunction)(false), wrappedFunction);
      });
   });
});
