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

      describe('constructor', function() {
         it('should calculate correct caption for empty array', function() {
            const instance = new ObjectTemplate({
               value: []
            });

            assert.equal(instance._caption, 'Array[0]');
         });

         it('should calculate correct caption for array with items', function() {
            const instance = new ObjectTemplate({
               value: [1, 2, 3]
            });

            assert.equal(instance._caption, 'Array[3]');
         });

         it('should calculate correct caption for empty object', function() {
            const instance = new ObjectTemplate({
               value: {}
            });

            assert.equal(instance._caption, 'Empty object');
         });

         it('should calculate correct caption for object with keys', function() {
            const instance = new ObjectTemplate({
               value: {
                  0: null
               }
            });

            assert.equal(instance._caption, 'Object');
         });

         it('should calculate correct caption for null', function() {
            const instance = new ObjectTemplate({
               value: null
            });

            assert.equal(instance._caption, 'null');
         });
      });

      describe('_beforeUpdate', function() {
         it('should not change state because the value did not change', function() {
            const value = [];
            const instance = new ObjectTemplate({
               value
            });
            instance.saveOptions({
               value
            });
            Object.freeze(instance);

            assert.doesNotThrow(() =>
               instance.__beforeUpdate({
                  value
               })
            );
         });

         it('should change caption because the value have changed', function() {
            const oldValue = [];
            const instance = new ObjectTemplate({
               value: oldValue
            });
            instance.saveOptions({
               value: oldValue
            });

            instance.__beforeUpdate({
               value: [1, 2, 3]
            });

            assert.equal(instance._caption, 'Array[3]');
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = ObjectTemplate.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'value',
               'name',
               'key',
               'itemData'
            ]);
            testOption(optionTypes, 'value', {
               required: true,
               args: [Object, null]
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
