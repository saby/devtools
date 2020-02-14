define(['injection/_dependencyWatcher/data/filter/json'], function(json) {
   let sandbox;
   json = json.json;

   describe('injection/_dependencyWatcher/data/filter/json', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

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
