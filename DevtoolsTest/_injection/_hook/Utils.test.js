define([
   'injection/_hook/Utils',
   'Extension/Plugins/Elements/const',
   'DevtoolsTest/getJSDOM'
], function(Utils, elementsConst, getJSDOM) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';

   function stubWasabyDevtoolsOptions(value) {
      window.wasabyDevtoolsOptions = value;
   }

   describe('injection/_hook/Utils', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
            global.performance = dom.window.performance;
            global.getComputedStyle = dom.window.getComputedStyle;
            performance.mark = () => {};
            performance.measure = () => {};
            performance.clearMarks = () => {};
            performance.clearMeasures = () => {};
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
            delete global.performance;
            delete global.getComputedStyle;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('startSyncMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions();

            Utils.startSyncMark(1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            Utils.startSyncMark(1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should call performance.mark with the id of the root', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: true
            });

            Utils.startSyncMark(1);

            sinon.assert.calledOnce(performance.mark);
            sinon.assert.calledWithExactly(
               performance.mark,
               'Synchronization 1'
            );

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });
      });

      describe('endSyncMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'measure');
            stubWasabyDevtoolsOptions();

            Utils.endSyncMark(1);

            sinon.assert.notCalled(performance.measure);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'measure');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            Utils.endSyncMark(1);

            sinon.assert.notCalled(performance.measure);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should call performance.measure with the id of the root', function() {
            sandbox.stub(performance, 'measure');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: true
            });

            Utils.endSyncMark(1);

            sinon.assert.calledOnce(performance.measure);
            sinon.assert.calledWithExactly(
               performance.measure,
               'Synchronization',
               'Synchronization 1'
            );

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });
      });

      describe('startMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions();

            Utils.startMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            Utils.startMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         describe('should call performance.mark with the id and the name of the control and the right operation', function() {
            const operations = [
               ['lifecycle'],
               ['unmount', 0],
               ['mount', 1],
               ['reorder', 2],
               ['update', 3]
            ];
            operations.forEach(([operationName, operationCode]) => {
               it(operationName, function() {
                  sandbox.stub(performance, 'mark');
                  stubWasabyDevtoolsOptions({
                     useUserTimingAPI: true
                  });

                  Utils.startMark('Controls/Application', 1, operationCode);

                  sinon.assert.calledOnce(performance.mark);
                  sinon.assert.calledWithExactly(
                     performance.mark,
                     `Controls/Application (${operationName}) 1`
                  );

                  //cleanup
                  delete window.wasabyDevtoolsOptions;
               });
            });
         });
      });

      describe('endMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'measure');
            sandbox.stub(performance, 'clearMarks');
            sandbox.stub(performance, 'clearMeasures');
            stubWasabyDevtoolsOptions();

            Utils.endMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.measure);
            sinon.assert.notCalled(performance.clearMarks);
            sinon.assert.notCalled(performance.clearMeasures);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'measure');
            sandbox.stub(performance, 'clearMarks');
            sandbox.stub(performance, 'clearMeasures');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            Utils.endMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.measure);
            sinon.assert.notCalled(performance.clearMarks);
            sinon.assert.notCalled(performance.clearMeasures);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         describe('should measure time and cleanup marks and measures', function() {
            const operations = [
               ['lifecycle'],
               ['unmount', 0],
               ['mount', 1],
               ['reorder', 2],
               ['update', 3]
            ];
            operations.forEach(([operationName, operationCode]) => {
               it(operationName, function() {
                  sandbox.stub(performance, 'measure');
                  sandbox.stub(performance, 'clearMarks');
                  sandbox.stub(performance, 'clearMeasures');
                  stubWasabyDevtoolsOptions({
                     useUserTimingAPI: true
                  });

                  Utils.endMark('Controls/Application', 1, operationCode);

                  const caption = `Controls/Application (${operationName})`;
                  const label = `${caption} 1`;

                  sinon.assert.calledOnce(performance.measure);
                  sinon.assert.calledWithExactly(
                     performance.measure,
                     caption,
                     label
                  );

                  sinon.assert.calledOnce(performance.clearMarks);
                  sinon.assert.calledWithExactly(performance.clearMarks, label);

                  sinon.assert.calledOnce(performance.clearMeasures);
                  sinon.assert.calledWithExactly(
                     performance.clearMeasures,
                     caption
                  );

                  //cleanup
                  delete window.wasabyDevtoolsOptions;
               });
            });
         });
      });

      describe('getControlType', function() {
         it('should return correct value', function() {
            assert.equal(Utils.getControlType({}), 0);
            assert.equal(
               Utils.getControlType({
                  instance: {}
               }),
               1
            );
            assert.equal(
               Utils.getControlType({
                  instance: {},
                  options: {}
               }),
               1
            );
            assert.equal(
               Utils.getControlType({
                  instance: {},
                  options: {
                     content: () => {}
                  }
               }),
               2
            );
         });
      });

      describe('getSyncList', function() {
         it('should transform backend representation of synchronizations to a serializable representation (no Maps, no Sets, no functions, etc.)', function() {
            const changedNodesBySynchronization = new Map();
            const firstChanges = new Map();
            firstChanges.set(0, {
               node: {
                  selfDuration: 10,
                  domChanged: true,
                  isVisible: true,
                  unusedReceivedState: false
               },
               operation: elementsConst.OperationType.UPDATE
            });
            firstChanges.set(1, {
               node: {
                  parentId: 0,
                  selfDuration: 5,
                  options: {
                     value: 12,
                     anotherValue: 34
                  },
                  changedOptions: {
                     value: 56,
                     anotherValue: 78
                  },
                  attributes: {
                     'attr:class': 'expanded'
                  },
                  changedAttributes: {
                     'attr:class': 'collapsed'
                  },
                  domChanged: true,
                  isVisible: true,
                  unusedReceivedState: false
               },
               operation: elementsConst.OperationType.UPDATE
            });
            firstChanges.set(2, {
               node: {
                  parentId: 1,
                  selfDuration: 2,
                  domChanged: false,
                  isVisible: false,
                  unusedReceivedState: false
               },
               operation: elementsConst.OperationType.UPDATE
            });
            firstChanges.set(3, {
               node: {
                  parentId: 1,
                  selfDuration: 4,
                  domChanged: true,
                  isVisible: false,
                  unusedReceivedState: false
               },
               operation: elementsConst.OperationType.DELETE
            });
            changedNodesBySynchronization.set('0', firstChanges);
            const secondChanges = new Map();
            secondChanges.set(4, {
               node: {
                  selfDuration: 9,
                  domChanged: true,
                  isVisible: true,
                  unusedReceivedState: true
               },
               operation: elementsConst.OperationType.CREATE
            });
            changedNodesBySynchronization.set('1', secondChanges);

            const result = Utils.getSyncList(changedNodesBySynchronization);

            assert.deepEqual(result, [
               [
                  '0',
                  {
                     selfDuration: 21,
                     changes: [
                        [
                           0,
                           {
                              selfDuration: 10,
                              updateReason: 'forceUpdated',
                              domChanged: true,
                              isVisible: true,
                              unusedReceivedState: false,
                              changedOptions: undefined,
                              changedAttributes: undefined
                           }
                        ],
                        [
                           1,
                           {
                              selfDuration: 5,
                              updateReason: 'selfUpdated',
                              domChanged: true,
                              isVisible: true,
                              unusedReceivedState: false,
                              changedOptions: ['value', 'anotherValue'],
                              changedAttributes: ['class']
                           }
                        ],
                        [
                           2,
                           {
                              selfDuration: 2,
                              updateReason: 'parentUpdated',
                              domChanged: false,
                              isVisible: false,
                              unusedReceivedState: false,
                              changedOptions: undefined,
                              changedAttributes: undefined
                           }
                        ],
                        [
                           3,
                           {
                              selfDuration: 4,
                              updateReason: 'destroyed',
                              domChanged: true,
                              isVisible: false,
                              unusedReceivedState: false,
                              changedOptions: undefined,
                              changedAttributes: undefined
                           }
                        ]
                     ]
                  }
               ],
               [
                  '1',
                  {
                     selfDuration: 9,
                     changes: [
                        [
                           4,
                           {
                              selfDuration: 9,
                              updateReason: 'mounted',
                              domChanged: true,
                              isVisible: true,
                              unusedReceivedState: true,
                              changedOptions: undefined,
                              changedAttributes: undefined
                           }
                        ]
                     ]
                  }
               ]
            ]);
         });
      });

      describe('getObjectDiff', function() {
         it('should return the first object because only the first object is provided', function() {
            const firstObject = {
               a: 1,
               b: 'qwerty'
            };
            const secondObject = undefined;

            assert.deepEqual(Utils.getObjectDiff(firstObject, secondObject), {
               a: 1,
               b: 'qwerty'
            });
         });

         it('should return the second object because only the second object is provided', function() {
            const firstObject = undefined;
            const secondObject = {
               a: 1,
               b: 'qwerty'
            };

            assert.deepEqual(Utils.getObjectDiff(firstObject, secondObject), {
               a: 1,
               b: 'qwerty'
            });
         });

         it('should return undefined because both arguments are undefined', function() {
            const firstObject = undefined;
            const secondObject = undefined;

            assert.isUndefined(Utils.getObjectDiff(firstObject, secondObject));
         });

         it('should return undefined because objects are deeply equal', function() {
            const firstObject = {
               a: 1,
               b: 'qwerty'
            };
            const secondObject = {
               a: 1,
               b: 'qwerty'
            };

            assert.isUndefined(Utils.getObjectDiff(firstObject, secondObject));
         });

         it('should return the diff', function() {
            const firstObject = {
               a: 2,
               b: 'qwerty',
               c: {}
            };
            const secondObject = {
               a: 1,
               b: 'qwerty',
               d: 'asdf'
            };

            assert.deepEqual(Utils.getObjectDiff(firstObject, secondObject), {
               a: 1,
               c: undefined,
               d: 'asdf'
            });
         });
      });

      describe('isControlNode', function() {
         it('should correctly return result', function() {
            assert.isTrue(
               Utils.isControlNode({
                  controlClass: class Test {}
               })
            );
            assert.isTrue(
               Utils.isControlNode({
                  controlClass: function() {}
               })
            );
            assert.isFalse(Utils.isControlNode({}));
         });
      });

      describe('isTemplateNode', function() {
         it('should correctly return result', function() {
            assert.isTrue(
               Utils.isTemplateNode({
                  type: 'TemplateNode'
               })
            );
            assert.isFalse(
               Utils.isTemplateNode({
                  type: 'div'
               })
            );
         });
      });

      describe('getContainerForNode', function() {
         it('should return the container calculated by the devtools', function() {
            const container = document.createElement('div');
            const node = {
               container
            };

            assert.equal(Utils.getContainerForNode(node), container);
         });

         it('should return the container from the instance', function() {
            const container = document.createElement('div');
            const node = {
               instance: {
                  _container: container
               }
            };

            assert.equal(Utils.getContainerForNode(node), container);
         });

         it('should return body', function() {
            assert.equal(Utils.getContainerForNode({}), document.body);
         });
      });

      describe('isVisible', function() {
         it('should return true because the element is the document root', function() {
            assert.isTrue(Utils.isVisible(document.documentElement));
         });

         it('should return true because the element is body', function() {
            assert.isTrue(Utils.isVisible(document.body));
         });

         it('should return true because the offsetParent of the element is not null', function() {
            const element = document.createElement('div');
            sandbox
               .stub(element, 'offsetParent')
               .value(document.createElement('div'));

            assert.isTrue(Utils.isVisible(element));
         });

         it('should return true because the element has position fixed, is visible and its parent is visible', function() {
            const element = document.createElement('div');
            element.style.position = 'fixed';
            document.body.appendChild(element);

            assert.isTrue(Utils.isVisible(element));

            // cleanup
            element.remove();
         });

         it('should return false because the element has position fixed, is visible but its parent is not visible', function() {
            const element = document.createElement('div');
            element.style.position = 'fixed';
            const parent = document.createElement('div');
            parent.style.display = 'none';
            parent.appendChild(element);
            document.body.appendChild(parent);

            assert.isFalse(Utils.isVisible(element));

            // cleanup
            parent.remove();
         });

         it('should return true because the element has display contents and its parent is visible', function() {
            const element = document.createElement('div');
            element.style.display = 'contents';
            document.body.appendChild(element);

            assert.isTrue(Utils.isVisible(element));

            // cleanup
            element.remove();
         });

         it('should return false because the element has display contents and its parent is not visible', function() {
            const element = document.createElement('div');
            element.style.display = 'contents';
            const parent = document.createElement('div');
            parent.style.display = 'none';
            parent.appendChild(element);
            document.body.appendChild(parent);

            assert.isFalse(Utils.isVisible(element));

            // cleanup
            parent.remove();
         });
      });

      describe('getEvents', function() {
         it('should filter out events handled by another controls', function() {
            const elements = new Map();
            const domToIds = new WeakMap();
            const container = document.createElement('div');
            const onValueChanged = sandbox.stub();
            const control = {
               onValueChanged
            };
            const secondHandler = {
               control
            };
            container.eventProperties = {
               'on:valueChanged': [
                  {
                     fn: {
                        control
                     },
                     value: 'onValueChanged',
                     args: ['1']
                  },
                  {
                     fn: secondHandler,
                     args: []
                  }
               ],
               'on:click': [
                  {
                     fn: {
                        control: {}
                     },
                     args: []
                  }
               ]
            };
            elements.set(0, {
               container,
               instance: control
            });
            domToIds.set(container, [0]);

            assert.deepEqual(Utils.getEvents(elements, domToIds, 0), {
               valueChanged: [
                  {
                     function: onValueChanged,
                     arguments: ['1'],
                     controlNode: undefined
                  },
                  {
                     function: secondHandler,
                     arguments: [],
                     controlNode: undefined
                  }
               ]
            });
         });

         it('should filter out events handled by another controls and return control nodes', function() {
            const elements = new Map();
            const domToIds = new WeakMap();
            const container = document.createElement('div');
            const onValueChanged = sandbox.stub();
            const control = {
               onValueChanged,
               _container: container
            };
            const secondHandler = {
               control
            };
            container.eventProperties = {
               'on:valueChanged': [
                  {
                     fn: {
                        control
                     },
                     value: 'onValueChanged',
                     args: ['1']
                  },
                  {
                     fn: secondHandler,
                     args: []
                  }
               ],
               'on:click': [
                  {
                     fn: {
                        control: {}
                     },
                     args: []
                  }
               ]
            };
            const controlNode = {
               container,
               instance: control
            };
            elements.set(0, controlNode);
            domToIds.set(container, [0]);

            assert.deepEqual(Utils.getEvents(elements, domToIds, 0, true), {
               valueChanged: [
                  {
                     function: onValueChanged,
                     arguments: ['1'],
                     controlNode
                  },
                  {
                     function: secondHandler,
                     arguments: [],
                     controlNode
                  }
               ]
            });
         });
      });

      describe('getCondition', function() {
         it('should return the correct condition', function() {
            assert.equal(
               Utils.getCondition('click', 1),
               `(arguments.length === 0 || arguments[0].type === "click") && (this === window.__WASABY_DEV_HOOK__._agent.elements.get(1).instance || this.data === window.__WASABY_DEV_HOOK__._agent.elements.get(1).instance)`
            );
         });
      });
   });
});
