define([
   'DevtoolsTest/mockChrome',
   'Profiler/_Flamegraph/Utils'
], function(
   mockChrome,
   Utils
) {
   let sandbox;

   describe('Profiler/_Flamegraph/Utils', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('getWidth', function() {
         const getWidth = Utils.getWidth;
         it('returns correct value', function() {
            assert.equal(getWidth(10, 100, 500), 50);
         });
      });
   });
});
