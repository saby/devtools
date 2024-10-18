define([
   'DevtoolsTest/mockChrome',
   'Profiler/_Flamegraph/Utils'
], function(
   mockChrome,
   Utils
) {
   describe('Profiler/_Flamegraph/Utils', function() {
      describe('getWidth', function() {
         const getWidth = Utils.getWidth;
         it('returns correct value', function() {
            assert.equal(getWidth(10, 100, 500), 50);
         });
      });
   });
});
