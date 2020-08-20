define([
   'DevtoolsTest/mockChrome',
   'Elements/_store/Store',
   'Devtool/Event/ContentChannel',
   'Extension/Plugins/Elements/const',
   'DevtoolsTest/getJSDOM'
], function(mockChrome, Store_1, ContentChannel, elementsConsts, getJSDOM) {
   let sandbox;
   const { default: Store, applyOperation } = Store_1;
   const needJSDOM = typeof window === 'undefined';

   describe('Elements/_store/Store', function() {
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

      describe('applyOperation', function() {
         const OperationType = elementsConsts.OperationType;
         const ControlType = elementsConsts.ControlType;

         describe('addNode', function() {
            it('should add a new root node', function() {
               const elements = [];
               const args = [
                  OperationType.CREATE,
                  0,
                  'Test',
                  ControlType.CONTROL
               ];

               applyOperation(elements, args);

               assert.deepEqual(elements, [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     logicParentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ]);
            });

            it('should add a new child node to the parent without children', function() {
               const elements = [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ];
               const args = [
                  OperationType.CREATE,
                  1,
                  'Test1',
                  ControlType.TEMPLATE,
                  0,
                  0
               ];

               applyOperation(elements, args);

               assert.deepEqual(elements, [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     parentId: 0,
                     logicParentId: 0,
                     class: 'devtools-Elements__node_template',
                     depth: 1
                  }
               ]);
            });

            it('should add a new child node to the parent with children', function() {
               const elements = [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     parentId: 0,
                     logicParentId: 0,
                     class: 'devtools-Elements__node_template',
                     depth: 1
                  },
                  {
                     id: 2,
                     name: 'Test2',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ];
               const args = [
                  OperationType.CREATE,
                  3,
                  'Test3',
                  ControlType.HOC,
                  0,
                  0
               ];

               applyOperation(elements, args);

               assert.deepEqual(elements, [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     parentId: 0,
                     logicParentId: 0,
                     class: 'devtools-Elements__node_template',
                     depth: 1
                  },
                  {
                     id: 3,
                     name: 'Test3',
                     parentId: 0,
                     logicParentId: 0,
                     class: 'devtools-Elements__node_hoc',
                     depth: 1
                  },
                  {
                     id: 2,
                     name: 'Test2',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ]);
            });

            it('should throw an error because the parent with this id does not exist', function() {
               const elements = [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ];
               const args = [
                  OperationType.CREATE,
                  2,
                  'Test2',
                  ControlType.TEMPLATE,
                  1,
                  0
               ];

               assert.throws(
                  () => applyOperation(elements, args),
                  `Can't find the parent. Element id: 2, parentId: 1, logicParentId: 0, name: Test2`
               );
               assert.deepEqual(elements, [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ]);
            });
         });

         describe('removeNode', function() {
            it('should remove node', function() {
               const elements = [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ];
               const args = [OperationType.DELETE, 0];

               applyOperation(elements, args);

               assert.deepEqual(elements, []);
            });

            it('should not throw or touch elements even if the node does not exist', function() {
               const elements = [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ];
               const args = [OperationType.DELETE, 1];

               assert.doesNotThrow(() => applyOperation(elements, args));

               assert.deepEqual(elements, [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ]);
            });
         });

         describe('reorder', function() {
            it('should not do anything because the order actually did not change', function() {
               const elements = [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     parentId: 0,
                     class: 'devtools-Elements__node_template',
                     depth: 1
                  },
                  {
                     id: 3,
                     name: 'Test3',
                     parentId: 0,
                     class: 'devtools-Elements__node_hoc',
                     depth: 1
                  },
                  {
                     id: 4,
                     name: 'Test4',
                     parentId: 3,
                     class: 'devtools-Elements__node_hoc',
                     depth: 2
                  },
                  {
                     id: 2,
                     name: 'Test2',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ];
               const args = [OperationType.REORDER, 0, 1, 3];

               applyOperation(elements, args);

               assert.deepEqual(elements, [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     parentId: 0,
                     class: 'devtools-Elements__node_template',
                     depth: 1
                  },
                  {
                     id: 3,
                     name: 'Test3',
                     parentId: 0,
                     class: 'devtools-Elements__node_hoc',
                     depth: 1
                  },
                  {
                     id: 4,
                     name: 'Test4',
                     parentId: 3,
                     class: 'devtools-Elements__node_hoc',
                     depth: 2
                  },
                  {
                     id: 2,
                     name: 'Test2',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ]);
            });

            it('should swap the order of 2 children subtrees', function() {
               const elements = [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     parentId: 0,
                     class: 'devtools-Elements__node_template',
                     depth: 1
                  },
                  {
                     id: 3,
                     name: 'Test3',
                     parentId: 0,
                     class: 'devtools-Elements__node_hoc',
                     depth: 1
                  },
                  {
                     id: 4,
                     name: 'Test4',
                     parentId: 3,
                     class: 'devtools-Elements__node_hoc',
                     depth: 2
                  },
                  {
                     id: 2,
                     name: 'Test2',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ];
               const args = [OperationType.REORDER, 0, 3, 1];

               applyOperation(elements, args);

               assert.deepEqual(elements, [
                  {
                     id: 0,
                     name: 'Test',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  },
                  {
                     id: 3,
                     name: 'Test3',
                     parentId: 0,
                     class: 'devtools-Elements__node_hoc',
                     depth: 1
                  },
                  {
                     id: 4,
                     name: 'Test4',
                     parentId: 3,
                     class: 'devtools-Elements__node_hoc',
                     depth: 2
                  },
                  {
                     id: 1,
                     name: 'Test1',
                     parentId: 0,
                     class: 'devtools-Elements__node_template',
                     depth: 1
                  },
                  {
                     id: 2,
                     name: 'Test2',
                     parentId: undefined,
                     class: 'devtools-Elements__node_control',
                     depth: 0
                  }
               ]);
            });
         });
      });

      describe('constructor', function() {
         it('adds correct listeners', function() {
            const channelInnerStub = {
               addListener: sandbox.stub()
            };
            const channelStub = sandbox
               .stub(ContentChannel, 'ContentChannel')
               .returns(channelInnerStub);

            new Store();

            // TODO: слабые проверки, но лучше чем ничего. Непонятно как тестить, что навесились нужные обработчики при этом игнорируя реализацию обработчиков
            assert.isTrue(channelStub.calledWithNew());
            assert.isTrue(channelStub.calledOnceWithExactly('elements'));
            assert.isTrue(channelInnerStub.addListener.calledWith('operation'));
            assert.isTrue(channelInnerStub.addListener.calledWith('endOfTree'));
         });
      });

      describe('dispatch', function() {
         it('should call dispatch of the channel with the arguments passed to it', function() {
            const instance = new Store();
            const stub = sandbox.stub(instance._channel, 'dispatch');

            instance.dispatch('testEvent', [123]);

            assert.isTrue(stub.calledOnceWithExactly('testEvent', [123]));
         });
      });

      describe('addListener', function() {
         it('should call addListener of the channel with the arguments passed to it', function() {
            const handler = () => {};
            const instance = new Store();
            const stub = sandbox.stub(instance._channel, 'addListener');

            instance.addListener('testEvent', handler);

            assert.isTrue(stub.calledOnceWithExactly('testEvent', handler));
         });
      });

      describe('destructor', function() {
         it('should call destructor and clean up elements', function() {
            const instance = new Store();
            const stub = sandbox.stub(instance._channel, 'destructor');
            instance._elements = [1, 2, 3];

            instance.destructor();

            assert.isTrue(stub.calledOnceWithExactly());
            assert.deepEqual(instance._elements, []);
         });
      });

      describe('getElements', function() {
         it('should return elements by reference', function() {
            const instance = new Store();

            assert.equal(instance.getElements(), instance._elements);
         });
      });

      describe('getFullTree', function() {
         it('should return _getElementsPromise because there are no elements yet, but they have already been requested', function() {
            const instance = new Store();
            instance._getElementsPromise = Promise.resolve();

            assert.equal(instance.getFullTree(), instance._getElementsPromise);
         });

         it('should return a promise because there are no elements yet and they were not requested yet', function() {
            const instance = new Store();

            assert.instanceOf(instance.getFullTree(), Promise);
         });

         it('should return resolved promise with elements', async function() {
            const instance = new Store();
            instance._hasFullTree = true;
            instance._elements = [1, 2, 3];

            const result = await instance.getFullTree();

            assert.equal(result, instance._elements);
         });
      });

      describe('toggleDevtoolsOpened', function() {
         it('state is the same, should not do anything', function() {
            const instance = new Store();
            instance._devtoolsOpened = false;
            const stub = sandbox.stub(instance._channel, 'dispatch');

            instance.toggleDevtoolsOpened(false);

            assert.isFalse(instance._devtoolsOpened);
            assert.isTrue(stub.notCalled);
         });

         it('should dispatch devtoolsInitialized event and change state to _devtoolsOpened, then dispatch devtoolsInitialized event every second until the first operation', function() {
            const clock = sinon.useFakeTimers();
            const instance = new Store();
            instance._devtoolsOpened = false;
            let listener;
            sandbox
               .stub(instance._channel, 'addListener')
               .callsFake((eventName, handler) => {
                  assert.equal(eventName, 'operation');
                  listener = handler;
               });
            sandbox
               .stub(instance._channel, 'removeListener')
               .callsFake((eventName, handler) => {
                  assert.equal(eventName, 'operation');
                  assert.equal(handler, listener);
                  listener = undefined;
               });
            sandbox.stub(instance._channel, 'dispatch');

            instance.toggleDevtoolsOpened(true);

            assert.isTrue(instance._devtoolsOpened);
            sinon.assert.calledOnce(instance._channel.dispatch);

            clock.tick(1000);
            sinon.assert.calledTwice(instance._channel.dispatch);
            clock.tick(1000);
            sinon.assert.calledThrice(instance._channel.dispatch);

            listener();

            clock.tick(1000);
            sinon.assert.calledThrice(instance._channel.dispatch);
            sinon.assert.alwaysCalledWithExactly(
               instance._channel.dispatch,
               'devtoolsInitialized'
            );

            // cleanup
            clock.restore();
         });
      });

      describe('setSelectedId', function() {
         it('should store the passed id on the instance', function() {
            const instance = new Store();

            instance.setSelectedId(0);

            assert.equal(instance._selectedId, 0);

            instance.setSelectedId();

            assert.isUndefined(instance._selectedId);

            instance.setSelectedId(123);

            assert.equal(instance._selectedId, 123);
         });
      });

      describe('getSelectedId', function() {
         it('should return instance._selectedId', function() {
            const instance = new Store();
            instance._selectedId = 123;

            assert.equal(instance.getSelectedId(), 123);
         });
      });
   });
});
