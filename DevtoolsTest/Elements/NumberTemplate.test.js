define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Pane/templates/NumberTemplate',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, NumberTemplate, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   NumberTemplate = NumberTemplate.default;

   describe('Elements/_Details/Pane/templates/NumberTemplate', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new NumberTemplate();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = NumberTemplate.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'value',
               'name',
               'key',
               'itemData'
            ]);
            testOption(optionTypes, 'value', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'name', {
               required: true,
               args: [String, Number]
            });
            testOption(optionTypes, 'key', {
               required: true,
               args: [String]
            });
            testOption(optionTypes, 'itemData', {
               args: [Object]
            });
         });
      });
   });
});
