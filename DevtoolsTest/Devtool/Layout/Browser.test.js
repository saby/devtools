define([
   'Devtool/Layout/Browser',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(Browser, entityLib, optionTypesMocks) {
   let instance;
   let sandbox;
   Browser = Browser.default;

   describe('Devtool/Layout/Browser', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      beforeEach(function() {
         instance = new Browser();
      });

      afterEach(function() {
         instance = undefined;
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Browser.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'content',
               'headTemplate',
               'theme',
               'readOnly'
            ]);
            testOption(optionTypes, 'content', {
               required: true,
               args: [Object]
            });
            testOption(optionTypes, 'headTemplate', {
               args: [Object]
            });
            testOption(optionTypes, 'theme', {
               args: [String]
            });
            testOption(optionTypes, 'readOnly', {
               args: [Boolean]
            });
         });
      });
   });
});
