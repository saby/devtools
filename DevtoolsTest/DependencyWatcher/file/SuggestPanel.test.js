define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_file/SuggestPanel'
], function(mockChrome, SuggestPanel) {
   SuggestPanel = SuggestPanel.SuggestPanel;

   describe('DependencyWatcher/_file/SuggestPanel', function() {
      describe('constructor', function() {
         it('should set correct default state', function() {
            const instance = new SuggestPanel();

            assert.deepEqual(instance._navigation, {
               source: 'page',
               view: 'infinity',
               sourceConfig: {
                  pageSize: 50,
                  page: 0
               }
            });
         });
      });
   });
});
