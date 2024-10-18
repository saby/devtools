define(['injection/_dependencyWatcher/data/filter/getForName'], function(
   getForName
) {
   getForName = getForName.getForName;

   describe('injection/_dependencyWatcher/data/filter/getForName', function() {
      it('should return true if name of an item includes passed name (ignoring case)', function() {
         assert.isFalse(getForName('Types')({
            name: 'Application.min.js'
         }));
         assert.isTrue(getForName('App')({
            name: 'Application.min.js'
         }));
         assert.isTrue(getForName('app')({
            name: 'Application.min.js'
         }));
      });
   });
});
