define([
   'DevtoolsTest/mockChrome',
   'Elements/_Elements/Elements',
   'Extension/Plugins/Elements/const',
   'Elements/_utils/highlightUpdate',
   'DevtoolsTest/getJSDOM'
], function (mockChrome, Elements, elementsConsts, highlightUpdate, getJSDOM) {
   let sandbox;
   Elements = Elements.default;
   const OperationType = elementsConsts.OperationType;
   const ControlType = elementsConsts.ControlType;
   const BREAKPOINTS = 'window.__WASABY_DEV_HOOK__._breakpoints';
   const needJSDOM = typeof window === 'undefined';

   describe('Elements/_Elements/Elements', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
            global.document = dom.window.document;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.window;
            delete global.document;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('constructor', function () {
         it('adds correct listeners, adds itself to window and gets full tree', function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               }
            };

            const instance = new Elements(options);

            sinon.assert.calledWith(
               options.store.addListener,
               'inspectedElement'
            );
            sinon.assert.calledWith(
               options.store.addListener,
               'setSelectedItem'
            );
            sinon.assert.calledWith(
               options.store.addListener,
               'endSynchronization'
            );
            sinon.assert.calledWith(options.store.addListener, 'operation');
            sinon.assert.calledWith(
               options.store.addListener,
               'stopSelectFromPage'
            );
            sinon.assert.calledWith(options.store.toggleDevtoolsOpened, true);
            sinon.assert.calledOnce(options.store.getFullTree);
         });
      });

      describe('_beforeMount', function () {
         it('should set _detailsWidth to default value because the storage is empty', async function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               }
            };
            const instance = new Elements(options);
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('elementsDetailsWidth')
               .callsArgWith(1, {});

            await instance._beforeMount();

            assert.equal(instance._detailsWidth, 300);
         });

         it('should set _detailsWidth to value from the storage', async function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               }
            };
            const instance = new Elements(options);
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('elementsDetailsWidth')
               .callsArgWith(1, {
                  elementsDetailsWidth: 123
               });

            await instance._beforeMount();

            assert.equal(instance._detailsWidth, 123);
         });
      });

      describe('_beforeUpdate', function () {
         it("should update everything on the tab and call __inspectElement because the store doesn't have a selectedId", function () {
            const items = [1, 2, 3];
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves(items),
               getElements: sandbox.stub().returns(items),
               getSelectedId: sandbox.stub()
            };
            const options = {
               store,
               selected: false
            };
            const instance = new Elements(options);
            instance._itemsChanged = false;
            instance.saveOptions(options);
            sandbox.stub(instance._model, 'setItems');
            sandbox.stub(instance, '__inspectElement');
            sandbox.stub(instance, '_throttledUpdateSearch');

            instance._beforeUpdate({
               ...options,
               selected: true
            });

            sinon.assert.calledWithExactly(instance._model.setItems, items);
            sinon.assert.calledWithExactly(instance.__inspectElement, store);
            sinon.assert.calledWithExactly(instance._throttledUpdateSearch);
            assert.isFalse(instance._itemsChanged);
         });

         it('should update everything on the tab and call __inspectElement because the id from the store and id in the state are the same', function () {
            const items = [1, 2, 3];
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves(items),
               getElements: sandbox.stub().returns(items),
               getSelectedId: sandbox.stub().returns(0)
            };
            const options = {
               store,
               selected: false
            };
            const instance = new Elements(options);
            instance._selectedItemId = 0;
            instance._itemsChanged = false;
            instance.saveOptions(options);
            sandbox.stub(instance._model, 'setItems');
            sandbox.stub(instance, '__inspectElement');
            sandbox.stub(instance, '_throttledUpdateSearch');

            instance._beforeUpdate({
               ...options,
               selected: true
            });

            sinon.assert.calledWithExactly(instance._model.setItems, items);
            sinon.assert.calledWithExactly(instance.__inspectElement, store);
            sinon.assert.calledWithExactly(instance._throttledUpdateSearch);
            assert.isFalse(instance._itemsChanged);
         });

         it("should update everything on the tab and call __inspectElement because the item with the id from the store doesn't exist", function () {
            const items = [
               {
                  id: 1
               },
               {
                  id: 2
               },
               {
                  id: 3
               }
            ];
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves(items),
               getElements: sandbox.stub().returns(items),
               getSelectedId: sandbox.stub().returns(0)
            };
            const options = {
               store,
               selected: false
            };
            const instance = new Elements(options);
            instance._itemsChanged = false;
            instance.saveOptions(options);
            sandbox.stub(instance._model, 'setItems');
            sandbox.stub(instance, '__inspectElement');
            sandbox.stub(instance, '_throttledUpdateSearch');

            instance._beforeUpdate({
               ...options,
               selected: true
            });

            sinon.assert.calledWithExactly(instance._model.setItems, items);
            sinon.assert.calledWithExactly(instance.__inspectElement, store);
            sinon.assert.calledWithExactly(instance._throttledUpdateSearch);
            assert.isFalse(instance._itemsChanged);
         });

         it('should update everything on the tab and select the item with the id from the store', function () {
            const items = [
               {
                  id: 1
               },
               {
                  id: 2
               },
               {
                  id: 3
               }
            ];
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves(items),
               getElements: sandbox.stub().returns(items),
               getSelectedId: sandbox.stub().returns(1)
            };
            const options = {
               store,
               selected: false
            };
            const instance = new Elements(options);
            instance._itemsChanged = false;
            instance.saveOptions(options);
            sandbox.stub(instance._model, 'setItems');
            sandbox.stub(instance, '__inspectElement');
            sandbox.stub(instance, '_throttledUpdateSearch');
            sandbox.stub(instance, '__selectElement');

            instance._beforeUpdate({
               ...options,
               selected: true
            });

            sinon.assert.calledWithExactly(instance._model.setItems, items);
            sinon.assert.calledWithExactly(instance.__selectElement, 1, store);
            sinon.assert.notCalled(instance.__inspectElement);
            sinon.assert.calledWithExactly(instance._throttledUpdateSearch);
            assert.isFalse(instance._itemsChanged);
         });

         it('should not change anything because the tab was already selected', function () {
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
         });
      });

      describe('_afterRender', function () {
         it('should not do anything because the panel is not selected', function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               },
               selected: false
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._currentIndentationSize = 15;
            instance._children = {
               list: document.createElement('div')
            };

            instance._afterRender();

            assert.equal(instance._currentIndentationSize, 15);
         });

         it("should not do anything because there's no items in the panel", function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._currentIndentationSize = 15;

            instance._afterRender();

            assert.equal(instance._currentIndentationSize, 15);
         });

         function addChild(parent, width, depth) {
            const child = document.createElement('div');
            child.setAttribute('data-depth', depth);

            const innerChild = document.createElement('div');
            innerChild.classList.add('js-devtools-Elements__name');
            sandbox.stub(innerChild, 'clientWidth').value(width);

            child.appendChild(innerChild);

            parent.appendChild(child);
         }

         it('should calculate dynamic indentation based on the width of the children', function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._currentIndentationSize = 15;
            instance._listWidth = 150;
            const list = document.createElement('div');
            sandbox.stub(list.style, 'setProperty');
            sandbox.stub(list, 'clientWidth').value(150);

            addChild(list, 50, 0);
            addChild(list, 60, 1);

            instance._children = {
               list
            };

            instance._afterRender();

            sinon.assert.calledWithExactly(
               list.style.setProperty,
               '--indentation-size',
               '5px'
            );
            assert.equal(instance._currentIndentationSize, 5);
            assert.equal(instance._listWidth, 150);
         });

         it('should calculate dynamic indentation based on the width of the children (should not pick default value even though the list got wider)', function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._currentIndentationSize = 15;
            const list = document.createElement('div');
            sandbox.stub(list.style, 'setProperty');
            sandbox.stub(list, 'clientWidth').value(150);

            addChild(list, 50, 0);
            addChild(list, 60, 1);

            instance._children = {
               list
            };

            instance._afterRender();

            sinon.assert.calledWithExactly(
               list.style.setProperty,
               '--indentation-size',
               '5px'
            );
            assert.equal(instance._currentIndentationSize, 5);
            assert.equal(instance._listWidth, 150);
         });

         it('should use cached children widths', function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               },
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._currentIndentationSize = 15;
            instance._listWidth = 150;
            const list = document.createElement('div');
            sandbox.stub(list.style, 'setProperty');
            sandbox.stub(list, 'clientWidth').value(150);

            addChild(list, 50, 0);
            addChild(list, 60, 1);

            // children don't actually have these widths, so the test is going to fail if cached values aren't used
            instance._elementsWidths.set(list.children[0], 130);
            instance._elementsWidths.set(list.children[1], 141);

            instance._children = {
               list
            };

            instance._afterRender();

            sinon.assert.calledWithExactly(
               list.style.setProperty,
               '--indentation-size',
               '9px'
            );
            assert.equal(instance._currentIndentationSize, 9);
            assert.equal(instance._listWidth, 150);
         });
      });

      describe('_afterUpdate', function () {
         it('should scroll to item', function () {
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
         });
      });

      describe('panelVisibleCallback', function () {
         it('should not do anything, because the panel is not selected', function () {
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves([]),
               dispatch: sandbox.stub()
            };
            const options = {
               store,
               selected: false
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArg(1)
               }
            });

            instance.panelVisibilityCallback(true);
            instance.panelVisibilityCallback(false);

            sinon.assert.notCalled(chrome.devtools.inspectedWindow.eval);
            sinon.assert.notCalled(store.dispatch);
         });

         it('should set $0 on __WASABY_DEV_HOOK__ and then fire getSelectedItem event', function () {
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves([]),
               dispatch: sandbox.stub()
            };
            const options = {
               store,
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub().callsArg(1)
               }
            });

            instance.panelVisibilityCallback(true);

            sinon.assert.calledWith(
               chrome.devtools.inspectedWindow.eval,
               'window.__WASABY_DEV_HOOK__.$0 = $0'
            );
            sinon.assert.calledWith(store.dispatch, 'getSelectedItem');
         });

         it('should disable selection on the page', function () {
            const store = {
               addListener: sandbox.stub(),
               toggleDevtoolsOpened: sandbox.stub(),
               getFullTree: sandbox.stub().resolves([]),
               dispatch: sandbox.stub()
            };
            const options = {
               store,
               selected: true
            };
            const instance = new Elements(options);
            instance.saveOptions(options);

            instance.panelVisibilityCallback(false);

            sinon.assert.calledWith(
               store.dispatch,
               'toggleSelectFromPage',
               false
            );
         });
      });

      describe('_beforeUnmount', function () {
         it('should disable selection on the page, destroy model and cleanup inspectedItem and window', function () {
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
            sandbox.stub(instance, '_notify');

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
            sinon.assert.calledWith(
               instance._notify,
               'unsubFromPanelVisibility',
               [instance.panelVisibilityCallback]
            );
            sinon.assert.calledWith(
               instance._notify,
               'unregister',
               ['controlResize', instance],
               { bubbling: true }
            );
         });
      });

      describe('_afterMount', function () {
         it('should pass event callbacks to parents', function () {
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
            sandbox.stub(instance, '_notify');

            instance._afterMount();

            sinon.assert.calledWith(instance._notify, 'subToPanelVisibility', [
               instance.panelVisibilityCallback
            ]);
            sinon.assert.calledWith(
               instance._notify,
               'register',
               ['controlResize', instance, instance.__updateIndentation],
               { bubbling: true }
            );
         });
      });

      describe('_onItemClick', function () {
         it('should call __selectElement with the passed id', function () {
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
         });
      });

      describe('_onListKeyDown', function () {
         describe('ArrowDown', function () {
            it('should select the next item', function () {
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
            });

            it('should not call __selectElement because this is the last item', function () {
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
            });
         });

         describe('ArrowLeft', function () {
            it('should collapse the selected item', function () {
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
            });

            it('should select the parent of the selected item', function () {
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
            });

            it('should not do anything because this is the root element', function () {
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
            });
         });

         describe('ArrowRight', function () {
            it('should select the first child', function () {
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
            });

            it('should expand the selected item', function () {
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
            });

            it('should not do anything because the selected item does not have children', function () {
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
            });
         });

         describe('ArrowUp', function () {
            it('should select a previous item', function () {
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
            });

            it('should not call __selectElement because this is the first item', function () {
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
            });
         });
      });

      describe('_operationHandler', function () {
         it('should not do anything because the panel is not selected', function () {
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
         });

         it('should call __updateNode with the passed id', function () {
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
         });

         it('should call __highlightNode with the passed id and set _itemsChanged to true', function () {
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
         });

         it('should set _itemsChanged to true and remove selection from the item', function () {
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
         });

         it('should set _itemsChanged to true and without touching selection', function () {
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
         });

         it('should call onOrderChanged', function () {
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
         });
      });

      describe('__updateNode', function () {
         it('should highlight the node without inspecting it', function () {
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
         });

         it('should highlight the node an inspect it', function () {
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
         });
      });

      describe('__highlightElement', function () {
         it('should fire highlightElement event', function () {
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
         });
      });

      describe('__selectElement', function () {
         it('should select the element and toggle select on the page', function () {
            const path = [
               {
                  id: 0,
                  name: 'Test',
                  class: 'devtools-Elements__node_hoc'
               }
            ];
            const tree = [
               {
                  id: 0,
                  name: 'Test'
               }
            ];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(tree),
                  getElements: sandbox.stub().returns(tree),
                  setSelectedId: sandbox.stub()
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._selectingFromPage = true;
            instance._path = undefined;
            instance._selectedItemId = undefined;
            instance._scrollToId = undefined;
            sandbox.stub(instance._model, 'getPath').returns(path);
            sandbox.stub(instance, '__toggleSelectElementFromPage');
            sandbox.stub(instance, '__inspectElement');
            sandbox.stub(instance._model, 'expandParents');

            instance.__selectElement(0);

            sinon.assert.calledWithExactly(
               instance.__toggleSelectElementFromPage,
               options.store
            );
            sinon.assert.calledWithExactly(instance._model.expandParents, 0);
            assert.equal(instance._path, path);
            assert.equal(instance._selectedItemId, 0);
            assert.equal(instance._scrollToId, 0);
            sinon.assert.calledWithExactly(
               instance.__inspectElement,
               options.store
            );
            sinon.assert.calledWithExactly(options.store.setSelectedId, 0);
         });

         it('should select the element without toggling select on the page', function () {
            const path = [
               {
                  id: 0,
                  name: 'Test',
                  class: 'devtools-Elements__node_hoc'
               }
            ];
            const tree = [
               {
                  id: 0,
                  name: 'Test'
               }
            ];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(tree),
                  getElements: sandbox.stub().returns(tree),
                  setSelectedId: sandbox.stub()
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
               inspectElementStub.calledOnceWithExactly(options.store)
            );
            sinon.assert.calledWithExactly(options.store.setSelectedId, 0);
         });
      });

      describe('__highlightNode', function () {
         it('should not call highlightUpdate because the child with this id does not exist', function () {
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
         });

         it('should call highlight update because the child with this id exists', function () {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            const child = {};
            sandbox
               .stub(instance._model, 'isVisible')
               .withArgs(0)
               .returns(true);
            instance._children = {
               0: child
            };
            const stub = sandbox.stub(highlightUpdate, 'highlightUpdate');

            instance.__highlightNode(0);

            assert.isTrue(stub.calledOnceWithExactly(child));
         });

         it('should not call highlight update because the child with this id exists but not visible', function () {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            const child = {};
            sandbox
               .stub(instance._model, 'isVisible')
               .withArgs(0)
               .returns(false);
            instance._children = {
               0: child
            };
            sandbox.stub(highlightUpdate, 'highlightUpdate');

            instance.__highlightNode(0);

            sandbox.assert.notCalled(highlightUpdate.highlightUpdate);
         });
      });

      describe('__toggleExpanded', function () {
         it('should stop propagation of the event and call toggleExpanded', function () {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const event = {
               stopPropagation: sandbox.stub(),
               nativeEvent: {
                  altKey: false
               }
            };
            const instance = new Elements(options);
            sandbox.stub(instance._model, 'toggleExpanded');

            instance.__toggleExpanded(event, 0);

            sinon.assert.calledOnce(event.stopPropagation);
            sinon.assert.calledWithExactly(instance._model.toggleExpanded, 0);
         });

         it('should stop propagation of the event and call toggleExpandedRecursive', function () {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const event = {
               stopPropagation: sandbox.stub(),
               nativeEvent: {
                  altKey: true
               }
            };
            const instance = new Elements(options);
            sandbox.stub(instance._model, 'toggleExpandedRecursive');

            instance.__toggleExpanded(event, 0);

            sinon.assert.calledOnce(event.stopPropagation);
            sinon.assert.calledWithExactly(
               instance._model.toggleExpandedRecursive,
               0
            );
         });
      });

      describe('__onEndSynchronization', function () {
         it('should not do anything because the tab is not selected', function () {
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
         });

         it('should set new items and update search', function () {
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
         });

         it('should set new items without updating search', function () {
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
         });
      });

      describe('__toggleSelectElementFromPage', function () {
         it('should fire toggleSelectFromPage event with true', function () {
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
         });

         it('should fire toggleSelectFromPage event with false', function () {
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
         });
      });

      describe('__onSearchValueChanged', function () {
         it('should call __updateSearch with the passed value', function () {
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
         });
      });

      describe('__updateSearch', function () {
         it('should not call selectElement', function () {
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
         });

         it('should call selectElement', function () {
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
         });
      });

      describe('__onSearchKeydown', function () {
         it('should not do anything because a key other than Enter was pressed', function () {
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
         });

         it('should not call selectElement because the next item was not found', function () {
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
         });

         it('should call selectElement', function () {
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
         });
      });

      describe('__inspectElement', function () {
         it('should fire inspectElement event with default params', function () {
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

            sinon.assert.calledWithExactly(
               options.store.dispatch,
               'inspectElement',
               {
                  id: 1,
                  expandedTabs,
                  path: undefined
               }
            );
         });

         it('should fire inspectElement event with passed params', function () {
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
               path: ['options']
            });

            sinon.assert.calledWithExactly(
               options.store.dispatch,
               'inspectElement',
               {
                  id: 1,
                  path: ['options'],
                  expandedTabs
               }
            );
         });
      });

      describe('__setInspectedElement', function () {
         it('should not do anything because ids are not the same', function () {
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
         });

         it('should set _inspectedItem', function () {
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
               id: 0,
               type: 'full',
               value: {
                  options: {
                     data: {
                        test: '123'
                     },
                     cleaned: []
                  },
                  events: {
                     data: {
                        mousedown: {
                           function: 'mousedownHandler()',
                           arguments: [1]
                        },
                        click: {
                           function: 'clickHandler()',
                           arguments: []
                        }
                     },
                     cleaned: []
                  }
               }
            });

            assert.deepEqual(instance._inspectedItem, {
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
            });
         });

         it('should merge _inspectedItem and node', function () {
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
                  test: '123'
               }
            };
            instance._inspectedItem = oldInspectedItem;

            instance.__setInspectedElement({
               id: 0,
               type: 'partial',
               value: {
                  changedOptions: {
                     data: {
                        test: '456'
                     },
                     cleaned: []
                  }
               }
            });

            assert.notEqual(instance._inspectedItem, oldInspectedItem);
            assert.deepEqual(instance._inspectedItem, {
               id: 0,
               options: {
                  test: '123'
               },
               changedOptions: {
                  test: '456'
               }
            });
         });
      });

      describe('__getVisibleTabs', function () {
         it('should return empty array', function () {
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
         });

         it('should return array with every tab', function () {
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
         });
      });

      describe('_onDetailsTabExpanded', function () {
         it('should change state to false without calling inspectElement', function () {
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
            sandbox.stub(instance, '__inspectElement');

            instance._onDetailsTabExpanded({}, '_optionsExpanded', false);

            assert.isFalse(instance._optionsExpanded);
            sinon.assert.notCalled(instance.__inspectElement);
         });

         it('should change state to true and call inspectElement with the name of the tab', function () {
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
            sandbox.stub(instance, '__inspectElement');

            instance._onDetailsTabExpanded({}, '_optionsExpanded', true);

            assert.isTrue(instance._optionsExpanded);
            sinon.assert.calledWithExactly(
               instance.__inspectElement,
               options.store,
               {
                  path: ['options']
               }
            );
         });
      });

      describe('_setBreakpoint', function () {
         it('should remove all breakpoints, then add them again.', async function () {
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

            sinon.assert.calledWithExactly(
               options.store.dispatch,
               'setBreakpoint',
               {
                  id: 0,
                  eventName: 'mousedown'
               }
            );
            sinon.assert.notCalled(chrome.devtools.inspectedWindow.eval);

            clock.tick(100);

            sinon.assert.calledWith(
               chrome.devtools.inspectedWindow.eval,
               `${BREAKPOINTS} ? ${BREAKPOINTS}.map(([handler, condition, id]) => {\n                  debug(handler, condition);\n                  return id;\n               }) : []`
            );

            assert.equal(instance._eventWithBreakpoint, 'mousedown');
            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set([0]));

            clock.restore();
         });
      });

      describe('_removeAllBreakpoints', function () {
         it('should remove all breakpoints', async function () {
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

            sinon.assert.calledWith(
               chrome.devtools.inspectedWindow.eval,
               `${BREAKPOINTS} && ${BREAKPOINTS}.forEach(([handler]) => undebug(handler)); ${BREAKPOINTS} = undefined;`
            );
            assert.equal(instance._eventWithBreakpoint, '');
            assert.notEqual(
               instance._elementsWithBreakpoints,
               oldElementsWithBreakpoints
            );
            assert.deepEqual(instance._elementsWithBreakpoints, new Set());
         });
      });

      describe('__removeBreakpoint', function () {
         it("should not do anything because this element doesn't have a breakpoint", async function () {
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
         });

         it('should remove the id from the elementsWithBreakpoints, then remove breakpoints. Should not fail because 0 breakpoints were removed', async function () {
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
         });

         it('should remove the id from the elementsWithBreakpoints, then remove breakpoints. Should not fail if related breakpoints were already removed from elementsWithBreakpoints', async function () {
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
         });

         it('should remove the id from the elementsWithBreakpoints, then remove breakpoints. Also should remove every related breakpoint', async function () {
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves([])
               }
            };
            const instance = new Elements(options);
            instance.saveOptions(options);
            instance._elementsWithBreakpoints.add(0).add(1).add(2).add(3);
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
         });
      });

      describe('_offsetHandler', function () {
         it('should change _offsetWidth on instance and save it', function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               }
            };
            const instance = new Elements(options);
            instance._detailsWidth = 50;
            sandbox.stub(chrome.storage.sync, 'set');

            instance._offsetHandler({}, 150);

            assert.equal(instance._detailsWidth, 200);
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               elementsDetailsWidth: 200
            });
         });
      });

      describe('_onSelectElementFromPageClick', function () {
         it('should call __toggleSelectElementFromPage without arguments', function () {
            const items = [];
            const options = {
               store: {
                  addListener: sandbox.stub(),
                  toggleDevtoolsOpened: sandbox.stub(),
                  getFullTree: sandbox.stub().resolves(items)
               }
            };
            const instance = new Elements(options);
            sandbox.stub(instance, '__toggleSelectElementFromPage');

            instance._onSelectElementFromPageClick();

            sinon.assert.calledWithExactly(
               instance.__toggleSelectElementFromPage
            );
         });
      });
   });
});
