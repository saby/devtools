define(['injection/_dependencyWatcher/data/filter/css'], function(css) {
   css = css.css;

   describe('injection/_dependencyWatcher/data/filter/css', function() {
      it('should return true only when a name does not start with css', function() {
         assert.isTrue(
            css({
               name: 'Controls/Application'
            })
         );
         assert.isFalse(
            css({
               name: 'css!Controls/Application'
            })
         );
      });
   });
});
