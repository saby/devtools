define([
   'DevtoolsTest/mockChrome',
   'Profiler/_ReasonTag/ReasonTag',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, ReasonTag, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   ReasonTag = ReasonTag.default;

   describe('Profiler/_ReasonTag/ReasonTag', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new ReasonTag();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_getColor', function() {
         it('should return color for mounted', function() {
            assert.equal(
               instance._getClass('mounted'),
               'devtools-reason_background_mounted'
            );
         });
         it('should return color for forceUpdated', function() {
            assert.equal(
               instance._getClass('forceUpdated'),
               'devtools-reason_background_forceUpdated'
            );
         });
         it('should return color for selfUpdated', function() {
            assert.equal(
               instance._getClass('selfUpdated'),
               'devtools-reason_background_selfUpdated'
            );
         });
         it('should return color for parentUpdated', function() {
            assert.equal(
               instance._getClass('parentUpdated'),
               'devtools-reason_background_parentUpdated'
            );
         });
         it('should return color for unchanged', function() {
            assert.equal(
               instance._getClass('unchanged'),
               'devtools-reason_background_unchanged'
            );
         });
         it('should return color for destroyed', function() {
            assert.equal(
               instance._getClass('destroyed'),
               'devtools-reason_background_destroyed'
            );
         });
      });

      it('getDefaultOptions', function() {
         assert.deepEqual(ReasonTag.getDefaultOptions(), {
            updateReason: 'unchanged'
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = ReasonTag.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'updateReason',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'updateReason', {
               oneOf: [
                  'mounted',
                  'selfUpdated',
                  'parentUpdated',
                  'unchanged',
                  'destroyed',
                  'forceUpdated'
               ],
               args: [String]
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
