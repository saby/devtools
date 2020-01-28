define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Pane/Pane',
   'Elements/_Details/Pane/Source',
   'wml!Elements/_Details/Pane/columnTemplate',
   'Types/collection',
   'Elements/_utils/highlightUpdate',
   'Elements/_Details/Pane/const',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(
   mockChrome,
   Pane,
   PaneSource,
   columnTemplate,
   collectionLib,
   highlightUpdate,
   PaneConst,
   entityLib,
   optionTypesMocks
) {
   let sandbox;
   let instance;
   Pane = Pane.default;
   PaneSource = PaneSource.Source;

   describe('Elements/_Details/Pane/Pane', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Pane();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_beforeMount', function() {
         it('isControl: false, should correctly init state', function() {
            const items = [1, 2, 3];
            const options = {
               data: {
                  text: {
                     value: 'test'
                  },
                  items: {
                     value: items
                  }
               },
               isControl: false
            };

            instance._beforeMount(options);

            assert.instanceOf(instance._source, PaneSource);
            assert.deepEqual(instance._source._data, [
               {
                  key: 'text',
                  value: 'test',
                  name: 'text',
                  parent: null,
                  hasChildren: null
               },
               {
                  key: 'items',
                  value: items,
                  name: 'items',
                  parent: null,
                  hasChildren: true
               }
            ]);
            assert.deepEqual(instance._columns, [
               {
                  getTemplate: instance.__getTemplate,
                  template: columnTemplate
               }
            ]);
            // every action has a handler that gets bound inside _beforeMount so we can't test deep equality here
            assert.equal(instance._itemActions.length, 5);
            assert.isFunction(instance._visibilityCallback);
            assert.isUndefined(instance._editingConfig);
         });
         it('isControl: true, should correctly init state', function() {
            const items = [1, 2, 3];
            const options = {
               data: {
                  text: {
                     value: 'test',
                     hasBreakpoint: true
                  },
                  items: {
                     value: items
                  }
               },
               isControl: true
            };

            instance._beforeMount(options);

            assert.instanceOf(instance._source, PaneSource);
            assert.deepEqual(instance._source._data, [
               {
                  key: 'text',
                  value: 'test',
                  name: 'text',
                  parent: null,
                  hasChildren: null,
                  hasBreakpoint: true
               },
               {
                  key: 'items',
                  value: items,
                  name: 'items',
                  parent: null,
                  hasChildren: true
               }
            ]);
            assert.deepEqual(instance._columns, [
               {
                  getTemplate: instance.__getTemplate,
                  template: columnTemplate
               }
            ]);
            // every action has a handler that gets bound inside _beforeMount so we can't test deep equality here
            assert.equal(instance._itemActions.length, 5);
            assert.isFunction(instance._visibilityCallback);
            assert.deepEqual(instance._editingConfig, {
               sequentialEditing: false,
               toolbarVisibility: true
            });
         });
      });

      describe('_beforeUpdate', function() {
         it('nothing changed, should not update state', function() {
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

         it('nothing changed, should not update state', function() {
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

         it('should update source without reloading list', function() {
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
            const fakeRecordSet = {};
            const recordSetStub = sandbox
               .stub(collectionLib, 'RecordSet')
               .returns(fakeRecordSet);
            instance._source = {
               update: sandbox.stub()
            };
            instance._children = {
               list: {
                  reload: sandbox.stub()
               }
            };
            instance.saveOptions(oldOptions);
            Object.freeze(instance);

            assert.doesNotThrow(() => instance._beforeUpdate(newOptions));
            assert.isTrue(
               instance._source.update.calledOnceWithExactly(fakeRecordSet)
            );
            assert.isTrue(recordSetStub.calledWithNew());
            assert.isTrue(
               recordSetStub.calledOnceWithExactly({
                  rawData: [
                     {
                        key: 'text',
                        value: 'test2',
                        name: 'text',
                        parent: null
                     }
                  ]
               })
            );
            assert.isTrue(instance._children.list.reload.notCalled);
         });

         it('should update source and reload the list', function() {
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
            const fakeRecordSet = {};
            const recordSetStub = sandbox
               .stub(collectionLib, 'RecordSet')
               .returns(fakeRecordSet);
            instance._source = {
               update: sandbox.stub()
            };
            instance._children = {
               list: {
                  reload: sandbox.stub()
               }
            };
            instance.saveOptions(oldOptions);
            Object.freeze(instance);

            assert.doesNotThrow(() => instance._beforeUpdate(newOptions));
            assert.isTrue(
               instance._source.update.calledOnceWithExactly(fakeRecordSet)
            );
            assert.isTrue(recordSetStub.calledWithNew());
            assert.isTrue(
               recordSetStub.calledOnceWithExactly({
                  rawData: [
                     {
                        key: 'text',
                        value: 'test2',
                        name: 'text',
                        parent: null
                     }
                  ]
               })
            );
            assert.isTrue(
               instance._children.list.reload.calledOnceWithExactly()
            );
         });

         it('should create new source', function() {
            const oldOptions = {
               data: {
                  text: {
                     value: 'test'
                  },
                  items: {
                     value: [1, 2, 3]
                  }
               },
               isControl: false,
               controlId: 0
            };
            const newOptions = {
               data: {
                  text: {
                     value: 'test123'
                  }
               },
               isControl: false,
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
                  value: 'test123',
                  name: 'text',
                  parent: null,
                  hasChildren: null
               }
            ]);
         });

         it('should not create new source', function() {
            const oldOptions = {
               data: {
                  text: {
                     value: 'test'
                  }
               },
               isControl: false,
               controlId: 0
            };
            const newOptions = {
               data: { ...oldOptions.data },
               isControl: false,
               controlId: 0
            };
            const oldSource = {};
            instance._source = oldSource;
            instance.saveOptions(oldOptions);

            instance._beforeUpdate(newOptions);

            assert.equal(instance._source, oldSource);
         });

         it('should create new editingConfig', function() {
            const oldOptions = {
               isControl: false
            };
            const newOptions = {
               isControl: true
            };
            instance._editingConfig = undefined;
            instance.saveOptions(oldOptions);

            instance._beforeUpdate(newOptions);

            assert.deepEqual(instance._editingConfig, {
               sequentialEditing: false,
               toolbarVisibility: true
            });
         });

         it('should set _editingConfig to undefined', function() {
            const oldOptions = {
               isControl: true
            };
            const newOptions = {
               isControl: false
            };
            instance._editingConfig = {
               sequentialEditing: false,
               toolbarVisibility: true
            };
            instance.saveOptions(oldOptions);

            instance._beforeUpdate(newOptions);

            assert.isUndefined(instance._editingConfig);
         });
      });

      describe('_afterUpdate', function() {
         it('should not call highlightUpdate because there is no changedData', function() {
            const highlightUpdateMock = sandbox.stub(
               highlightUpdate,
               'highlightUpdate'
            );
            instance.saveOptions({});

            instance._afterUpdate({});

            assert.isTrue(highlightUpdateMock.notCalled);
         });

         it('should not call highlightUpdate because there changedData is the same', function() {
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

         it('should not call highlightUpdate because child with that key does not exist', function() {
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

         it('should not call highlightUpdate because child with that key does not exist', function() {
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
         it('should call highlightUpdate for all changed children', function() {
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

         it('should not call highlightUpdate', function() {
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
      });

      describe('_itemActionVisibilityCallback', function() {
         it('should return false because the item is the editing item', function() {
            const action = {
               id: 'storeAsGlobal'
            };
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: 123
               },
               keyProperty: 'key'
            });
            instance._editingItem = item;

            assert.isFalse(
               instance._itemActionVisibilityCallback(action, item)
            );
         });

         it('should return false because action with id editValue is disabled', function() {
            const action = {
               id: 'editValue'
            };
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: 123
               },
               keyProperty: 'key'
            });

            assert.isFalse(
               instance._itemActionVisibilityCallback(action, item)
            );
         });

         it('should return false because action with id revertValue is disabled', function() {
            const action = {
               id: 'revertValue'
            };
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: 123
               },
               keyProperty: 'key'
            });

            assert.isFalse(
               instance._itemActionVisibilityCallback(action, item)
            );
         });

         describe('canStoreAsGlobal', function() {
            it('should return false because _options.canStoreAsGlobal is false', function() {
               const action = {
                  id: 'storeAsGlobal'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'item---value',
                     value: 123
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

            it("should return false because item's value is not an object", function() {
               const action = {
                  id: 'storeAsGlobal'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'item---value',
                     value: 123
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

            it('should return true', function() {
               const action = {
                  id: 'storeAsGlobal'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'item---value',
                     value: {}
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

         describe('addBreakpoint', function() {
            it('should return false because this is not the events tab', function() {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'item---value',
                     value: {}
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

            it('should return false because the item is not on the top level', function() {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click-0',
                     value: {},
                     parent: 'click'
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

            it("should return false because the item has a breakpoint", function() {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     value: {},
                     hasBreakpoint: true,
                     parent: null
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

            it('should return true', function() {
               const action = {
                  id: 'addBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     value: {},
                     hasBreakpoint: false,
                     parent: null
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events'
               });

               assert.isTrue(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });
         });

         describe('removeBreakpoint', function() {
            it('should return false because this is not the events tab', function() {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'item---value',
                     value: {}
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

            it('should return false because the item is not on the top level', function() {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click-0',
                     value: {},
                     parent: 'click'
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

            it("should return false because the item doesn't have a breakpoint", function() {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     value: {},
                     hasBreakpoint: false,
                     parent: null
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

            it('should return true', function() {
               const action = {
                  id: 'removeBreakpoint'
               };
               const item = new entityLib.Model({
                  rawData: {
                     key: 'click',
                     value: {},
                     hasBreakpoint: true,
                     parent: null
                  },
                  keyProperty: 'key'
               });
               instance.saveOptions({
                  caption: 'Events'
               });

               assert.isTrue(
                  instance._itemActionVisibilityCallback(action, item)
               );
            });
         });
      });

      it('__getTemplate', function() {
         assert.equal(
            PaneConst.TEMPLATES.string,
            instance.__getTemplate(undefined)
         );
         assert.equal(PaneConst.TEMPLATES.string, instance.__getTemplate(''));
         assert.equal(
            PaneConst.TEMPLATES.string,
            instance.__getTemplate('test')
         );
         assert.equal(
            PaneConst.TEMPLATES.boolean,
            instance.__getTemplate(true)
         );
         assert.equal(
            PaneConst.TEMPLATES.boolean,
            instance.__getTemplate(false)
         );
         assert.equal(PaneConst.TEMPLATES.number, instance.__getTemplate(0));
         assert.equal(PaneConst.TEMPLATES.number, instance.__getTemplate(123));
         assert.equal(PaneConst.TEMPLATES.object, instance.__getTemplate(null));
         assert.equal(PaneConst.TEMPLATES.object, instance.__getTemplate({}));
         assert.equal(
            PaneConst.TEMPLATES.object,
            instance.__getTemplate({
               test: '123'
            })
         );
         assert.equal(PaneConst.TEMPLATES.object, instance.__getTemplate([1]));
      });

      describe('__toggleExpanded', function() {
         it('should fire expandedChanged event with true', function() {
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               expanded: false
            });

            instance.__toggleExpanded();

            assert.isTrue(
               stub.calledOnceWithExactly('expandedChanged', [true])
            );
         });

         it('should fire expandedChanged event with false', function() {
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

      describe('__viewFunctionSource', function() {
         it('should stop event propagation, add caption from options to the path and fire viewFunctionSource event', function() {
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

      describe('__storeAsGlobal', function() {
         it('should not fire storeAsGlobal event', function() {
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

         it('should fire storeAsGlobal event', function() {
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

      describe('__beforeBeginEdit', function() {
         it('should remember editingItem', function() {
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: '123'
               },
               keyProperty: 'key'
            });
            instance._editingItem = undefined;

            instance.__beforeBeginEdit(
               {},
               {
                  item
               }
            );

            assert.equal(instance._editingItem, item);
         });
      });

      describe('__beforeEndEdit', function() {
         it('should not change state and fire events', function() {
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: '123'
               },
               keyProperty: 'key'
            });
            const stub = sandbox.stub(instance, '_notify');

            instance.__beforeEndEdit({}, item, false);

            assert.isTrue(stub.notCalled);
         });

         it('should set _editingItem to undefined and fire setNodeOption event', function() {
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: '123'
               },
               keyProperty: 'key'
            });
            instance._editingItem = {};
            const stub = sandbox.stub(instance, '_notify');

            instance.__beforeEndEdit({}, item, true);

            assert.isTrue(
               stub.calledOnceWithExactly('setNodeOption', [
                  ['value', 'item'],
                  '123'
               ])
            );
            assert.isUndefined(instance._editingItem);
         });
      });

      describe('__editValue', function() {
         it('should call beginEdit with the item', function() {
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: '123'
               },
               keyProperty: 'key'
            });
            instance._children = {
               list: {
                  beginEdit: sandbox.stub()
               }
            };

            instance.__editValue(item);

            assert.isTrue(
               instance._children.list.beginEdit.calledOnceWithExactly({
                  item
               })
            );
         });
      });

      describe('__revertValue', function() {
         it('calls item.rejectChanges with changedFields and fires revertNodeOption event', function() {
            const item = new entityLib.Model({
               rawData: {
                  key: 'item---value',
                  value: '123'
               },
               keyProperty: 'key'
            });
            const rejectChangesStub = sandbox.stub(item, 'rejectChanges');
            const changedFields = ['value'];
            const getChangedStub = sandbox
               .stub(item, 'getChanged')
               .returns(changedFields);
            const notifyStub = sandbox.stub(instance, '_notify');

            instance.__revertValue(item);

            assert.isTrue(getChangedStub.calledOnceWithExactly());
            assert.isTrue(
               rejectChangesStub.calledOnceWithExactly(changedFields)
            );
            assert.isTrue(
               notifyStub.calledOnceWithExactly('revertNodeOption', [
                  ['value', 'item']
               ])
            );
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Pane.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'caption',
               'data',
               'expanded',
               'controlId',
               'isControl',
               'changedData',
               'canStoreAsGlobal',
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
            testOption(optionTypes, 'changedData', {
               args: [Object, null]
            });
            testOption(optionTypes, 'canStoreAsGlobal', {
               args: [Boolean]
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

      it('getDefaultOptions', function() {
         assert.deepEqual(Pane.getDefaultOptions(), {
            canStoreAsGlobal: true,
            highlightUpdates: true
         });
      });

      describe('__setBreakpoint', function() {
         it('should fire setBreakpoint event', function() {
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

         it('should fire removeBreakpoint event', function() {
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
