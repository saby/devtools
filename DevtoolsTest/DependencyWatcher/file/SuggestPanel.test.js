define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_file/SuggestPanel',
   'DependencyWatcher/_file/navigation'
], function(mockChrome, SuggestPanel, navigation) {
   let sandbox;
   SuggestPanel = SuggestPanel.SuggestPanel;

   describe('DependencyWatcher/_file/SuggestPanel', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should set correct default state', function() {
            const instance = new SuggestPanel();

            assert.deepEqual(instance._navigation, navigation.navigation);
            assert.deepEqual(instance._sorting, [{ size: 'ASC' }]);
         });
      });
   });
});
