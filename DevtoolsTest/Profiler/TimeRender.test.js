define([
   'DevtoolsTest/mockChrome',
   'Profiler/_TimeRender/TimeRender',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, TimeRender, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   TimeRender = TimeRender.default;

   beforeEach(function() {
      sandbox = sinon.createSandbox();
      instance = new TimeRender();
   });

   afterEach(function() {
      sandbox.restore();
   });

   describe('Profiler/_TimeRender/TimeRender', function() {
      describe('_beforeMount', function() {
         it('should properly format time higher than a second', function() {
            instance._beforeMount({
               value: 1100
            });

            assert.equal(instance._formattedValue, '1.10s');
         });
         it('should properly format time less than a second', function() {
            instance._beforeMount({
               value: 999
            });

            assert.equal(instance._formattedValue, '999.00ms');
         });
         it('should properly format time equal to a second', function() {
            instance._beforeMount({
               value: 1000
            });

            assert.equal(instance._formattedValue, '1.00s');
         });
      });

      describe('_beforeMount', function() {
         it('should not change formattedValue', function() {
            instance.saveOptions({
               value: 1100
            });
            Object.defineProperty(instance, '_formattedValue', {
               writable: false
            });

            assert.doesNotThrow(() =>
               instance._beforeUpdate({
                  value: 1100
               })
            );
         });
         it('should change formattedValue', function() {
            instance.saveOptions({
               value: 1100
            });
            instance._beforeUpdate({
               value: 1200
            });

            assert.equal(instance._formattedValue, '1.20s');
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = TimeRender.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'value',
               'barColor',
               'length',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'value', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'barColor', {
               required: true,
               args: [String]
            });
            testOption(optionTypes, 'length', {
               args: [Number]
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
