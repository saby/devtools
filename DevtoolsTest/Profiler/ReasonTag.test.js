define(['DevtoolsTest/mockChrome', 'Profiler/_ReasonTag/ReasonTag'], function(
   mockChrome,
   ReasonTag
) {
   let sandbox;
   let instance;
   ReasonTag = ReasonTag.default;

   beforeEach(function() {
      sandbox = sinon.createSandbox();
      instance = new ReasonTag();
   });

   afterEach(function() {
      sandbox.restore();
   });

   describe('Profiler/_ReasonTag/ReasonTag', function() {
      describe('_getColor', function() {
         it('should return color for mounted', function() {
            assert.equal(instance._getColor('mounted'), '#ffab66');
         });
         it('should return color for forceUpdated', function() {
            assert.equal(instance._getColor('forceUpdated'), '#baf7c8');
         });
         it('should return color for selfUpdated', function() {
            assert.equal(instance._getColor('selfUpdated'), '#e6d174');
         });
         it('should return color for parentUpdated', function() {
            assert.equal(instance._getColor('parentUpdated'), '#b3e6e6');
         });
         it('should return color for unchanged', function() {
            assert.equal(instance._getColor('unchanged'), '#e2e2e2');
         });
         it('should return color for destroyed', function() {
            assert.equal(instance._getColor('destroyed'), '#000');
         });
      });
   });
});
