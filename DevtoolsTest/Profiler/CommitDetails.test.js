define([
   'DevtoolsTest/mockChrome',
   'Profiler/_CommitDetails/CommitDetails',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, CommitDetails, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   CommitDetails = CommitDetails.default;

   describe('Profiler/_CommitDetails/CommitDetails', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new CommitDetails();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = CommitDetails.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'updateReason',
               'changedOptions',
               'changedAttributes',
               'changedReactiveProps',
               'logicParentId',
               'logicParentName',
               'warnings',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'updateReason', {
               required: true,
               args: [String]
            });
            testOption(optionTypes, 'changedOptions', {
               args: [Array]
            });
            testOption(optionTypes, 'changedAttributes', {
               args: [Array]
            });
            testOption(optionTypes, 'changedReactiveProps', {
               args: [Array]
            });
            testOption(optionTypes, 'logicParentId', {
               args: [Number]
            });
            testOption(optionTypes, 'logicParentName', {
               args: [String]
            });
            testOption(optionTypes, 'warnings', {
               args: [Array]
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
