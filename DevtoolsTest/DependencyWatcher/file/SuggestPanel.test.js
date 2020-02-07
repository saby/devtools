define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_file/SuggestPanel'
], function(mockChrome, SuggestPanel) {
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

            assert.deepEqual(instance._navigation, {
               source: 'page',
               view: 'infinity',
               sourceConfig: {
                  pageSize: 50,
                  page: 0,
                  mode: 'totalCount'
               }
            });
            assert.deepEqual(instance._sorting, [{ size: 'ASC' }]);
         });
      });
   });
});
