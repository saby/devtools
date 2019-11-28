define([
   'DevtoolsTest/mockChrome',
   'Profiler/_Flamegraph/Utils'
], function(
   mockChrome,
   Utils
) {
   let sandbox;

   beforeEach(function() {
      sandbox = sinon.createSandbox();
   });

   afterEach(function() {
      sandbox.restore();
   });

   describe('Profiler/_Flamegraph/Utils', function() {
      describe('getWidth', function() {
         const getWidth = Utils.getWidth;
         it('returns correct value', function() {
            assert.equal(getWidth(10, 100, 500), 50);
         });
      });
   });
});
