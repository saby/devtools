define([
   'DevtoolsTest/mockChrome',
   'Elements/_Elements/Elements',
   'Extension/Plugins/Elements/const',
   'Elements/_utils/highlightUpdate',
   'DevtoolsTest/getJSDOM'
], function(mockChrome, Elements, elementsConsts, highlightUpdate, getJSDOM) {
   let sandbox;
   Elements = Elements.default;
   const OperationType = elementsConsts.OperationType;
   const ControlType = elementsConsts.ControlType;
   const BREAKPOINTS = 'window.__WASABY_DEV_HOOK__._breakpoints';
   const needJSDOM = typeof window === 'undefined';

   describe('Elements/_Elements/Elements', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.window;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('adds correct listeners, adds itself to window and gets full tree', function() {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               }
            };

            const instance = new Elements(options);

            // TODO: слабые проверки, но лучше чем ничего. Непонятно как тестить, что навесились нужные обработчики при этом игнорируя реализацию обработчиков
            assert.isTrue(
               options.store.addListener.calledWith('inspectedElement')
            );
            assert.isTrue(
               options.store.addListener.calledWith('setSelectedItem')
            );
            assert.isTrue(
               options.store.addListener.calledWith('endSynchronization')
            );
            assert.isTrue(options.store.addListener.calledWith('operation'));
            assert.isTrue(
               options.store.addListener.calledWith('stopSelectFromPage')
            );
            assert.equal(window.elementsPanel, instance);
            assert.isTrue(
               options.store.toggleDevtoolsOpened.calledOnceWithExactly(true)
            );
            assert.isTrue(options.store.getFullTree.calledOnceWithExactly());

            delete window.elementsPanel;
         });
      });

      describe('_beforeUpdate', function() {
         it('should update everything on the tab', function() {
            const items = [1, 2, 3];
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves(items),
               getElements: sandbox.stub().returns(items)
            };
            const options = {
               store,
               selected: false
            };
            const instance = new Elements(options);
            instance._itemsChanged = false;
            instance.saveOptions(options);
            const setItemsStub = sandbox.stub(instance._model, 'setItems');
            const inspectElementStub = sandbox.stub(
               instance,
               '__inspectElement'
            );
            const throttledUpdateSearchStub = sandbox.stub(
               instance,
               '_throttledUpdateSearch'
            );

            instance._beforeUpdate({
               ...options,
               selected: true
            });

            assert.isTrue(setItemsStub.calledOnceWithExactly(items));
            assert.isTrue(
               inspectElementStub.calledOnceWithExactly(store, {
                  reset: true
               })
            );
            assert.isTrue(throttledUpdateSearchStub.calledOnceWithExactly());
            assert.isFalse(instance._itemsChanged);

            delete window.elementsPanel;
         });

         it('should not change anything because the tab was already selected', function() {
            const items = [1, 2, 3];
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves(items),
               getElements: sandbox.stub().returns(items)
            };
            const options = {
               store,
               selected: true
            };
            const instance = new Elements(options);
            instance._itemsChanged = false;
            instance.saveOptions(options);
            const setItemsStub = sandbox.stub(instance._model, 'setItems');
            const inspectElementStub = sandbox.stub(
               instance,
               '__inspectElement'
            );
            const throttledUpdateSearchStub = sandbox.stub(
               instance,
               '_throttledUpdateSearch'
            );

            instance._beforeUpdate(options);

            assert.isTrue(setItemsStub.notCalled);
            assert.isTrue(inspectElementStub.notCalled);
            assert.isTrue(throttledUpdateSearchStub.notCalled);
            assert.isFalse(instance._itemsChanged);

            delete window.elementsPanel;
         });
      });

      describe('_afterUpdate', function() {
         it('should scroll to item', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._scrollToId = 0;
            const child = {
               scrollIntoView: sandbox.stub()
            };
            instance._children = {
               0: {
                  querySelector: sandbox
                     .stub()
                     .withArgs('.js-devtools-Elements__name')
                     .returns(child)
               }
            };

            instance._afterUpdate();

            assert.isTrue(
               child.scrollIntoView.calledOnceWithExactly({
                  block: 'nearest',
                  inline: 'nearest'
               })
            );
            assert.isUndefined(instance._scrollToId);

            delete window.elementsPanel;
         });
      });

      describe('panelShownCallback', function() {
         it('should set $0 on __WASABY_DEV_HOOK__ and then fire getSelectedItem event', function() {
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves([]),
               dispatch: sandbox.stub()
            };
            const options = {
               store
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArg(1)
               }
            });

            instance.panelShownCallback();

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWith(
                  'window.__WASABY_DEV_HOOK__.$0 = $0'
               )
            );
            assert.isTrue(
               store.dispatch.calledOnceWithExactly('getSelectedItem')
            );

            delete window.elementsPanel;
         });
      });

      describe('panelHiddenCallback', function() {
         it('should disable selection on the page', function() {
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves([]),
               dispatch: sandbox.stub()
            };
            const options = {
               store
            };
            const instance = new Elements(options);
            instance.saveOptions(options);

            instance.panelHiddenCallback();

            assert.isTrue(
               store.dispatch.calledOnceWithExactly(
                  'toggleSelectFromPage',
                  false
               )
            );

            delete window.elementsPanel;
         });
      });

      describe('_beforeUnmount', function() {
         it('should disable selection on the page, destroy model and cleanup inspectedItem and window', function() {
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves([]),
               dispatch: sandbox.stub()
            };
            const options = {
               store
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._inspectedItem = {};
            const destructorStub = sandbox.stub(instance._model, 'destructor');

            instance._beforeUnmount();

            assert.isTrue(
               store.dispatch.calledOnceWithExactly(
                  'toggleSelectFromPage',
                  false
               )
            );
            assert.isUndefined(instance._inspectedItem);
            assert.isTrue(destructorStub.calledOnceWithExactly());
            assert.isUndefined(window.elementsPanel);

            delete window.elementsPanel;
         });
      });

      describe('_onItemClick', function() {
         it('should call __selectElement with the passed id', function() {
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves([])
            };
            const options = {
               store
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            const stub = sandbox.stub(instance, '__selectElement');

            instance._onItemClick({}, 0);

            assert.isTrue(stub.calledOnceWithExactly(0));

            delete window.elementsPanel;
         });
      });

      describe('_onListKeyDown', function() {
         describe('ArrowDown', function() {
            it('should select the next item', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowDown'
                  }
               };
               const stub = sandbox.stub(instance, '__selectElement');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  }
               ]);
               instance._selectedItemId = 0;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.calledOnceWithExactly(1));

               delete window.elementsPanel;
            });

            it('should not call __selectElement because this is the last item', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowDown'
                  }
               };
               const stub = sandbox.stub(instance, '__selectElement');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  }
               ]);
               instance._selectedItemId = 1;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.notCalled);

               delete window.elementsPanel;
            });
         });

         describe('ArrowLeft', function() {
            it('should collapse the selected item', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowLeft'
                  }
               };
               const stub = sandbox.stub(instance._model, 'toggleExpanded');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: true,
                     hasChildren: false
                  }
               ]);
               instance._selectedItemId = 1;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.calledOnceWithExactly(1, false));

               delete window.elementsPanel;
            });

            it('should select the parent of the selected item', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowLeft'
                  }
               };
               const stub = sandbox.stub(instance, '__selectElement');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: true
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 1,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false,
                     parentId: 0
                  }
               ]);
               instance._selectedItemId = 1;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.calledOnceWithExactly(0));

               delete window.elementsPanel;
            });

            it('should not do anything because this is the root element', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowLeft'
                  }
               };
               const selectElementStub = sandbox.stub(
                  instance,
                  '__selectElement'
               );
               const toggleExpandedStub = sandbox.stub(
                  instance._model,
                  'toggleExpanded'
               );
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  }
               ]);
               instance._selectedItemId = 1;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(selectElementStub.notCalled);
               assert.isTrue(toggleExpandedStub.notCalled);

               delete window.elementsPanel;
            });
         });

         describe('ArrowRight', function() {
            it('should select the first child', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowRight'
                  }
               };
               const stub = sandbox.stub(instance, '__selectElement');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: true,
                     hasChildren: true
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 1,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false,
                     parentId: 0
                  }
               ]);
               instance._selectedItemId = 0;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.calledOnceWithExactly(1));

               delete window.elementsPanel;
            });

            it('should expand the selected item', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowRight'
                  }
               };
               const stub = sandbox.stub(instance._model, 'toggleExpanded');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: true
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 1,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false,
                     parentId: 0
                  }
               ]);
               instance._selectedItemId = 0;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.calledOnceWithExactly(0, true));

               delete window.elementsPanel;
            });

            it('should not do anything because the selected item does not have children', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowRight'
                  }
               };
               const selectElementStub = sandbox.stub(
                  instance,
                  '__selectElement'
               );
               const toggleExpandedStub = sandbox.stub(
                  instance._model,
                  'toggleExpanded'
               );
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  }
               ]);
               instance._selectedItemId = 0;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(selectElementStub.notCalled);
               assert.isTrue(toggleExpandedStub.notCalled);

               delete window.elementsPanel;
            });
         });

         describe('ArrowUp', function() {
            it('should select a previous item', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowUp'
                  }
               };
               const stub = sandbox.stub(instance, '__selectElement');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: true,
                     hasChildren: false
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  }
               ]);
               instance._selectedItemId = 1;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.calledOnceWithExactly(0));

               delete window.elementsPanel;
            });

            it('should not call __selectElement because this is the first item', function() {
               const options = {
                  store: {
                     addListener: sandbox.stub(),
                     toggleDevtoolsOpened: sandbox.stub(),
                     getFullTree: sandbox.stub().resolves([])
                  }
               };
               const instance = new Elements(options);
               instance.saveOptions(options);
               const event = {
                  stopPropagation: sandbox.stub(),
                  nativeEvent: {
                     key: 'ArrowUp'
                  }
               };
               const stub = sandbox.stub(instance, '__selectElement');
               sandbox.stub(instance._model, 'getVisibleItems').returns([
                  {
                     id: 0,
                     name: 'Test',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: true,
                     hasChildren: false
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     depth: 0,
                     class: 'devtools-Elements__node_control',
                     isExpanded: false,
                     hasChildren: false
                  }
               ]);
               instance._selectedItemId = 0;

               instance._onListKeyDown(event);

               assert.isTrue(event.stopPropagation.calledOnceWithExactly());
               assert.isTrue(stub.notCalled);

               delete window.elementsPanel;
            });
         });
      });

      describe('_operationHandler', function() {
         it('should not do anything because the panel is not selected', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: false
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._itemsChanged = false;
            const updateNodeStub = sandbox.stub(instance, '__updateNode');
            const highlightNodeStub = sandbox.stub(instance, '__highlightNode');
            const onOrderChangedStub = sandbox.stub(
               instance._model,
               'onOrderChanged'
            );

            instance._operationHandler([OperationType.DELETE, 0]);

            assert.isTrue(updateNodeStub.notCalled);
            assert.isTrue(highlightNodeStub.notCalled);
            assert.isTrue(onOrderChangedStub.notCalled);
            assert.isFalse(instance._itemsChanged);

            delete window.elementsPanel;
         });

         it('should call __updateNode with the passed id', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            const updateNodeStub = sandbox.stub(instance, '__updateNode');

            instance._operationHandler([OperationType.UPDATE, 0]);

            assert.isTrue(updateNodeStub.calledOnceWithExactly(0));

            delete window.elementsPanel;
         });

         it('should call __highlightNode with the passed id and set _itemsChanged to true', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._itemsChanged = false;
            const highlightNodeStub = sandbox.stub(instance, '__highlightNode');

            instance._operationHandler([
               OperationType.CREATE,
               0,
               'Test',
               ControlType.CONTROL
            ]);

            assert.isTrue(highlightNodeStub.calledOnceWithExactly(0));
            assert.isTrue(instance._itemsChanged);

            delete window.elementsPanel;
         });

         it('should set _itemsChanged to true and remove selection from the item', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._selectedItemId = 0;
            instance._inspectedItem = {};
            instance._path = [];
            instance._itemsChanged = false;

            instance._operationHandler([OperationType.DELETE, 0]);

            assert.isTrue(instance._itemsChanged);
            assert.isUndefined(instance._selectedItemId);
            assert.isUndefined(instance._inspectedItem);
            assert.isUndefined(instance._path);

            delete window.elementsPanel;
         });

         it('should set _itemsChanged to true and without touching selection', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._selectedItemId = 1;
            instance._inspectedItem = {};
            instance._path = [];
            instance._itemsChanged = false;

            instance._operationHandler([OperationType.DELETE, 0]);

            assert.isTrue(instance._itemsChanged);
            assert.equal(instance._selectedItemId, 1);
            assert.deepEqual(instance._inspectedItem, {});
            assert.deepEqual(instance._path, []);

            delete window.elementsPanel;
         });

         it('should call onOrderChanged', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            const onOrderChangedStub = sandbox.stub(
               instance._model,
               'onOrderChanged'
            );

            instance._operationHandler([OperationType.REORDER, 0, 1, 2]);

            assert.isTrue(onOrderChangedStub.calledOnceWithExactly());

            delete window.elementsPanel;
         });
      });

      describe('__updateNode', function() {
         it('should highlight the node without inspecting it', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._selectedItemId = 1;
            const inspectElementStub = sandbox.stub(
               instance,
               '__inspectElement'
            );
            const highlightNodeStub = sandbox.stub(instance, '__highlightNode');

            instance.__updateNode(0);

            assert.isTrue(inspectElementStub.notCalled);
            assert.isTrue(highlightNodeStub.calledOnceWithExactly(0));

            delete window.elementsPanel;
         });

         it('should highlight the node an inspect it', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._selectedItemId = 0;
            const inspectElementStub = sandbox.stub(
               instance,
               '__inspectElement'
            );
            const highlightNodeStub = sandbox.stub(instance, '__highlightNode');

            instance.__updateNode(0);

            assert.isTrue(
               inspectElementStub.calledOnceWithExactly(options.store)
            );
            assert.isTrue(highlightNodeStub.calledOnceWithExactly(0));

            delete window.elementsPanel;
         });
      });

      describe('__highlightElement', function() {
         it('should fire highlightElement event', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  dispatch: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);

            instance.__highlightElement({}, 0);

            assert.isTrue(
               options.store.dispatch.calledOnceWithExactly(
                  'highlightElement',
                  0
               )
            );

            delete window.elementsPanel;
         });
      });

      describe('__selectElement', function() {
         it('should select the element and toggle select on the page', function() {
            const path = [
               {
                  id: 0,
                  name: 'Test',
                  class: 'devtools-Elements__node_hoc'
               }
            ];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._selectingFromPage = true;
            instance._path = undefined;
            instance._selectedItemId = undefined;
            instance._scrollToId = undefined;
            sandbox.stub(instance._model, 'getPath').returns(path);
            const toggleSelectElementFromPageStub = sandbox.stub(
               instance,
               '__toggleSelectElementFromPage'
            );
            const inspectElementStub = sandbox.stub(
               instance,
               '__inspectElement'
            );
            const expandParentsStub = sandbox.stub(
               instance._model,
               'expandParents'
            );

            instance.__selectElement(0);

            assert.isTrue(
               toggleSelectElementFromPageStub.calledOnceWithExactly()
            );
            assert.isTrue(expandParentsStub.calledOnceWithExactly(0));
            assert.equal(instance._path, path);
            assert.equal(instance._selectedItemId, 0);
            assert.equal(instance._scrollToId, 0);
            assert.isTrue(
               inspectElementStub.calledOnceWithExactly(options.store, {
                  reset: true
               })
            );

            delete window.elementsPanel;
         });

         it('should select the element without toggling select on the page', function() {
            const path = [
               {
                  id: 0,
                  name: 'Test',
                  class: 'devtools-Elements__node_hoc'
               }
            ];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._selectingFromPage = false;
            instance._path = undefined;
            instance._selectedItemId = undefined;
            instance._scrollToId = undefined;
            sandbox.stub(instance._model, 'getPath').returns(path);
            const toggleSelectElementFromPageStub = sandbox.stub(
               instance,
               '__toggleSelectElementFromPage'
            );
            const inspectElementStub = sandbox.stub(
               instance,
               '__inspectElement'
            );
            const expandParentsStub = sandbox.stub(
               instance._model,
               'expandParents'
            );

            instance.__selectElement(0);

            assert.isTrue(toggleSelectElementFromPageStub.notCalled);
            assert.isTrue(expandParentsStub.calledOnceWithExactly(0));
            assert.equal(instance._path, path);
            assert.equal(instance._selectedItemId, 0);
            assert.equal(instance._scrollToId, 0);
            assert.isTrue(
               inspectElementStub.calledOnceWithExactly(options.store, {
                  reset: true
               })
            );

            delete window.elementsPanel;
         });
      });

      describe('__highlightNode', function() {
         it('should not call highlightUpdate because the child with this id does not exist', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._children = {};
            const stub = sandbox.stub(highlightUpdate, 'highlightUpdate');

            instance.__highlightNode(0);

            assert.isTrue(stub.notCalled);

            delete window.elementsPanel;
         });

         it('should call highlight update because the child with this id does not exist', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            const child = {};
            instance._children = {
               0: child
            };
            const stub = sandbox.stub(highlightUpdate, 'highlightUpdate');

            instance.__highlightNode(0);

            assert.isTrue(stub.calledOnceWithExactly(child));

            delete window.elementsPanel;
         });
      });

      describe('__toggleExpanded', function() {
         it('should stop propagation of the event and call toggleExpanded', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const event = {
               stopPropagation: sandbox.stub()
            };
            const instance = new Elements(options);
            const stub = sandbox.stub(instance._model, 'toggleExpanded');

            instance.__toggleExpanded(event, 0);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(stub.calledOnceWithExactly(0));

            delete window.elementsPanel;
         });
      });

      describe('__onEndSynchronization', function() {
         it('should not do anything because the tab is not selected', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: false
            };
            const instance = new Elements(options);
            instance._itemsChanged = true;
            instance.saveOptions(options);
            const setItemsStub = sandbox.stub(instance._model, 'setItems');
            const throttledUpdateSearchStub = sandbox.stub(
               instance,
               '_throttledUpdateSearch'
            );

            instance.__onEndSynchronization();

            assert.isTrue(setItemsStub.notCalled);
            assert.isTrue(throttledUpdateSearchStub.notCalled);
            assert.isTrue(instance._itemsChanged);

            delete window.elementsPanel;
         });

         it('should set new items and update search', function() {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  getElements: sandbox.stub().returns(items)
               },
               selected: true
            };
            const instance = new Elements(options);
            instance._itemsChanged = true;
            instance.saveOptions(options);
            const setItemsStub = sandbox.stub(instance._model, 'setItems');
            const throttledUpdateSearchStub = sandbox.stub(
               instance,
               '_throttledUpdateSearch'
            );

            instance.__onEndSynchronization();

            assert.isTrue(setItemsStub.calledOnceWithExactly(items));
            assert.isTrue(throttledUpdateSearchStub.calledOnceWithExactly());
            assert.isFalse(instance._itemsChanged);

            delete window.elementsPanel;
         });

         it('should set new items without updating search', function() {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  getElements: sandbox.stub().returns(items)
               },
               selected: true
            };
            const instance = new Elements(options);
            instance._itemsChanged = false;
            instance.saveOptions(options);
            const setItemsStub = sandbox.stub(instance._model, 'setItems');
            const throttledUpdateSearchStub = sandbox.stub(
               instance,
               '_throttledUpdateSearch'
            );

            instance.__onEndSynchronization();

            assert.isTrue(setItemsStub.calledOnceWithExactly(items));
            assert.isTrue(throttledUpdateSearchStub.notCalled);
            assert.isFalse(instance._itemsChanged);

            delete window.elementsPanel;
         });
      });

      describe('__toggleSelectElementFromPage', function() {
         it('should fire toggleSelectFromPage event with true', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  dispatch: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance._selectingFromPage = false;
            instance.saveOptions(options);

            instance.__toggleSelectElementFromPage();

            assert.isTrue(
               options.store.dispatch.calledOnceWithExactly(
                  'toggleSelectFromPage',
                  true
               )
            );
            assert.isTrue(instance._selectingFromPage);

            delete window.elementsPanel;
         });

         it('should fire toggleSelectFromPage event with false', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  dispatch: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance._selectingFromPage = true;
            instance.saveOptions(options);

            instance.__toggleSelectElementFromPage();

            assert.isTrue(
               options.store.dispatch.calledOnceWithExactly(
                  'toggleSelectFromPage',
                  false
               )
            );
            assert.isFalse(instance._selectingFromPage);

            delete window.elementsPanel;
         });
      });

      describe('__onSearchValueChanged', function() {
         it('should call __updateSearch with the passed value', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            const stub = sandbox.stub(instance, '__updateSearch');

            instance.__onSearchValueChanged({}, 'test');

            assert.isTrue(stub.calledOnceWithExactly('test'));

            delete window.elementsPanel;
         });
      });

      describe('__updateSearch', function() {
         it('should not call selectElement', function() {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  getElements: sandbox.stub().returns(items)
               }
            };
            const instance = new Elements(options);
            instance._selectedItemId = 1;
            instance.saveOptions(options);
            sandbox
               .stub(instance._searchController, 'updateSearch')
               .withArgs(items, 'test', 1)
               .returns({
                  index: 0,
                  total: 0
               });
            const selectElementStub = sandbox.stub(instance, '__selectElement');

            instance.__updateSearch('test');

            assert.isTrue(selectElementStub.notCalled);
            assert.equal(instance._lastFoundItemIndex, 0);
            assert.equal(instance._searchTotal, 0);

            delete window.elementsPanel;
         });

         it('should call selectElement', function() {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  getElements: sandbox.stub().returns(items)
               }
            };
            const instance = new Elements(options);
            instance._selectedItemId = 1;
            instance.saveOptions(options);
            sandbox
               .stub(instance._searchController, 'updateSearch')
               .withArgs(items, 'test', 1)
               .returns({
                  id: 1,
                  index: 10,
                  total: 15
               });
            const selectElementStub = sandbox.stub(instance, '__selectElement');

            instance.__updateSearch('test');

            assert.isTrue(selectElementStub.calledOnceWithExactly(1));
            assert.equal(instance._lastFoundItemIndex, 10);
            assert.equal(instance._searchTotal, 15);

            delete window.elementsPanel;
         });
      });

      describe('__onSearchKeydown', function() {
         it('should not do anything because a key other than Enter was pressed', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._lastFoundItemIndex = 1;
            instance._searchTotal = 5;
            const selectElementStub = sandbox.stub(instance, '__selectElement');

            instance.__onSearchKeydown({
               nativeEvent: {
                  key: 'Escape',
                  shiftKey: true
               }
            });

            assert.isTrue(selectElementStub.notCalled);
            assert.equal(instance._lastFoundItemIndex, 1);
            assert.equal(instance._searchTotal, 5);

            delete window.elementsPanel;
         });

         it('should not call selectElement because the next item was not found', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: false
            };
            const instance = new Elements(options);
            sandbox
               .stub(instance._searchController, 'getNextItemId')
               .withArgs('test', true)
               .returns({
                  index: 0,
                  total: 0
               });
            instance._searchValue = 'test';
            const selectElementStub = sandbox.stub(instance, '__selectElement');

            instance.__onSearchKeydown({
               nativeEvent: {
                  key: 'Enter',
                  shiftKey: true
               }
            });

            assert.isTrue(selectElementStub.notCalled);
            assert.equal(instance._lastFoundItemIndex, 0);
            assert.equal(instance._searchTotal, 0);

            delete window.elementsPanel;
         });

         it('should call selectElement', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               },
               selected: false
            };
            const instance = new Elements(options);
            sandbox
               .stub(instance._searchController, 'getNextItemId')
               .withArgs('test', true)
               .returns({
                  id: 2,
                  index: 1,
                  total: 5
               });
            instance._searchValue = 'test';
            const selectElementStub = sandbox.stub(instance, '__selectElement');

            instance.__onSearchKeydown({
               nativeEvent: {
                  key: 'Enter',
                  shiftKey: true
               }
            });

            assert.isTrue(selectElementStub.calledOnceWithExactly(2));
            assert.equal(instance._lastFoundItemIndex, 1);
            assert.equal(instance._searchTotal, 5);

            delete window.elementsPanel;
         });
      });

      describe('__inspectElement', function() {
         it('should fire inspectElement event with default params', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  dispatch: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance._selectedItemId = 1;
            const expandedTabs = ['options', 'state'];
            sandbox
               .stub(instance, '__getVisibleTabs')
               .withArgs()
               .returns(expandedTabs);

            instance.__inspectElement(options.store);

            assert.isTrue(
               options.store.dispatch.calledOnceWithExactly('inspectElement', {
                  id: 1,
                  expandedTabs,
                  newTab: undefined,
                  reset: undefined
               })
            );

            delete window.elementsPanel;
         });

         it('should fire inspectElement event with passed params', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  dispatch: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance._selectedItemId = 1;
            const expandedTabs = ['options', 'state'];
            sandbox
               .stub(instance, '__getVisibleTabs')
               .withArgs()
               .returns(expandedTabs);

            instance.__inspectElement(options.store, {
               newTab: 'options',
               reset: false
            });

            assert.isTrue(
               options.store.dispatch.calledOnceWithExactly('inspectElement', {
                  id: 1,
                  expandedTabs,
                  newTab: 'options',
                  reset: false
               })
            );

            delete window.elementsPanel;
         });
      });

      describe('__setInspectedElement', function() {
         it('should not do anything because ids are not the same', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._selectedItemId = 0;
            instance._inspectedItem = undefined;

            instance.__setInspectedElement({
               type: 'full',
               node: {
                  id: 1
               }
            });

            assert.isUndefined(instance._inspectedItem);

            delete window.elementsPanel;
         });

         it('should set _inspectedItem', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._selectedItemId = 0;
            instance._inspectedItem = undefined;
            instance._eventWithBreakpoint = 'click';
            instance._elementsWithBreakpoints.add(0);

            instance.__setInspectedElement({
               type: 'full',
               node: {
                  id: 0,
                  options: {
                     test: '123'
                  },
                  events: {
                     mousedown: {
                        function: 'mousedownHandler()',
                        arguments: [1]
                     },
                     click: {
                        function: 'clickHandler()',
                        arguments: []
                     }
                  }
               }
            });

            assert.deepEqual(instance._inspectedItem, {
               id: 0,
               options: {
                  test: {
                     value: '123'
                  }
               },
               events: {
                  mousedown: {
                     value: {
                        function: 'mousedownHandler()',
                        arguments: [1]
                     }
                  },
                  click: {
                     value: {
                        function: 'clickHandler()',
                        arguments: []
                     },
                     hasBreakpoint: true
                  }
               }
            });

            delete window.elementsPanel;
         });

         it('should merge _inspectedItem and node', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._selectedItemId = 0;
            const oldInspectedItem = {
               id: 0,
               options: {
                  test: {
                     value: '123'
                  }
               }
            };
            instance._inspectedItem = oldInspectedItem;

            instance.__setInspectedElement({
               type: 'partial',
               node: {
                  id: 0,
                  changedOptions: {
                     test: '456'
                  }
               }
            });

            assert.notEqual(instance._inspectedItem, oldInspectedItem);
            assert.deepEqual(instance._inspectedItem, {
               id: 0,
               options: {
                  test: {
                     value: '123'
                  }
               },
               changedOptions: {
                  test: {
                     value: '456'
                  }
               }
            });

            delete window.elementsPanel;
         });
      });

      describe('__getVisibleTabs', function() {
         it('should return empty array', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._optionsExpanded = false;
            instance._stateExpanded = false;
            instance._attributesExpanded = false;

            assert.deepEqual(instance.__getVisibleTabs(), []);

            delete window.elementsPanel;
         });

         it('should return array with every tab', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance._optionsExpanded = true;
            instance._stateExpanded = true;
            instance._attributesExpanded = true;

            assert.deepEqual(instance.__getVisibleTabs(), [
               'options',
               'state',
               'attributes'
            ]);

            delete window.elementsPanel;
         });
      });

      describe('__onDetailsTabExpanded', function() {
         it('should change state to false and call inspectElement with the name of the tab', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._optionsExpanded = true;
            const stub = sandbox.stub(instance, '__inspectElement');

            instance.__onDetailsTabExpanded({}, '_optionsExpanded', false);

            assert.isFalse(instance._optionsExpanded);
            assert.isTrue(
               stub.calledOnceWithExactly(options.store, {
                  newTab: undefined
               })
            );

            delete window.elementsPanel;
         });

         it('should change state to true and call inspectElement with the name of the tab', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._optionsExpanded = false;
            const stub = sandbox.stub(instance, '__inspectElement');

            instance.__onDetailsTabExpanded({}, '_optionsExpanded', true);

            assert.isTrue(instance._optionsExpanded);
            assert.isTrue(
               stub.calledOnceWithExactly(options.store, {
                  newTab: 'options'
               })
            );

            delete window.elementsPanel;
         });

         it('should change state without calling inspectElement', function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._eventsExpanded = false;
            const stub = sandbox.stub(instance, '__inspectElement');

            instance.__onDetailsTabExpanded({}, '_eventsExpanded', true);

            assert.isTrue(instance._eventsExpanded);
            assert.isTrue(stub.notCalled);

            delete window.elementsPanel;
         });
      });

      describe('_setBreakpoint', function() {
         it('should remove all breakpoints, then add them again. Should not change inspected item', async function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  dispatch: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._inspectedItem = {
               id: 1,
               events: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     }
                  }
               }
            };
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;
            instance._selectedItemId = 0;
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArgWith(1, [])
               }
            });
            sandbox.stub(instance, '_removeAllBreakpoints').resolves();
            const clock = sinon.useFakeTimers();

            await instance._setBreakpoint({}, 'mousedown');

            assert.isTrue(
               options.store.dispatch.calledOnceWithExactly('setBreakpoint', {
                  id: 0,
                  eventName: 'mousedown'
               })
            );
            assert.isTrue(chrome.devtools.inspectedWindow.eval.notCalled);

            clock.tick(100);

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWith(
                  `${BREAKPOINTS} ? ${BREAKPOINTS}.map(([handler, condition, id]) => {\n                  debug(handler, condition);\n                  return id;\n               }) : []`
               )
            );
            assert.equal(instance._eventWithBreakpoint, 'mousedown');
            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set([0]));
            assert.deepEqual(instance._inspectedItem, {
               id: 1,
               events: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     }
                  }
               }
            });

            clock.restore();
            delete window.elementsPanel;
         });

         it('should remove all breakpoints, then add them again. Should update events on the inspected item', async function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([]),
                  dispatch: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._inspectedItem = {
               id: 1,
               events: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     }
                  }
               }
            };
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;
            instance._selectedItemId = 1;
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArgWith(1, [0])
               }
            });
            sandbox.stub(instance, '_removeAllBreakpoints').resolves();
            const clock = sinon.useFakeTimers();

            await instance._setBreakpoint({}, 'mousedown');

            assert.isTrue(
               options.store.dispatch.calledOnceWithExactly('setBreakpoint', {
                  id: 1,
                  eventName: 'mousedown'
               })
            );
            assert.isTrue(chrome.devtools.inspectedWindow.eval.notCalled);

            clock.tick(100);

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWith(
                  `${BREAKPOINTS} ? ${BREAKPOINTS}.map(([handler, condition, id]) => {\n                  debug(handler, condition);\n                  return id;\n               }) : []`
               )
            );
            assert.equal(instance._eventWithBreakpoint, 'mousedown');
            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(
               instance._elementsWithBreakpoints,
               new Set([0, 1])
            );
            assert.deepEqual(instance._inspectedItem, {
               id: 1,
               events: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     }
                  }
               },
               changedEvents: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     },
                     hasBreakpoint: true
                  }
               }
            });

            clock.restore();
            delete window.elementsPanel;
         });
      });

      describe('_removeAllBreakpoints', function() {
         it('should remove all breakpoints', async function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArg(1)
               }
            });

            await instance._removeAllBreakpoints();

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWith(
                  `${BREAKPOINTS} && ${BREAKPOINTS}.forEach(([handler]) => undebug(handler)); ${BREAKPOINTS} = undefined;`
               )
            );
            assert.equal(instance._eventWithBreakpoint, '');
            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set());

            delete window.elementsPanel;
         });

         it('should remove all breakpoints and update inspectedItem', async function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArg(1)
               }
            });
            instance._eventWithBreakpoint = 'mousedown';
            instance._selectedItemId = 1;
            instance._inspectedItem = {
               id: 1,
               events: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     }
                  }
               }
            };

            await instance._removeAllBreakpoints();

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWith(
                  `${BREAKPOINTS} && ${BREAKPOINTS}.forEach(([handler]) => undebug(handler)); ${BREAKPOINTS} = undefined;`
               )
            );
            assert.equal(instance._eventWithBreakpoint, '');
            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set());
            assert.deepEqual(instance._inspectedItem, {
               id: 1,
               events: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     }
                  }
               },
               changedEvents: {
                  mousedown: {
                     value: {
                        function: 'handleMousedown()',
                        arguments: []
                     },
                     hasBreakpoint: false
                  }
               }
            });

            delete window.elementsPanel;
         });
      });

      describe('__removeBreakpoint', function() {
         it("should not do anything because this element doesn't have a breakpoint", async function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._elementsWithBreakpoints.add(1);
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;

            await instance.__removeBreakpoint(0);

            assert.equal(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set([1]));

            delete window.elementsPanel;
         });

         it('should remove the id from the elementsWithBreakpoints, then remove breakpoints. Should not fail because 0 breakpoints were removed', async function() {
            // This test is for the case when frontend somehow got desynced with the backend
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._elementsWithBreakpoints.add(0);
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArg(1)
               }
            });

            await instance.__removeBreakpoint(0);

            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set());

            delete window.elementsPanel;
         });

         it('should remove the id from the elementsWithBreakpoints, then remove breakpoints. Should not fail if related breakpoints were already removed from elementsWithBreakpoints', async function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._elementsWithBreakpoints.add(0);
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArgWith(1, [1, 2, 3])
               }
            });

            await instance.__removeBreakpoint(0);

            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set());

            delete window.elementsPanel;
         });

         it('should remove the id from the elementsWithBreakpoints, then remove breakpoints. Also should remove every related breakpoint', async function() {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._elementsWithBreakpoints
               .add(0)
               .add(1)
               .add(2)
               .add(3);
            const oldElementsWithBreakpoints =
               instance._elementsWithBreakpoints;
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArgWith(1, [1, 2, 3])
               }
            });

            await instance.__removeBreakpoint(0);

            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set());

            delete window.elementsPanel;
         });
      });
   });
});
