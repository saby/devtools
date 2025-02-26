define([
   'DevtoolsTest/mockChrome',
   'Profiler/_Overview/Overview',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, Overview, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   Overview = Overview.default;

   describe('Profiler/_Overview/Overview', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Overview();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Overview.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'mountedCount',
               'selfUpdatedCount',
               'parentUpdatedCount',
               'unchangedCount',
               'destroyedCount',
               'forceUpdatedCount',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'mountedCount', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'selfUpdatedCount', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'parentUpdatedCount', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'unchangedCount', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'destroyedCount', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'forceUpdatedCount', {
               required: true,
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
