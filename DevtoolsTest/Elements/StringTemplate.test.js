define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Pane/templates/StringTemplate',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, StringTemplate, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   StringTemplate = StringTemplate.default;

   describe('Elements/_Details/Pane/templates/StringTemplate', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new StringTemplate();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_viewFunctionSource', function() {
         it('should fire viewFunctionSource event', function() {
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               key: '0---1'
            });

            instance._viewFunctionSource();

            assert.isTrue(
               stub.calledOnceWithExactly('viewFunctionSource', [['1', '0']], {
                  bubbling: true
               })
            );
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = StringTemplate.getOptionTypes();

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
