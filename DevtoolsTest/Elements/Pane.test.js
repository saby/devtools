define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Pane/Pane',
   'Elements/_Details/Pane/Source',
   'wml!Elements/_Details/Pane/columnTemplate',
   'Types/collection',
   'Elements/_utils/highlightUpdate',
   'Elements/_utils/hydrate',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks',
   'Elements/_store/Store'
], function (
   mockChrome,
   Pane,
   PaneSource,
   columnTemplate,
   collectionLib,
   highlightUpdate,
   hydrate,
   entityLib,
   optionTypesMocks,
   Store
) {
   let sandbox;
   let instance;
   Pane = Pane.default;
   PaneSource = PaneSource.Source;
   Store = Store.default;

   describe('Elements/_Details/Pane/Pane', function () {
      beforeEach(function () {
         sandbox = sinon.createSandbox();
         instance = new Pane();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('_beforeMount', function () {
         it('isControl: false, should correctly init state', function () {
            const options = {
               data: {
                  text: 'test',
                  items: {
                     [hydrate.INSPECTED_ITEM_META.type]: 'array',
                     [hydrate.INSPECTED_ITEM_META.expandable]: true,
                     [hydrate.INSPECTED_ITEM_META.caption]: 'Array[3]'
                  }
               },
               isControl: false,
               caption: 'options',
               controlId: 0
            };

            instance._beforeMount(options);

            assert.instanceOf(instance._source, PaneSource);
            assert.deepEqual(instance._source._data, [
               {
                  key: 'text',
                  caption: 'test',
                  name: 'text',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:StringTemplate'
               },
               {
                  key: 'items',
                  caption: 'Array[3]',
                  name: 'items',
                  parent: null,
                  hasChildren: true,
                  template: 'Elements/elements:ObjectTemplate'
               }
            ]);
            assert.deepEqual(instance._columns, [
               {
                  template: columnTemplate
               }
            ]);
            // every action has a handler that gets bound inside _beforeMount so we can't test deep equality here
            assert.equal(instance._itemActions.length, 3);
            assert.isFunction(instance._visibilityCallback);
         });
      });

      describe('_beforeUpdate', function () {
         it('nothing changed, should not update state', function () {
            const options = {
               data: {
                  text: 'test',
                  items: [1, 2, 3]
               },
               isControl: false
            };
            instance.saveOptions(options);
            Object.freeze(instance);

            assert.doesNotThrow(() => instance._beforeUpdate(options));
         });

         it('nothing changed, should not update state', function () {
            const data = {
               text: 'test',
               items: [1, 2, 3]
            };
            const changedData = {
               text: 'test'
            };
            const oldOptions = {
               data,
               changedData,
               isControl: false
            };
            const newOptions = {
               changedData,
               data,
               isControl: false
            };
            instance.saveOptions(oldOptions);
            Object.freeze(instance);

            assert.doesNotThrow(() => instance._beforeUpdate(newOptions));
         });

         it('should update source', function () {
            const data = {
               text: {
                  value: 'test'
               },
               items: {
                  value: [1, 2, 3]
               }
            };
            const oldOptions = {
               data,
               changedData: {
                  text: {
                     value: 'test1'
                  }
               },
               isControl: false
            };
            const newOptions = {
               changedData: {
                  text: {
                     value: 'test2'
                  }
               },
               data,
               isControl: false
            };
            instance._source = {
               update: sandbox.stub()
            };
            instance.saveOptions(oldOptions);

            instance._beforeUpdate(newOptions);
            sinon.assert.calledWithExactly(instance._source.update, {
               text: {
                  value: 'test2'
               }
            });
         });

         it('should create new source because the controlId has changed', function () {
            const oldOptions = {
               data: {
                  text: 'test'
               },
               isControl: false,
               caption: 'options',
               controlId: 0
            };
            const newOptions = {
               data: {
                  text: 'test'
               },
               isControl: false,
               caption: 'options',
               controlId: 1
            };
            const oldSource = {};
            instance._source = oldSource;
            instance.saveOptions(oldOptions);

            instance._beforeUpdate(newOptions);

            assert.notEqual(instance._source, oldSource);
            assert.instanceOf(instance._source, PaneSource);
            assert.deepEqual(instance._source._data, [
               {
                  key: 'text',
                  caption: 'test',
                  name: 'text',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:StringTemplate'
               }
            ]);
         });

         it('should create new source because the data changed', function () {
            const oldOptions = {
               data: {
                  text: 'test'
               },
               isControl: false,
               caption: 'options',
               controlId: 0
            };
            const newOptions = {
               data: {
                  text: 'test123'
               },
               isControl: false,
               caption: 'options',
               controlId: 0
            };
            const oldSource = {};
            instance._source = oldSource;
            instance.saveOptions(oldOptions);

            instance._beforeUpdate(newOptions);

            assert.notEqual(instance._source, oldSource);
            assert.instanceOf(instance._source, PaneSource);
            assert.deepEqual(instance._source._data, [
               {
                  key: 'text',
                  caption: 'test123',
                  name: 'text',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:StringTemplate'
               }
            ]);
         });
      });

      describe('_afterUpdate', function () {
         it('should not call highlightUpdate because there is no changedData', function () {
            const highlightUpdateMock = sandbox.stub(
               highlightUpdate,
               'highlightUpdate'
            );
            instance.saveOptions({});

            instance._afterUpdate({});

            assert.isTrue(highlightUpdateMock.notCalled);
         });

         it('should not call highlightUpdate because there changedData is the same', function () {
            const highlightUpdateMock = sandbox.stub(
               highlightUpdate,
               'highlightUpdate'
            );
            const changedData = {
               test: '123'
            };
            instance.saveOptions({
               changedData
            });

            instance._afterUpdate({
               changedData
            });

            assert.isTrue(highlightUpdateMock.notCalled);
         });

         it('should not call highlightUpdate because child with that key does not exist', function () {
            const highlightUpdateMock = sandbox.stub(
               highlightUpdate,
               'highlightUpdate'
            );
            const changedData = {
               test: '123'
            };
            instance.saveOptions({
               changedData
            });
            instance._children = {
               items: {}
            };

            instance._afterUpdate({});

            assert.isTrue(highlightUpdateMock.notCalled);
         });

         it('should not call highlightUpdate because child with that key does not exist', function () {
            const highlightUpdateMock = sandbox.stub(
               highlightUpdate,
               'highlightUpdate'
            );
            const changedData = {
               test: '123'
            };
            instance.saveOptions({
               changedData
            });
            instance._children = {
               items: {}
            };

            instance._afterUpdate({});

            assert.isTrue(highlightUpdateMock.notCalled);
         });

         it('should call highlightUpdate for all changed children', function () {
            const highlightUpdateMock = sandbox.stub(
               highlightUpdate,
               'highlightUpdate'
            );
            const changedData = {
               test: '123',
               value: 456
            };
            instance.saveOptions({
               changedData,
               highlightUpdates: true
            });
            const testParentElement = {};
            const valueParentElement = {};
            instance._children = {
               test: {
                  _container: {
                     parentElement: testParentElement
                  }
               },
               value: {
                  _container: {
                     parentElement: valueParentElement
                  }
               }
            };

            instance._afterUpdate({});

            assert.isTrue(
               highlightUpdateMock.calledWithExactly(testParentElement)
            );
            assert.isTrue(
               highlightUpdateMock.calledWithExactly(valueParentElement)
            );
            assert.isTrue(highlightUpdateMock.calledTwice);
         });

         it('should not call highlightUpdate', function () {
            const highlightUpdateMock = sandbox.stub(
               highlightUpdate,
               'highlightUpdate'
            );
            const changedData = {
               test: '123',
               value: 456
            };
            instance.saveOptions({
               changedData,
               highlightUpdates: false
            });

            instance._afterUpdate({});

            assert.isTrue(highlightUpdateMock.notCalled);
         });

         it('should not reload the list if the panel is not expanded', function () {
            const data = {
               text: {
                  value: 'test'
               },
               items: {
                  value: [1, 2, 3]
               }
            };
            const oldOptions = {
               data,
               changedData: {
                  text: {
                     value: 'test1'
                  }
               },
               isControl: false
            };
            const newOptions = {
               changedData: {
                  text: {
                     value: 'test2'
                  }
               },
               data,
               isControl: false
            };
            instance._children = {
               list: {
                  reload: sandbox.stub()
               }
            };
            instance.saveOptions(newOptions);

            instance._afterUpdate(oldOptions);

            sinon.assert.notCalled(instance._children.list.reload);
         });

         it('should reload the list', function () {
            const data = {
               text: {
                  value: 'test'
               },
               items: {
                  value: [1, 2, 3]
               }
            };
            const oldOptions = {
               data,
               changedData: {
                  text: {
                     value: 'test1'
                  }
               },
               isControl: false
            };
            const newOptions = {
               changedData: {
                  text: {
                     value: 'test2'
                  }
               },
               data,
               isControl: false,
               expanded: true
            };
            instance._children = {
               list: {
                  reload: sandbox.stub()
               }
            };
            instance.saveOptions(newOptions);

            instance._afterUpdate(oldOptions);

            sinon.assert.calledOnce(instance._children.list.reload);
         });
      });

      describe('_itemActionVisibilityCallback', function () {
         describe('canStoreAsGlobal', function () {
            it('should return false because _options.canStoreAsGlobal is false', function () {
               const action = {
                  id: 'storeAsGlobal'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'text',
                     caption: 'Empty object',
                     name: 'text',
                     parent: null,
                     hasChildren: null,
                     template: 'Elements/elements:ObjectTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  canStoreAsGlobal: false
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it('should return false because the item is not an object', function () {
               const action = {
                  id: 'storeAsGlobal'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'text',
                     caption: 'test',
                     name: 'text',
                     parent: null,
                     hasChildren: null,
                     template: 'Elements/elements:StringTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  canStoreAsGlobal: false
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it('should return true', function () {
               const action = {
                  id: 'storeAsGlobal'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'text',
                     caption: 'Object',
                     name: 'text',
                     parent: null,
                     hasChildren: true,
                     template: 'Elements/elements:ObjectTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  canStoreAsGlobal: true
               });

               assert.isTrue(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });
         });

         describe('addBreakpoint', function () {
            it('should return false because this is not the events tab', function () {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'text',
                     caption: 'test',
                     name: 'text',
                     parent: null,
                     hasChildren: null,
                     template: 'Elements/elements:StringTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Options'
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it('should return false because the item is not on the top level', function () {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'func---click',
                     caption: 'function click()',
                     name: 'func',
                     parent: 'click',
                     hasChildren: null,
                     template: 'Elements/elements:StringTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events'
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it('should return false because the item has a breakpoint', function () {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     caption: 'Object',
                     name: 'click',
                     parent: null,
                     hasChildren: true,
                     template: 'Elements/elements:ObjectTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events',
                  controlId: 0,
                  eventWithBreakpoint: 'click',
                  elementsWithBreakpoints: new Set([0])
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it('should return true', function () {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     caption: 'Object',
                     name: 'click',
                     parent: null,
                     hasChildren: true,
                     template: 'Elements/elements:ObjectTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events',
                  elementsWithBreakpoints: new Set()
               });

               assert.isTrue(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });
         });

         describe('removeBreakpoint', function () {
            it('should return false because this is not the events tab', function () {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'text',
                     caption: 'test',
                     name: 'text',
                     parent: null,
                     hasChildren: null,
                     template: 'Elements/elements:StringTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Options'
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it('should return false because the item is not on the top level', function () {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'func---click',
                     caption: 'function click()',
                     name: 'func',
                     parent: 'click',
                     hasChildren: null,
                     template: 'Elements/elements:StringTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events'
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it("should return false because the item doesn't have a breakpoint", function () {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     caption: 'Object',
                     name: 'click',
                     parent: null,
                     hasChildren: true,
                     template: 'Elements/elements:ObjectTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events',
                  elementsWithBreakpoints: new Set()
               });

               assert.isFalse(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });

            it('should return true', function () {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     caption: 'Object',
                     name: 'click',
                     parent: null,
                     hasChildren: true,
                     template: 'Elements/elements:ObjectTemplate'
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events',
                  controlId: 0,
                  eventWithBreakpoint: 'click',
                  elementsWithBreakpoints: new Set([0])
               });

               assert.isTrue(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });
         });
      });

      describe('__toggleExpanded', function () {
         it('should fire expandedChanged event with true', function () {
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               expanded: false
            });

            instance.__toggleExpanded();

            assert.isTrue(
               stub.calledOnceWithExactly('expandedChanged', [true])
            );
         });

         it('should fire expandedChanged event with false', function () {
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               expanded: true
            });

            instance.__toggleExpanded();

            assert.isTrue(
               stub.calledOnceWithExactly('expandedChanged', [false])
            );
         });
      });

      describe('__viewFunctionSource', function () {
         it('should stop event propagation, add caption from options to the path and fire viewFunctionSource event', function () {
            const event = {
               stopPropagation: sandbox.stub()
            };
            const stub = sandbox.stub(instance, '_notify');
            const path = ['value', 'item'];
            instance.saveOptions({
               caption: 'Options'
            });

            instance.__viewFunctionSource(event, path);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(
               stub.calledOnceWithExactly('viewFunctionSource', [
                  path.concat('options')
               ])
            );
         });
      });

      describe('__storeAsGlobal', function () {
         it('should not fire storeAsGlobal event', function () {
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: {}
               },
               keyProperty: 'key'
            });
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               canStoreAsGlobal: false
            });

            instance.__storeAsGlobal(item);

            assert.isTrue(stub.notCalled);
         });

         it('should fire storeAsGlobal event', function () {
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: {}
               },
               keyProperty: 'key'
            });
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               canStoreAsGlobal: true,
               caption: 'Options'
            });

            instance.__storeAsGlobal(item);

            assert.isTrue(
               stub.calledOnceWithExactly('storeAsGlobal', [
                  ['value', 'item'].concat('options')
               ])
            );
         });
      });

      describe('getOptionTypes', function () {
         it('should call entity:Descriptor with correct values', function () {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Pane.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'caption',
               'data',
               'expanded',
               'controlId',
               'isControl',
               'store',
               'changedData',
               'canStoreAsGlobal',
               'elementsWithBreakpoints',
               'eventWithBreakpoint',
               'readOnly',
               'theme',
               'highlightUpdates'
            ]);
            testOption(optionTypes, 'caption', {
               required: true,
               args: [String]
            });
            testOption(optionTypes, 'data', {
               required: true,
               args: [Object]
            });
            testOption(optionTypes, 'expanded', {
               required: true,
               args: [Boolean]
            });
            testOption(optionTypes, 'controlId', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'isControl', {
               required: true,
               args: [Boolean]
            });
            testOption(optionTypes, 'store', {
               required: true,
               args: [Store]
            });
            testOption(optionTypes, 'changedData', {
               args: [Object, null]
            });
            testOption(optionTypes, 'canStoreAsGlobal', {
               args: [Boolean]
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
            testOption(optionTypes, 'highlightUpdates', {
               args: [Boolean]
            });
         });
      });

      it('getDefaultOptions', function () {
         assert.deepEqual(Pane.getDefaultOptions(), {
            canStoreAsGlobal: true,
            highlightUpdates: true
         });
      });

      describe('__setBreakpoint', function () {
         it('should fire setBreakpoint event', function () {
            const item = new entityLib.Model({
               rawData: {
                  name: 'click'
               },
               keyProperty: 'key'
            });
            const stub = sandbox.stub(instance, '_notify');

            instance.__setBreakpoint(item);

            assert.isTrue(
               stub.calledOnceWithExactly('setBreakpoint', ['click'])
            );
         });

         it('should fire removeBreakpoint event', function () {
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               controlId: 0
            });

            instance.__removeBreakpoint();

            assert.isTrue(stub.calledOnceWithExactly('removeBreakpoint', [0]));
         });
      });
   });
});
