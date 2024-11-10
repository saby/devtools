define(['injection/_dependencyWatcher/data/filter/json'], function(json) {
   json = json.json;

   describe('injection/_dependencyWatcher/data/filter/json', function() {
      it("should return true if item's name neither starts with json! nor ends with .json", function() {
         assert.isFalse(
            json({
               name: 'json!Controls/Application'
            })
         );
         assert.isFalse(
            json({
               name: 'Application.json'
            })
         );
         assert.isTrue(
            json({
               name: 'Controls/Application'
            })
         );
      });
   });
});
