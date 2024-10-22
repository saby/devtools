define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Details',
   'Elements/_store/Store',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, Details, Store, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   Details = Details.default;
   Store = Store.default;

   describe('Elements/_Details/Details', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Details();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_viewFunctionSource', function() {
         it('should fire the viewFunctionSource event and inspect function after a timeout', function() {
            const store = {
               dispatch: sandbox.stub()
            };
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub()
               }
            });
            const clock = sinon.useFakeTimers();
            const path = ['functionName', 'options'];
            instance.saveOptions({
               id: '1',
               store
            });

            instance._viewFunctionSource({}, path);

            assert.isTrue(
               store.dispatch.calledOnceWithExactly('viewFunctionSource', {
                  id: '1',
                  path
               })
            );
            assert.isTrue(chrome.devtools.inspectedWindow.eval.notCalled);

            clock.tick(100);

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWithExactly(
                  'inspect(window.__WASABY_DEV_HOOK__.__function)'
               )
            );

            clock.restore();
         });
      });

      describe('_viewConstructor', function() {
         it('should fire the viewConstructor event and inspect constructor after a timeout', function() {
            const store = {
               dispatch: sandbox.stub()
            };
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub()
               }
            });
            const clock = sinon.useFakeTimers();
            instance.saveOptions({
               id: '1',
               store
            });

            instance._viewConstructor();

            assert.isTrue(
               store.dispatch.calledOnceWithExactly('viewConstructor', '1')
            );
            assert.isTrue(chrome.devtools.inspectedWindow.eval.notCalled);

            clock.tick(100);

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWithExactly(
                  'inspect(window.__WASABY_DEV_HOOK__.__constructor)'
               )
            );

            clock.restore();
         });
      });

      describe('_viewContainer', function() {
         it('should fire the viewContainer event and inspect container after a timeout', function() {
            const store = {
               dispatch: sandbox.stub()
            };
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub()
               }
            });
            const clock = sinon.useFakeTimers();
            instance.saveOptions({
               id: '1',
               store
            });

            instance._viewContainer();

            assert.isTrue(
               store.dispatch.calledOnceWithExactly('viewContainer', '1')
            );
            assert.isTrue(chrome.devtools.inspectedWindow.eval.notCalled);

            clock.tick(100);

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWithExactly(
                  'inspect(window.__WASABY_DEV_HOOK__.__container)'
               )
            );

            clock.restore();
         });
      });

      describe('_storeAsGlobal', function() {
         it('should fire the storeAsGlobal event', function() {
            const store = {
               dispatch: sandbox.stub()
            };
            const path = ['items', 'options'];
            instance.saveOptions({
               id: '1',
               store
            });

            instance._storeAsGlobal({}, path);

            assert.isTrue(
               store.dispatch.calledOnceWithExactly('storeAsGlobal', {
                  id: '1',
                  path
               })
            );
         });
      });

      describe('_viewTemplate', function() {
         it('should fire the viewTemplate event and inspect container after a timeout', function() {
            const store = {
               dispatch: sandbox.stub()
            };
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub()
               }
            });
            const clock = sinon.useFakeTimers();
            instance.saveOptions({
               id: '1',
               store
            });

            instance._viewTemplate();

            assert.isTrue(
               store.dispatch.calledOnceWithExactly('viewTemplate', '1')
            );
            assert.isTrue(chrome.devtools.inspectedWindow.eval.notCalled);

            clock.tick(100);

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWithExactly(
                  'inspect(window.__WASABY_DEV_HOOK__.__template)'
               )
            );

            clock.restore();
         });
      });

      describe('_forwardExpanded', function() {
         it('should fire the expandedChanged event', function() {
            const stub = sandbox.stub(instance, '_notify');

            instance._forwardExpanded({}, 'optionsExpanded', true);

            assert.isTrue(
               stub.calledOnceWithExactly('expandedChanged', [
                  'optionsExpanded',
                  true
               ])
            );
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Details.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'store',
               'id',
               'isControl',
               'optionsExpanded',
               'stateExpanded',
               'eventsExpanded',
               'attributesExpanded',
               'options',
               'changedOptions',
               'attributes',
               'changedAttributes',
               'events',
               'state',
               'changedState',
               'logicParentName',
               'elementsWithBreakpoints',
               'eventWithBreakpoint',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'store', {
               required: true,
               args: [Store]
            });
            testOption(optionTypes, 'id', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'isControl', {
               required: true,
               args: [Boolean]
            });
            testOption(optionTypes, 'optionsExpanded', {
               required: true,
               args: [Boolean]
            });
            testOption(optionTypes, 'stateExpanded', {
               required: true,
               args: [Boolean]
            });
            testOption(optionTypes, 'eventsExpanded', {
               required: true,
               args: [Boolean]
            });
            testOption(optionTypes, 'attributesExpanded', {
               required: true,
               args: [Boolean]
            });
            testOption(optionTypes, 'options', {
               args: [Object]
            });
            testOption(optionTypes, 'changedOptions', {
               args: [Object]
            });
            testOption(optionTypes, 'attributes', {
               args: [Object]
            });
            testOption(optionTypes, 'changedAttributes', {
               args: [Object]
            });
            testOption(optionTypes, 'events', {
               args: [Object]
            });
            testOption(optionTypes, 'state', {
               args: [Object]
            });
            testOption(optionTypes, 'changedState', {
               args: [Object]
            });
            testOption(optionTypes, 'logicParentName', {
               args: [String]
            });
            testOption(optionTypes, 'elementsWithBreakpoints', {
               args: [Set]
            });
            testOption(optionTypes, 'eventWithBreakpoint', {
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
