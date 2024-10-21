define(['DevtoolsTest/mockChrome', 'Elements/_Elements/Model'], function(
   mockChrome,
   Model
) {
   let sandbox;
   let instance;
   Model = Model.default;

   describe('Elements/_Elements/Model', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Model();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('setItems', function() {
         it('same items, different order, should update version and copy items', function() {
            const oldItems = [
               {
                  id: 0
               },
               {
                  id: 1,
                  parentId: 0
               },
               {
                  id: 2,
                  parentId: 0
               }
            ];
            const newItems = [
               {
                  id: 0
               },
               {
                  id: 2,
                  parentId: 0
               },
               {
                  id: 1,
                  parentId: 0
               }
            ];
            instance._items = oldItems;
            instance._itemsReordered = true;
            instance._itemsChanged = false;
            const nextVersionStub = sandbox.stub(instance, '__nextVersion');

            instance.setItems(newItems);

            assert.isFalse(instance._itemsReordered);
            assert.isTrue(instance._itemsChanged);
            assert.notEqual(instance._items, oldItems);
            assert.notEqual(instance._items, newItems);
            assert.deepEqual(instance._items, [
               {
                  id: 0
               },
               {
                  id: 2,
                  parentId: 0
               },
               {
                  id: 1,
                  parentId: 0
               }
            ]);
            assert.isTrue(nextVersionStub.calledOnceWithExactly());
         });

         it('should add and remove some items from visible items and expanded items', function() {
            /*
            added: 3, 4
            removed: 2
             */
            const oldItems = [
               {
                  id: 0,
                  depth: 0
               },
               {
                  id: 1,
                  depth: 0
               },
               {
                  id: 2,
                  parentId: 1,
                  depth: 1
               }
            ];
            instance._items = oldItems;
            instance._visibleItems.set(0, oldItems[0]);
            instance._visibleItems.set(1, oldItems[1]);
            instance._visibleItems.set(2, oldItems[2]);
            instance._expandedItems.add(0);
            instance._expandedItems.add(1);
            const newItems = [
               {
                  id: 0,
                  depth: 0
               },
               {
                  id: 3,
                  parentId: 0,
                  depth: 1
               },
               {
                  id: 1,
                  depth: 0
               },
               {
                  id: 4,
                  depth: 0
               }
            ];
            const nextVersionStub = sandbox.stub(instance, '__nextVersion');
            const visibleItemsDeleteStub = sandbox.stub(
               instance._visibleItems,
               'delete'
            );
            const expandedItemsDeleteStub = sandbox.stub(
               instance._expandedItems,
               'delete'
            );
            sandbox.stub(instance, '__getElement').returnsArg(0);
            const updateElementStub = sandbox.stub(instance, '__updateElement');

            instance.setItems(newItems);

            assert.isTrue(instance._itemsChanged);
            assert.notEqual(instance._items, oldItems);
            assert.notEqual(instance._items, newItems);
            assert.deepEqual(instance._items, [
               {
                  id: 0,
                  depth: 0
               },
               {
                  id: 3,
                  parentId: 0,
                  depth: 1
               },
               {
                  id: 1,
                  depth: 0
               },
               {
                  id: 4,
                  depth: 0
               }
            ]);
            assert.isTrue(nextVersionStub.calledOnceWithExactly());
            assert.isTrue(
               updateElementStub.calledWithExactly(0, {
                  hasChildren: true
               })
            );
            assert.isTrue(visibleItemsDeleteStub.calledWithExactly(2));
            assert.isTrue(expandedItemsDeleteStub.calledWithExactly(2));
         });

         it('should add roots to visible items', function() {
            const items = [
               {
                  id: 0,
                  depth: 0
               },
               {
                  id: 1,
                  depth: 0
               },
               {
                  id: 2,
                  parentId: 1,
                  depth: 1
               }
            ];
            const nextVersionStub = sandbox.stub(instance, '__nextVersion');
            const visibleItemsSetStub = sandbox.stub(
               instance._visibleItems,
               'set'
            );
            sandbox.stub(instance, '__getElement').returnsArg(0);

            instance.setItems(items);

            assert.isTrue(instance._itemsChanged);
            assert.notEqual(instance._items, items);
            assert.deepEqual(instance._items, [
               {
                  id: 0,
                  depth: 0
               },
               {
                  id: 1,
                  depth: 0
               },
               {
                  id: 2,
                  parentId: 1,
                  depth: 1
               }
            ]);
            assert.isTrue(nextVersionStub.calledOnceWithExactly());
            assert.isTrue(
               visibleItemsSetStub.calledWithExactly(0, {
                  id: 0,
                  depth: 0
               })
            );
            assert.isTrue(
               visibleItemsSetStub.calledWithExactly(1, {
                  id: 1,
                  depth: 0
               })
            );
         });

         it('should clear visible and expanded items', function() {
            instance._items = [
               {
                  id: 0
               },
               {
                  id: 1,
                  parentId: 0
               },
               {
                  id: 2,
                  parentId: 1
               }
            ];
            const nextVersionStub = sandbox.stub(instance, '__nextVersion');
            const visibleItemsClearStub = sandbox.stub(
               instance._visibleItems,
               'clear'
            );
            const expandedItemsClearStub = sandbox.stub(
               instance._expandedItems,
               'clear'
            );

            instance.setItems([]);

            assert.deepEqual(instance._items, []);
            assert.isTrue(nextVersionStub.calledOnceWithExactly());
            assert.isTrue(visibleItemsClearStub.calledOnceWithExactly());
            assert.isTrue(expandedItemsClearStub.calledOnceWithExactly());
         });

         it("should update parent's hasChildren property", function() {
            const oldItems = [
               {
                  id: 0,
                  depth: 0
               }
            ];
            instance._items = oldItems;
            instance._visibleItems.set(0, oldItems[0]);
            const newItems = [
               oldItems[0],
               {
                  id: 1,
                  parentId: 0,
                  depth: 1
               },
               {
                  id: 2,
                  parentId: 1,
                  depth: 2
               }
            ];
            sandbox.stub(instance, '__nextVersion');
            sandbox.stub(instance, '__getElement').returnsArg(0);
            sandbox.stub(instance, '__updateElement');

            instance.setItems(newItems);

            assert.isTrue(instance._itemsChanged);
            assert.notEqual(instance._items, oldItems);
            assert.notEqual(instance._items, newItems);
            assert.deepEqual(instance._items, [
               {
                  id: 0,
                  depth: 0
               },
               {
                  id: 1,
                  parentId: 0,
                  depth: 1
               },
               {
                  id: 2,
                  parentId: 1,
                  depth: 2
               }
            ]);
            sinon.assert.calledOnce(instance.__nextVersion);
            sinon.assert.calledWithExactly(instance.__updateElement, 0, {
               hasChildren: true
            });
            assert.deepEqual(
               instance._visibleItems,
               new Map([
                  [
                     0,
                     {
                        id: 0,
                        depth: 0
                     }
                  ]
               ])
            );
         });

         it("should update parent's hasChildren property and add new children to visible items", function() {
            const oldItems = [
               {
                  id: 0,
                  depth: 0
               }
            ];
            instance._items = oldItems;
            instance._visibleItems.set(0, oldItems[0]);
            instance._expandedItems.add(0);
            const newItems = [
               oldItems[0],
               {
                  id: 1,
                  parentId: 0,
                  depth: 1
               },
               {
                  id: 2,
                  parentId: 1,
                  depth: 2
               }
            ];
            sandbox.stub(instance, '__nextVersion');
            sandbox.stub(instance, '__getElement').returnsArg(0);
            sandbox.stub(instance, '__updateElement');

            instance.setItems(newItems);

            assert.isTrue(instance._itemsChanged);
            assert.notEqual(instance._items, oldItems);
            assert.notEqual(instance._items, newItems);
            assert.deepEqual(instance._items, [
               {
                  id: 0,
                  depth: 0
               },
               {
                  id: 1,
                  parentId: 0,
                  depth: 1
               },
               {
                  id: 2,
                  parentId: 1,
                  depth: 2
               }
            ]);
            sinon.assert.calledOnce(instance.__nextVersion);
            sinon.assert.calledWithExactly(instance.__updateElement, 0, {
               hasChildren: true
            });
            sinon.assert.calledWithExactly(instance.__updateElement, 1, {
               hasChildren: true
            });
            assert.deepEqual(
               instance._visibleItems,
               new Map([
                  [
                     0,
                     {
                        id: 0,
                        depth: 0
                     }
                  ],
                  [
                     1,
                     {
                        id: 1,
                        parentId: 0,
                        depth: 1
                     }
                  ]
               ])
            );
         });
      });

      describe('onOrderChanged', function() {
         it('should set _itemsReordered to true', function() {
            instance._itemsReordered = false;

            instance.onOrderChanged();

            assert.isTrue(instance._itemsReordered);
         });
      });

      describe('toggleExpanded', function() {
         it('should delete item and its children from expanded and visible items and update version', function() {
            instance._itemsChanged = false;
            instance._expandedItems.add(0);
            const expandedDeleteStub = sandbox.stub(
               instance._expandedItems,
               'delete'
            );
            const visibleDeleteStub = sandbox.stub(
               instance._visibleItems,
               'delete'
            );
            const updateElementStub = sandbox.stub(instance, '__updateElement');
            sandbox
               .stub(instance, '__getChildren')
               .withArgs(0)
               .returns([
                  {
                     id: 1
                  },
                  {
                     id: 2
                  }
               ]);
            const nextVersionStub = sandbox.stub(instance, '__nextVersion');

            instance.toggleExpanded(0);

            assert.isTrue(expandedDeleteStub.calledWithExactly(0));
            assert.isTrue(
               updateElementStub.calledOnceWithExactly(0, {
                  isExpanded: false
               })
            );
            assert.isTrue(expandedDeleteStub.calledWithExactly(1));
            assert.isTrue(expandedDeleteStub.calledWithExactly(2));
            assert.isTrue(visibleDeleteStub.calledWithExactly(1));
            assert.isTrue(visibleDeleteStub.calledWithExactly(2));
            assert.isTrue(nextVersionStub.calledOnceWithExactly());
            assert.isTrue(instance._itemsChanged);
         });

         it('should add elements, its children, parent and siblings', function() {
            const item = {
               id: 1
            };
            const parent = {
               id: 0
            };
            const child = {
               id: 2
            };
            const sibling = {
               id: 3
            };
            instance._itemsChanged = false;
            const expandedAddStub = sandbox.stub(
               instance._expandedItems,
               'add'
            );
            const visibleSetStub = sandbox.stub(instance._visibleItems, 'set');
            const updateElementStub = sandbox.stub(instance, '__updateElement');
            const getImmediateChildrenStub = sandbox.stub(
               instance,
               '__getImmediateChildren'
            );
            getImmediateChildrenStub.withArgs(1).returns([child]);
            getImmediateChildrenStub.withArgs(0).returns([item, sibling]);
            sandbox.stub(instance, '__getElement').returnsArg(0);
            sandbox
               .stub(instance, 'getPath')
               .withArgs(1)
               .returns([parent, item]);
            const nextVersionStub = sandbox.stub(instance, '__nextVersion');

            instance.toggleExpanded(1);

            assert.isTrue(expandedAddStub.calledWithExactly(1));
            assert.isTrue(
               updateElementStub.calledWithExactly(1, {
                  isExpanded: true
               })
            );
            assert.isTrue(visibleSetStub.calledWithExactly(2, child));
            assert.isTrue(expandedAddStub.calledWithExactly(0));
            assert.isTrue(
               updateElementStub.calledWithExactly(0, {
                  isExpanded: true
               })
            );
            assert.isTrue(visibleSetStub.calledWithExactly(3, sibling));
            assert.isTrue(nextVersionStub.calledOnceWithExactly());
            assert.isTrue(instance._itemsChanged);
         });
      });

      describe('toggleExpandedRecursive', function() {
         it('should delete item and its children from expanded and visible items and update version', function() {
            instance._itemsChanged = false;
            instance._expandedItems.add(0);
            sandbox.stub(instance._expandedItems, 'delete');
            sandbox.stub(instance._visibleItems, 'delete');
            sandbox.stub(instance, '__updateElement');
            sandbox
               .stub(instance, '__getChildren')
               .withArgs(0)
               .returns([
                  {
                     id: 1
                  },
                  {
                     id: 2
                  }
               ]);
            sandbox.stub(instance, '__nextVersion');

            instance.toggleExpandedRecursive(0);

            sinon.assert.calledWithExactly(instance._expandedItems.delete, 0);
            sinon.assert.calledWithExactly(instance.__updateElement, 0, {
               isExpanded: false
            });
            sinon.assert.calledWithExactly(instance._expandedItems.delete, 1);
            sinon.assert.calledWithExactly(instance._expandedItems.delete, 2);
            sinon.assert.calledWithExactly(instance._visibleItems.delete, 1);
            sinon.assert.calledWithExactly(instance._visibleItems.delete, 2);
            sinon.assert.calledOnce(instance.__nextVersion);
            assert.isTrue(instance._itemsChanged);
         });

         it('should expand all elements in the subtree', function() {
            const item = {
               id: 1,
               depth: 1
            };
            const parent = {
               id: 0,
               depth: 0
            };
            const child = {
               id: 2,
               depth: 2
            };
            const grandChild = {
               id: 4,
               depth: 3
            };
            const sibling = {
               id: 3,
               depth: 1
            };
            instance._itemsChanged = false;
            sandbox.stub(instance._expandedItems, 'add');
            sandbox.stub(instance, '__updateElement');
            sandbox.stub(instance, '__getElement').returnsArg(0);
            sandbox.stub(instance, '__nextVersion');
            instance._items = [parent, item, child, grandChild, sibling];

            instance.toggleExpandedRecursive(1);

            sinon.assert.calledWithExactly(instance._expandedItems.add, 1);
            sinon.assert.calledWithExactly(instance._expandedItems.add, 2);
            sinon.assert.calledWithExactly(instance._expandedItems.add, 4);
            sinon.assert.calledWithExactly(instance.__updateElement, 1, {
               isExpanded: true
            });
            sinon.assert.calledWithExactly(instance.__updateElement, 2, {
               isExpanded: true
            });
            sinon.assert.calledWithExactly(instance.__updateElement, 4, {
               isExpanded: true
            });
            sinon.assert.calledOnce(instance.__nextVersion);
            assert.isTrue(instance._itemsChanged);
         });
      });

      describe('getPath', function() {
         it('should return path', function() {
            instance._items = [
               {
                  id: 0,
                  depth: 0,
                  name: '0',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 1,
                  depth: 1,
                  name: '1',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 2,
                  depth: 2,
                  name: '2',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 3,
                  depth: 2,
                  name: '3',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 4,
                  depth: 3,
                  name: '4',
                  class: 'devtools-Elements__node_control'
               }
            ];

            assert.deepEqual(instance.getPath(3), [
               {
                  id: 0,
                  name: '0',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 1,
                  name: '1',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 3,
                  name: '3',
                  class: 'devtools-Elements__node_control'
               }
            ]);
         });

         it('should throw error', function() {
            instance._items = [
               {
                  id: 0,
                  depth: 0,
                  name: '0',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 1,
                  depth: 1,
                  name: '1',
                  class: 'devtools-Elements__node_control'
               },
               {
                  id: 2,
                  depth: 2,
                  name: '2',
                  class: 'devtools-Elements__node_control'
               }
            ];

            assert.throws(
               () => instance.getPath(3),
               'Trying to find nonexistent item'
            );
         });
      });

      describe('getVisibleItems', function() {
         it('should convert visible items to array and return it', function() {
            instance._itemsChanged = true;
            const visibleItems = [];
            sandbox
               .stub(instance, '__visibleItemsToArray')
               .returns(visibleItems);

            assert.equal(instance.getVisibleItems(), visibleItems);
            assert.isFalse(instance._itemsChanged);
         });

         it('should return the cached array of visible items', function() {
            instance._itemsChanged = false;
            const visibleItems = [];
            instance._visibleItemsArray = visibleItems;
            const stub = sandbox.stub(instance, '__visibleItemsToArray');

            assert.equal(instance.getVisibleItems(), visibleItems);
            assert.isTrue(stub.notCalled);
            assert.isFalse(instance._itemsChanged);
         });
      });

      describe('expandParents', function() {
         it('should toggle the parent', function() {
            instance._items = [
               {
                  id: 0,
                  name: '0'
               },
               {
                  id: 1,
                  parentId: 0,
                  name: '1'
               },
               {
                  id: 2,
                  parentId: 1,
                  name: '2'
               }
            ];
            const stub = sandbox.stub(instance, 'toggleExpanded');

            instance.expandParents(2);

            assert.isTrue(stub.calledOnceWithExactly(1, true));
         });

         it('should not do anything if an element does not have a parent', function() {
            instance._items = [
               {
                  id: 0,
                  name: '0'
               },
               {
                  id: 1,
                  parentId: 0,
                  name: '1'
               },
               {
                  id: 2,
                  parentId: 1,
                  name: '2'
               }
            ];
            const stub = sandbox.stub(instance, 'toggleExpanded');

            instance.expandParents(0);

            assert.isTrue(stub.notCalled);
         });
      });

      describe('destructor', function() {
         it('should clear state', function() {
            instance._items = [1, 2, 3];
            const visibleItemsClearStub = sandbox.stub(
               instance._visibleItems,
               'clear'
            );
            const expandedItemsClearStub = sandbox.stub(
               instance._expandedItems,
               'clear'
            );

            instance.destructor();

            assert.deepEqual(instance._items, []);
            assert.isTrue(visibleItemsClearStub.calledOnceWithExactly());
            assert.isTrue(expandedItemsClearStub.calledOnceWithExactly());
         });
      });

      describe('__nextVersion', function() {
         it('should increment version by 1', function() {
            instance._version = 2;

            instance.__nextVersion();

            assert.equal(instance._version, 3);
         });
      });

      describe('__getChildren', function() {
         it('should return every child', function() {
            instance._items = [
               {
                  id: 0
               },
               {
                  id: 1,
                  parentId: 0
               },
               {
                  id: 2,
                  parentId: 1
               },
               {
                  id: 3,
                  parentId: 1
               },
               {
                  id: 4,
                  parentId: 3
               }
            ];
            sandbox.stub(instance, '__getElement').returnsArg(0);

            assert.deepEqual(instance.__getChildren(1), [
               {
                  id: 2,
                  parentId: 1
               },
               {
                  id: 3,
                  parentId: 1
               },
               {
                  id: 4,
                  parentId: 3
               }
            ]);
         });
      });

      describe('__getImmediateChildren', function() {
         it('should return only children from the nearest depth', function() {
            instance._items = [
               {
                  id: 0
               },
               {
                  id: 1,
                  parentId: 0
               },
               {
                  id: 2,
                  parentId: 1
               },
               {
                  id: 3,
                  parentId: 1
               },
               {
                  id: 4,
                  parentId: 3
               }
            ];

            assert.deepEqual(instance.__getImmediateChildren(1), [
               {
                  id: 2,
                  parentId: 1
               },
               {
                  id: 3,
                  parentId: 1
               }
            ]);
         });
      });

      describe('__getElement', function() {
         it('should return new item', function() {
            const originalElement = {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               logicParentId: 0
            };
            sandbox.stub(instance, '__getImmediateChildren').returns([]);

            const result = instance.__getElement(originalElement);

            assert.notEqual(result, originalElement);
            assert.deepEqual(result, {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               logicParentId: 0,
               isExpanded: false,
               hasChildren: false
            });
         });

         it('should return new item', function() {
            const originalElement = {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1
            };
            const element = {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               isExpanded: false,
               hasChildren: false
            };
            instance._visibleItems.set(2, element);

            const result = instance.__getElement(originalElement);

            assert.equal(result, element);
            assert.deepEqual(result, {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               isExpanded: false,
               hasChildren: false
            });
         });
      });

      describe('__updateElement', function() {
         it('should update visible element', function() {
            const element = {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               isExpanded: false,
               hasChildren: false
            };
            instance._visibleItems.set(2, element);

            const result = instance.__updateElement(2, {
               isExpanded: true
            });

            assert.notEqual(result, element);
            assert.deepEqual(result, {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               isExpanded: true,
               hasChildren: false
            });
            assert.equal(instance._visibleItems.get(2), result);
         });

         it('should update hidden element', function() {
            const element = {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               logicParentId: 1
            };
            instance._items = [element];

            const result = instance.__updateElement(2, {
               isExpanded: true
            });

            assert.notEqual(result, element);
            assert.deepEqual(result, {
               id: 2,
               name: 'test',
               depth: 2,
               class: 'devtools-Elements__node_hoc',
               parentId: 1,
               logicParentId: 1,
               isExpanded: true,
               hasChildren: false
            });
            assert.equal(instance._visibleItems.get(2), result);
         });
      });

      describe('_visibleItemsToArray', function() {
         it('should convert _visibleItems to array of items', function() {
            instance._items = [
               {
                  id: 0
               },
               {
                  id: 1
               },
               {
                  id: 2
               },
               {
                  id: 3
               },
               {
                  id: 4
               }
            ];
            instance._visibleItems.set(0, instance._items[0]);
            instance._visibleItems.set(1, instance._items[1]);
            instance._visibleItems.set(2, instance._items[2]);

            assert.deepEqual(instance.__visibleItemsToArray(), [
               {
                  id: 0
               },
               {
                  id: 1
               },
               {
                  id: 2
               }
            ]);
         });
      });
   });
});
