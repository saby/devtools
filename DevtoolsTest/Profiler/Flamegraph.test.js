define([
   'DevtoolsTest/mockChrome',
   'Profiler/_Flamegraph/Flamegraph',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, Flamegraph, entityLib, optionTypesMocks) {
   Flamegraph = Flamegraph.default;
   let sandbox;
   let instance;

   describe('Profiler/_Flamegraph/Flamegraph', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Flamegraph();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_afterMount', function() {
         it('stores container width and calls _updateGraph', function() {
            const options = {};
            instance._container = {
               clientWidth: 100
            };
            instance.saveOptions(options);
            const stub = sandbox.stub(instance, '_updateGraph');

            instance._afterMount();

            assert.equal(instance._containerWidth, 100);
            assert.isTrue(stub.calledOnceWithExactly(options));
         });
      });

      describe('_beforeUpdate', function() {
         it('nothing changed, should not called _updateGraph', function() {
            const snapshot = {};
            const markedKey = '1';
            const oldOptions = {
               snapshot,
               markedKey
            };
            const newOptions = {
               snapshot,
               markedKey
            };
            instance.saveOptions(oldOptions);
            const stub = sandbox.stub(instance, '_updateGraph');

            instance._beforeUpdate(newOptions);

            assert.isTrue(stub.notCalled);
         });

         it('snapshot changed, should update graph', function() {
            const snapshot = {};
            const markedKey = '1';
            const oldOptions = {
               snapshot,
               markedKey
            };
            const newOptions = {
               snapshot: {},
               markedKey
            };
            instance.saveOptions(oldOptions);
            const stub = sandbox.stub(instance, '_updateGraph');

            instance._beforeUpdate(newOptions);

            assert.isTrue(stub.calledOnceWithExactly(newOptions));
         });

         it('markedKey changed, should update graph', function() {
            const snapshot = {};
            const markedKey = '1';
            const oldOptions = {
               snapshot,
               markedKey
            };
            const newOptions = {
               snapshot,
               markedKey: '2'
            };
            instance.saveOptions(oldOptions);
            const stub = sandbox.stub(instance, '_updateGraph');

            instance._beforeUpdate(newOptions);

            assert.isTrue(stub.calledOnceWithExactly(newOptions));
         });

         it('snapshot and markedKey changed, should update graph', function() {
            const snapshot = {};
            const markedKey = '1';
            const oldOptions = {
               snapshot,
               markedKey
            };
            const newOptions = {
               snapshot: {},
               markedKey: '2'
            };
            instance.saveOptions(oldOptions);
            const stub = sandbox.stub(instance, '_updateGraph');

            instance._beforeUpdate(newOptions);

            assert.isTrue(stub.calledOnceWithExactly(newOptions));
         });
      });

      describe('_afterUpdate', function() {
         it('nothing changed, should not change state', function() {
            const markedKey = '1';
            const oldOptions = {
               markedKey
            };
            const newOptions = {
               markedKey
            };
            instance.saveOptions(newOptions);
            instance._container = {
               clientWidth: 10
            };
            instance._containerWidth = 10;
            Object.seal(instance);

            assert.doesNotThrow(() => instance._afterUpdate(oldOptions));
         });

         it('should update _containerWidth and update graph', function() {
            const markedKey = '1';
            const oldOptions = {
               markedKey
            };
            const newOptions = {
               markedKey
            };
            instance.saveOptions(newOptions);
            instance._container = {
               clientWidth: 100
            };
            instance._containerWidth = 10;
            const stub = sandbox.stub(instance, '_updateGraph');

            instance._afterUpdate(oldOptions);

            assert.equal(instance._containerWidth, 100);
            assert.isTrue(stub.calledOnceWithExactly(newOptions));
         });

         it("marked key changed, but a child with this key doesn't exist, so this should not throw", function() {
            const markedKey = '1';
            const oldOptions = {
               markedKey
            };
            const newOptions = {
               markedKey: '2'
            };
            instance.saveOptions(newOptions);
            instance._container = {
               clientWidth: 10
            };
            instance._containerWidth = 10;
            Object.seal(instance);

            assert.doesNotThrow(() => instance._afterUpdate(oldOptions));
         });

         it('marked key changed, the child should scroll into view without focusing', function() {
            const markedKey = '1';
            const oldOptions = {
               markedKey
            };
            const newOptions = {
               markedKey: '2'
            };
            instance.saveOptions(newOptions);
            instance._container = {
               clientWidth: 10
            };
            instance._containerWidth = 10;
            instance._children = {
               '2': {
                  scrollIntoView: sandbox.stub(),
                  focus: sandbox.stub()
               }
            };
            instance._shouldRestoreFocus = false;

            instance._afterUpdate(oldOptions);

            assert.isTrue(
               instance._children['2'].scrollIntoView.calledOnceWithExactly({
                  block: 'nearest',
                  inline: 'nearest'
               })
            );
            assert.isTrue(instance._children['2'].focus.notCalled);
         });

         it('marked key changed, the child should scroll into view and focus', function() {
            const markedKey = '1';
            const oldOptions = {
               markedKey
            };
            const newOptions = {
               markedKey: '2'
            };
            instance.saveOptions(newOptions);
            instance._container = {
               clientWidth: 10
            };
            instance._containerWidth = 10;
            instance._children = {
               '2': {
                  scrollIntoView: sandbox.stub(),
                  focus: sandbox.stub()
               }
            };
            instance._shouldRestoreFocus = true;

            instance._afterUpdate(oldOptions);

            assert.isTrue(
               instance._children['2'].scrollIntoView.calledOnceWithExactly({
                  block: 'nearest',
                  inline: 'nearest'
               })
            );
            assert.isFalse(instance._shouldRestoreFocus);
            assert.isTrue(
               instance._children['2'].focus.calledOnceWithExactly()
            );
         });
      });

      describe('_onMarkedKeyChanged', function() {
         it('should stop propagation of the event and fire markedKeyChanged event', function() {
            const event = {
               stopPropagation: sandbox.stub()
            };
            const stub = sandbox.stub(instance, '_notify');

            instance._onMarkedKeyChanged(event, '1');

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(
               stub.calledOnceWithExactly('markedKeyChanged', ['1'])
            );
         });
      });

      describe('_updateGraph', function() {
         it('should generate data for the whole tree', function() {
            const options = {
               markedKey: undefined,
               snapshot: [
                  {
                     id: '0',
                     depth: 0,
                     name: 'Application',
                     selfDuration: 50,
                     actualDuration: 50,
                     actualBaseDuration: 100,
                     updateReason: 'forceUpdated'
                  },
                  {
                     id: '1',
                     depth: 1,
                     parentId: '0',
                     name: 'Text',
                     selfDuration: 10,
                     actualDuration: 0,
                     actualBaseDuration: 10,
                     updateReason: 'unchanged'
                  },
                  {
                     id: '2',
                     depth: 1,
                     parentId: '0',
                     name: 'List',
                     selfDuration: 10,
                     actualDuration: 40,
                     actualBaseDuration: 40,
                     updateReason: 'selfUpdated'
                  },
                  {
                     id: '3',
                     depth: 2,
                     parentId: '2',
                     name: 'ListItem',
                     selfDuration: 10,
                     actualDuration: 10,
                     actualBaseDuration: 10,
                     updateReason: 'parentUpdated'
                  },
                  {
                     id: '4',
                     depth: 2,
                     parentId: '2',
                     name: 'ListItem',
                     selfDuration: 10,
                     actualDuration: 10,
                     actualBaseDuration: 30,
                     updateReason: 'parentUpdated'
                  },
                  {
                     id: '5',
                     depth: 3,
                     parentId: '4',
                     name: 'ContentTemplate',
                     selfDuration: 20,
                     actualDuration: 0,
                     actualBaseDuration: 20,
                     updateReason: 'unchanged'
                  }
               ]
            };
            instance._containerWidth = 200;

            instance._updateGraph(options);

            assert.equal(instance._maxTreeDuration, 100);
            assert.equal(instance._maxSelfDuration, 50);
            assert.deepEqual(instance._depthToItemData, [
               [
                  {
                     id: '0',
                     parentId: undefined,
                     leftOffset: 0,
                     width: 200,
                     style: 'width: 200px; left: 0px; top: 0px;',
                     class: 'devtools-reason_background_forceUpdated',
                     tooltip: 'Application 50.00ms of 50.00ms',
                     caption: 'Application (50.00ms)',
                     isSelected: false,
                     warnings: undefined
                  }
               ],
               [
                  {
                     id: '1',
                     parentId: '0',
                     leftOffset: 0,
                     width: 20,
                     style: 'width: 20px; left: 0px; top: 20px;',
                     class: 'devtools-reason_background_unchanged',
                     tooltip: 'Text',
                     caption: '',
                     isSelected: false,
                     warnings: undefined
                  },
                  {
                     id: '2',
                     parentId: '0',
                     leftOffset: 20,
                     width: 80,
                     style: 'width: 80px; left: 20px; top: 20px;',
                     class: 'devtools-reason_background_selfUpdated',
                     tooltip: 'List 10.00ms of 40.00ms',
                     caption: 'List',
                     isSelected: false,
                     warnings: undefined
                  }
               ],
               [
                  {
                     id: '3',
                     parentId: '2',
                     leftOffset: 20,
                     width: 20,
                     style: 'width: 20px; left: 20px; top: 40px;',
                     class: 'devtools-reason_background_parentUpdated',
                     tooltip: 'ListItem 10.00ms of 10.00ms',
                     caption: '',
                     isSelected: false,
                     warnings: undefined
                  },
                  {
                     id: '4',
                     parentId: '2',
                     leftOffset: 40,
                     width: 60,
                     style: 'width: 60px; left: 40px; top: 40px;',
                     class: 'devtools-reason_background_parentUpdated',
                     tooltip: 'ListItem 10.00ms of 10.00ms',
                     caption: 'ListItem',
                     isSelected: false,
                     warnings: undefined
                  }
               ],
               [
                  {
                     id: '5',
                     parentId: '4',
                     leftOffset: 40,
                     width: 40,
                     style: 'width: 40px; left: 40px; top: 60px;',
                     class: 'devtools-reason_background_unchanged',
                     tooltip: 'ContentTemplate',
                     caption: 'ContentTemplate',
                     isSelected: false,
                     warnings: undefined
                  }
               ]
            ]);
         });

         it('should only generate data for the selected subtree', function() {
            const options = {
               markedKey: '2',
               snapshot: [
                  {
                     id: '0',
                     depth: 0,
                     name: 'Application',
                     selfDuration: 50,
                     actualDuration: 50,
                     actualBaseDuration: 100,
                     updateReason: 'forceUpdated',
                     warnings: undefined
                  },
                  {
                     id: '1',
                     depth: 1,
                     parentId: '0',
                     name: 'Text',
                     selfDuration: 10,
                     actualDuration: 0,
                     actualBaseDuration: 10,
                     updateReason: 'unchanged',
                     warnings: ['domUnchanged']
                  },
                  {
                     id: '2',
                     depth: 1,
                     parentId: '0',
                     name: 'List',
                     selfDuration: 10,
                     actualDuration: 40,
                     actualBaseDuration: 40,
                     updateReason: 'selfUpdated',
                     warnings: undefined
                  },
                  {
                     id: '3',
                     depth: 2,
                     parentId: '2',
                     name: 'ListItem',
                     selfDuration: 10,
                     actualDuration: 10,
                     actualBaseDuration: 10,
                     updateReason: 'parentUpdated',
                     warnings: ['domUnchanged']
                  },
                  {
                     id: '4',
                     depth: 2,
                     parentId: '2',
                     name: 'ListItem',
                     selfDuration: 10,
                     actualDuration: 10,
                     actualBaseDuration: 30,
                     updateReason: 'parentUpdated',
                     warnings: ['domUnchanged']
                  },
                  {
                     id: '5',
                     depth: 3,
                     parentId: '4',
                     name: 'ContentTemplate',
                     selfDuration: 20,
                     actualDuration: 0,
                     actualBaseDuration: 20,
                     updateReason: 'unchanged',
                     warnings: undefined
                  }
               ]
            };
            instance._containerWidth = 1000;

            instance._updateGraph(options);

            assert.equal(instance._maxTreeDuration, 40);
            assert.equal(instance._maxSelfDuration, 50);
            assert.deepEqual(instance._depthToItemData, [
               [
                  {
                     id: '0',
                     parentId: undefined,
                     leftOffset: 0,
                     width: 2500,
                     style:
                        'width: 2500px; left: 0px; top: 0px;',
                     class: 'devtools-reason_background_forceUpdated',
                     tooltip: 'Application 50.00ms of 50.00ms',
                     caption: 'Application (50.00ms of 50.00ms)',
                     isSelected: false,
                     warnings: undefined
                  }
               ],
               [
                  {
                     id: '2',
                     parentId: '0',
                     leftOffset: 0,
                     width: 1000,
                     style:
                        'width: 1000px; left: 0px; top: 20px;',
                     class: 'devtools-reason_background_selfUpdated',
                     tooltip: 'List 10.00ms of 40.00ms',
                     caption: 'List (10.00ms of 40.00ms)',
                     isSelected: true,
                     warnings: undefined
                  }
               ],
               [
                  {
                     id: '3',
                     parentId: '2',
                     leftOffset: 0,
                     width: 250,
                     style:
                        'width: 250px; left: 0px; top: 40px;',
                     class: 'devtools-reason_background_parentUpdated',
                     tooltip: 'ListItem 10.00ms of 10.00ms',
                     caption: 'ListItem (10.00ms of 10.00ms)',
                     isSelected: false,
                     warnings: ['domUnchanged']
                  },
                  {
                     id: '4',
                     parentId: '2',
                     leftOffset: 250,
                     width: 750,
                     style:
                        'width: 750px; left: 250px; top: 40px;',
                     class: 'devtools-reason_background_parentUpdated',
                     tooltip: 'ListItem 10.00ms of 10.00ms',
                     caption: 'ListItem (10.00ms of 10.00ms)',
                     isSelected: false,
                     warnings: ['domUnchanged']
                  }
               ],
               [
                  {
                     id: '5',
                     parentId: '4',
                     leftOffset: 250,
                     width: 500,
                     style:
                        'width: 500px; left: 250px; top: 60px;',
                     class: 'devtools-reason_background_unchanged',
                     tooltip: 'ContentTemplate',
                     caption: 'ContentTemplate',
                     isSelected: false,
                     warnings: undefined
                  }
               ]
            ]);
         });

         it('should filter out narrow items', function() {
            const options = {
               markedKey: undefined,
               snapshot: [
                  {
                     id: '0',
                     depth: 0,
                     name: 'Application',
                     selfDuration: 50,
                     actualDuration: 50,
                     actualBaseDuration: 100,
                     updateReason: 'forceUpdated'
                  },
                  {
                     id: '1',
                     depth: 1,
                     parentId: '0',
                     name: 'Text',
                     selfDuration: 4,
                     actualDuration: 0,
                     actualBaseDuration: 4,
                     updateReason: 'unchanged'
                  },
                  {
                     id: '2',
                     depth: 1,
                     parentId: '0',
                     name: 'Text',
                     selfDuration: 46,
                     actualDuration: 46,
                     actualBaseDuration: 46,
                     updateReason: 'selfUpdated'
                  }
               ]
            };
            instance._containerWidth = 100;

            instance._updateGraph(options);

            assert.equal(instance._maxTreeDuration, 100);
            assert.equal(instance._maxSelfDuration, 50);
            assert.deepEqual(instance._depthToItemData, [
               [
                  {
                     id: '0',
                     parentId: undefined,
                     leftOffset: 0,
                     width: 100,
                     style:
                        'width: 100px; left: 0px; top: 0px;',
                     class: 'devtools-reason_background_forceUpdated',
                     tooltip: 'Application 50.00ms of 50.00ms',
                     caption: 'Application',
                     isSelected: false,
                     warnings: undefined
                  }
               ],
               [
                  {
                     id: '2',
                     parentId: '0',
                     leftOffset: 0,
                     width: 46,
                     style:
                        'width: 46px; left: 0px; top: 20px;',
                     class: 'devtools-reason_background_selfUpdated',
                     tooltip: 'Text 46.00ms of 46.00ms',
                     caption: 'Text',
                     isSelected: false,
                     warnings: undefined
                  }
               ]
            ]);
         });
      });

      describe('_onKeyDown', function() {
         it('marked key is undefined so nothing should change', function() {
            instance.saveOptions({});
            Object.seal(instance);

            assert.doesNotThrow(() => instance._onKeyDown({}));
         });

         it('unsupported key, should not stop propagation or change markedKey', function() {
            const event = {
               nativeEvent: {
                  key: 'Enter'
               },
               stopPropagation: sandbox.stub()
            };
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               markedKey: '1'
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.notCalled);
            assert.isTrue(stub.notCalled);
         });

         it('should stop propagation of the event and reset markedKey', function() {
            const event = {
               nativeEvent: {
                  key: 'Escape'
               },
               stopPropagation: sandbox.stub()
            };
            const stub = sandbox.stub(instance, '_notify');
            instance.saveOptions({
               markedKey: '1'
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(stub.calledOnceWithExactly('markedKeyChanged'));
         });

         it("ArrowDown, should not change anything because item with markedKey doesn't exist", function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowDown'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  }
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.notCalled);
            assert.isTrue(arrowDownStub.notCalled);
            assert.isTrue(arrowLeftStub.notCalled);
            assert.isTrue(arrowRightStub.notCalled);
            assert.isTrue(arrowUpStub.notCalled);
         });

         it("ArrowLeft, should not change anything because item with markedKey doesn't exist", function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowLeft'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  }
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.notCalled);
            assert.isTrue(arrowDownStub.notCalled);
            assert.isTrue(arrowLeftStub.notCalled);
            assert.isTrue(arrowRightStub.notCalled);
            assert.isTrue(arrowUpStub.notCalled);
         });

         it("ArrowRight, should not change anything because item with markedKey doesn't exist", function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowRight'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  }
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.notCalled);
            assert.isTrue(arrowDownStub.notCalled);
            assert.isTrue(arrowLeftStub.notCalled);
            assert.isTrue(arrowRightStub.notCalled);
            assert.isTrue(arrowUpStub.notCalled);
         });

         it("ArrowUp, should not change anything because item with markedKey doesn't exist", function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowUp'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  }
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.notCalled);
            assert.isTrue(arrowDownStub.notCalled);
            assert.isTrue(arrowLeftStub.notCalled);
            assert.isTrue(arrowRightStub.notCalled);
            assert.isTrue(arrowUpStub.notCalled);
         });

         it('should stop event propagation and call handleArrowDown', function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowDown'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            const selectedItem = {
               id: '1'
            };
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  },
                  selectedItem
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(arrowDownStub.calledOnceWithExactly(selectedItem));
            assert.isTrue(arrowLeftStub.notCalled);
            assert.isTrue(arrowRightStub.notCalled);
            assert.isTrue(arrowUpStub.notCalled);
         });

         it('should stop event propagation and call handleArrowLeft', function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowLeft'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            const selectedItem = {
               id: '1'
            };
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  },
                  selectedItem
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(arrowDownStub.notCalled);
            assert.isTrue(arrowLeftStub.calledOnceWithExactly(selectedItem));
            assert.isTrue(arrowRightStub.notCalled);
            assert.isTrue(arrowUpStub.notCalled);
         });

         it('should stop event propagation and call handleArrowRight', function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowRight'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            const selectedItem = {
               id: '1'
            };
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  },
                  selectedItem
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(arrowDownStub.notCalled);
            assert.isTrue(arrowLeftStub.notCalled);
            assert.isTrue(arrowRightStub.calledOnceWithExactly(selectedItem));
            assert.isTrue(arrowUpStub.notCalled);
         });

         it('should stop event propagation and call handleArrowUp', function() {
            const event = {
               nativeEvent: {
                  key: 'ArrowUp'
               },
               stopPropagation: sandbox.stub()
            };
            const arrowDownStub = sandbox.stub(instance, '__handleArrowDown');
            const arrowLeftStub = sandbox.stub(instance, '__handleArrowLeft');
            const arrowRightStub = sandbox.stub(instance, '__handleArrowRight');
            const arrowUpStub = sandbox.stub(instance, '__handleArrowUp');
            const selectedItem = {
               id: '1'
            };
            instance.saveOptions({
               markedKey: '1',
               snapshot: [
                  {
                     id: '2'
                  },
                  selectedItem
               ]
            });

            instance._onKeyDown(event);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(arrowDownStub.notCalled);
            assert.isTrue(arrowLeftStub.notCalled);
            assert.isTrue(arrowRightStub.notCalled);
            assert.isTrue(arrowUpStub.calledOnceWithExactly(selectedItem));
         });
      });

      describe('__handleArrowDown', function() {
         it("the element doesn't have children, so markedKey should not change", function() {
            const selectedItem = {
               id: '1'
            };
            instance.saveOptions({
               snapshot: [
                  {
                     id: '2'
                  }
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );
            Object.seal(instance);

            assert.doesNotThrow(() => instance.__handleArrowDown(selectedItem));

            assert.isTrue(stub.notCalled);
         });

         it('should call __changeMarkedKeyAfterKeydown with the id of the first child', function() {
            const selectedItem = {
               id: '1'
            };
            instance.saveOptions({
               snapshot: [
                  {
                     id: '2',
                     parentId: '1'
                  },
                  {
                     id: '3',
                     parentId: '1'
                  }
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );

            instance.__handleArrowDown(selectedItem);

            assert.isTrue(stub.calledOnceWithExactly('2'));
         });
      });

      describe('__handleArrowUp', function() {
         it('the element is the root, so the marked key should not change', function() {
            const selectedItem = {
               id: '1',
               depth: 0
            };
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );
            Object.seal(instance);

            assert.doesNotThrow(() => instance.__handleArrowUp(selectedItem));
            assert.isTrue(stub.notCalled);
         });

         it('should change marked key', function() {
            const selectedItem = {
               id: '2',
               depth: 1,
               parentId: '1'
            };
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );
            instance._depthToItemData = [
               [
                  {
                     id: '1',
                     depth: 0
                  }
               ],
               [
                  {
                     id: '2',
                     depth: 1,
                     parentId: '1'
                  }
               ]
            ];

            instance.__handleArrowUp(selectedItem);

            assert.isTrue(stub.calledOnceWithExactly('1'));
         });
      });

      describe('__handleArrowLeft', function() {
         it('selectedItem is the leftmost item, so markedKey should not be changed', function() {
            const selectedItem = {
               id: '0',
               depth: 0
            };
            instance.saveOptions({
               snapshot: [
                  selectedItem,
                  {
                     id: '1',
                     depth: 0
                  },
                  {
                     id: '2',
                     depth: 1,
                     parentId: '0'
                  }
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );

            instance.__handleArrowLeft(selectedItem);

            assert.isTrue(stub.notCalled);
         });

         it('next item on the left belongs to a different parent, so markedKey should not be changed', function() {
            const selectedItem = {
               id: '4',
               depth: 1,
               parentId: '3'
            };
            instance.saveOptions({
               snapshot: [
                  {
                     id: '1',
                     depth: 0
                  },
                  {
                     id: '2',
                     depth: 1,
                     parentId: '1'
                  },
                  {
                     id: '3',
                     depth: 0
                  },
                  selectedItem
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );

            instance.__handleArrowLeft(selectedItem);

            assert.isTrue(stub.notCalled);
         });

         it('should select previous item on the same depth', function() {
            const selectedItem = {
               id: '2',
               depth: 1,
               parentId: '0'
            };
            instance.saveOptions({
               snapshot: [
                  {
                     id: '0',
                     depth: 0
                  },
                  {
                     id: '1',
                     depth: 1,
                     parentId: '0'
                  },
                  selectedItem
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );

            instance.__handleArrowLeft(selectedItem);

            assert.isTrue(stub.calledOnceWithExactly('1'));
         });
      });

      describe('__handleArrowRight', function() {
         it('selectedItem is the rightmost item, so markedKey should not be changed', function() {
            const selectedItem = {
               id: '1',
               depth: 0
            };
            instance.saveOptions({
               snapshot: [
                  {
                     id: '0',
                     depth: 0
                  },
                  selectedItem
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );

            instance.__handleArrowRight(selectedItem);

            assert.isTrue(stub.notCalled);
         });

         it('next item on the left belongs to a different parent, so markedKey should not be changed', function() {
            const selectedItem = {
               id: '2',
               depth: 1,
               parentId: '0'
            };
            instance.saveOptions({
               snapshot: [
                  {
                     id: '0',
                     depth: 0
                  },
                  selectedItem,
                  {
                     id: '3',
                     depth: 0
                  },
                  {
                     id: '4',
                     depth: 1,
                     parentId: '3'
                  }
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );

            instance.__handleArrowRight(selectedItem);

            assert.isTrue(stub.notCalled);
         });

         it('should select next item on the same depth', function() {
            const selectedItem = {
               id: '2',
               depth: 1,
               parentId: '0'
            };
            instance.saveOptions({
               snapshot: [
                  {
                     id: '0',
                     depth: 0
                  },
                  selectedItem,
                  {
                     id: '3',
                     depth: 1,
                     parentId: '0'
                  }
               ]
            });
            const stub = sandbox.stub(
               instance,
               '__changeMarkedKeyAfterKeydown'
            );

            instance.__handleArrowRight(selectedItem);

            assert.isTrue(stub.calledOnceWithExactly('3'));
         });
      });

      describe('__changeMarkedKeyAfterKeydown', function() {
         it('should set _shouldRestoreFocus to true and fire markedKeyChanged event', function() {
            instance._shouldRestoreFocus = false;
            const stub = sandbox.stub(instance, '_notify');

            instance.__changeMarkedKeyAfterKeydown('1');

            assert.isTrue(instance._shouldRestoreFocus);
            assert.isTrue(
               stub.calledOnceWithExactly('markedKeyChanged', ['1'])
            );
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Flamegraph.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'snapshot',
               'markedKey',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'snapshot', {
               required: true,
               args: [Array]
            });
            testOption(optionTypes, 'markedKey', {
               args: [Number]
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
