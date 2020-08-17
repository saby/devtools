define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Pane/templates/ObjectTemplate',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, ObjectTemplate, entityLib, optionTypesMocks) {
   let sandbox;
   ObjectTemplate = ObjectTemplate.default;

   describe('Elements/_Details/Pane/templates/ObjectTemplate', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = ObjectTemplate.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'caption',
               'name',
               'key',
               'itemData',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'caption', {
               required: true,
               args: [String]
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
            testOption(optionTypes, 'readOnly', {
               args: [Boolean]
            });
            testOption(optionTypes, 'theme', {
               args: [String]
            });
         });
      });
   });
});
