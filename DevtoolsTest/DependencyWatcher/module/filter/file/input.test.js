define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_module/filter/file/input'
], function(mockChrome, Input) {
   let sandbox;
   let instance;
   Input = Input.default;

   describe('DependencyWatcher/_module/filter/file/input', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Input();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_onValueChanged', function() {
         it('should stop propagation of the event', function() {
            const event = {
               stopPropagation: sandbox.stub()
            };

            instance._onValueChanged(event);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
         });
      });
   });
});
