define([
   'DevtoolsTest/mockChrome',
   'Profiler/_CommitDetails/ReactiveProp',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function (mockChrome, ReactiveProp, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   ReactiveProp = ReactiveProp.default;

   describe('Profiler/_CommitDetails/ReactiveProp', function () {
      beforeEach(function () {
         sandbox = sinon.createSandbox();
         instance = new ReactiveProp();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('_openFile', function () {
         it('should call openResource with passed url and line number', function () {
            sandbox.stub(chrome.devtools.panels, 'openResource');
            const url = 'testUrl';
            const lineNumber = 10;

            instance._openFile(
               {},
               {
                  url,
                  lineNumber
               }
            );

            sinon.assert.calledWithExactly(
               chrome.devtools.panels.openResource,
               url,
               lineNumber
            );
         });

         it('should change invalid line number to 0 and call openResource', function () {
            sandbox.stub(chrome.devtools.panels, 'openResource');
            const url = 'testUrl';
            const lineNumber = -1;

            instance._openFile(
               {},
               {
                  url,
                  lineNumber
               }
            );

            sinon.assert.calledWithExactly(
               chrome.devtools.panels.openResource,
               url,
               0
            );
         });
      });

      describe('getOptionTypes', function () {
         it('should call entity:Descriptor with correct values', function () {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = ReactiveProp.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'reactiveProp',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'reactiveProp', {
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
