define([
   'DevtoolsTest/mockChrome',
   'Profiler/_Warning/Warning',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, Warning, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   Warning = Warning.default;

   describe('Profiler/_Warning/Warning', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Warning();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_toggleExpanded', function() {
         it('should toggle _expanded to false', function() {
            instance._expanded = true;

            instance._toggleExpanded();

            assert.isFalse(instance._expanded);
         });

         it('should toggle _expanded to true', function() {
            instance._expanded = false;

            instance._toggleExpanded();

            assert.isTrue(instance._expanded);
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Warning.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'caption',
               'content',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'caption', {
               required: true,
               args: [String]
            });
            testOption(optionTypes, 'content', {
               required: true,
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
