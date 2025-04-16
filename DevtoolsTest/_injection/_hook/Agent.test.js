define([
   'injection/_hook/Agent',
   'Extension/Plugins/Elements/const',
   'injection/_hook/Utils',
   'injection/_hook/_utils/ContainerHandling',
   'injection/_hook/_utils/UserTimingAPI',
   'injection/_hook/getNodeId',
   'Extension/Utils/guid',
   'injection/_devtool/globalChannel',
   'DevtoolsTest/getJSDOM'
], function (
   Agent,
   elementsConst,
   hookUtils,
   ContainerHandling,
   UserTimingAPIUtils,
   getNodeId,
   guid,
   globalChannel,
   getJSDOM
) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';
   Agent = Agent.default;
   const { OperationType, ControlType } = elementsConst;

   function postMessage(event, args, source = 'elements') {
      window.postMessage(
         {
            source: 'Wasaby/content-message',
            data: {
               source,
               event,
               args
            }
         },
         '*'
      );
   }

   function stubWasabyDevHook() {
      if (!window.__WASABY_DEV_HOOK__) {
         window.__WASABY_DEV_HOOK__ = {
            pushMessage: () => {}
         };
      }

      sandbox.stub(window.__WASABY_DEV_HOOK__, 'pushMessage');
   }

   function waitForMessageHandler(callback) {
      return new Promise((resolve) => {
         setTimeout(function () {
            setTimeout(function () {
               callback();
               resolve();
            });
         });
      });
   }

   describe('injection/_hook/Agent', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
            global.MutationObserver = dom.window.MutationObserver;
            global.Element = dom.window.Element;
            global.performance = dom.window.performance;
            global.getComputedStyle = dom.window.getComputedStyle;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
            delete global.MutationObserver;
            delete global.Element;
            delete global.performance;
            delete global.getComputedStyle;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      let instance;
      beforeEach(function () {
         instance = new Agent({
            logger: {
               error: sandbox.stub()
            }
         });
      });

      afterEach(function () {
         instance.mutationObserver.disconnect();
         instance.channel.destructor();
         globalChannel.getGlobalChannel().removeAllListeners();
         instance = undefined;
      });

      describe('event handlers', function () {
         describe('devtoolsClosed', function () {
            it('should disable highlighter and set isDevtoolsOpened to false', function () {
               sandbox.stub(instance.highlighter, 'stopSelectingFromPage');
               instance.isDevtoolsOpened = true;

               postMessage('devtoolsClosed', undefined, 'globalChannel');

               return waitForMessageHandler(() => {
                  assert.isFalse(instance.isDevtoolsOpened);
                  sinon.assert.calledOnce(
                     instance.highlighter.stopSelectingFromPage
                  );
               });
            });
         });

         describe('devtoolsInitialized', function () {
            it('should send all elements to devtools through the hook', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  instance: {},
                  options: {
                     content: {}
                  }
               });
               instance.elements.set(1, {
                  id: 1,
                  parentId: 0,
                  logicParentId: 0,
                  name: 'Controls/List:View',
                  instance: {}
               });

               postMessage('devtoolsInitialized');

               return waitForMessageHandler(() => {
                  assert.isTrue(instance.isDevtoolsOpened);
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'operation',
                     [
                        OperationType.CREATE,
                        0,
                        'Controls/Application',
                        ControlType.HOC
                     ]
                  );
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'operation',
                     [
                        OperationType.CREATE,
                        1,
                        'Controls/List:View',
                        ControlType.CONTROL,
                        0,
                        0
                     ]
                  );
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'endOfTree'
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'longMessage'
                  );

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should not send elements to devtools because the devtools already have the full tree', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  instance: {},
                  options: {
                     content: {}
                  }
               });
               instance.isDevtoolsOpened = true;
               instance.hasFullTree = true;

               postMessage('devtoolsInitialized');

               return waitForMessageHandler(() => {
                  assert.isTrue(instance.isDevtoolsOpened);
                  assert.isTrue(instance.hasFullTree);
                  sinon.assert.notCalled(
                     window.__WASABY_DEV_HOOK__.pushMessage
                  );
                  sinon.assert.notCalled(instance.channel.dispatch);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('inspectElement', function () {
            it("should send event with the 'not-found' type because the element doesn't exist", function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');

               postMessage('inspectElement', {
                  id: 0,
                  expandedTabs: ['options']
               });

               return waitForMessageHandler(() => {
                  assert.isUndefined(instance.selectedNodePreviousState);
                  sinon.assert.notCalled(
                     window.__WASABY_DEV_HOOK__.pushMessage
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'inspectedElement',
                     {
                        id: 0,
                        type: 'not-found'
                     }
                  );
                  assert.isUndefined(window.$wasaby);

                  // cleanup
                  delete window.$wasaby;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should send all information about the element through the hook and remember the state', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               const container = document.createElement('div');
               const controlInstance = {
                  onClick: function onClick() {}
               };
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  instance: controlInstance,
                  options: {
                     value: '456'
                  },
                  attributes: {
                     'attr:class': 'controls-Application'
                  },
                  state: {
                     pageWidth: 400,
                     obj: {
                        field: 'str'
                     }
                  },
                  containers: [container]
               });
               container.eventProperties = {
                  'on:click': [
                     {
                        fn: {
                           control: controlInstance,
                           value: 'onClick'
                        },
                        args: ['1']
                     }
                  ]
               };

               postMessage('inspectElement', {
                  id: 0,
                  expandedTabs: ['options', 'attributes', 'state', 'events']
               });

               return waitForMessageHandler(() => {
                  assert.deepEqual(instance.selectedNodePreviousState, {
                     pageWidth: 400,
                     obj: {
                        field: 'str'
                     }
                  });
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'inspectedElement',
                     {
                        id: 0,
                        type: 'full',
                        value: {
                           attributes: {
                              cleaned: [],
                              data: {
                                 'attr:class': 'controls-Application'
                              }
                           },
                           state: {
                              cleaned: [['state', 'obj']],
                              data: {
                                 pageWidth: 400,
                                 obj: {
                                    caption: 'Object',
                                    expandable: true,
                                    type: 'object'
                                 }
                              }
                           },
                           options: {
                              cleaned: [],
                              data: {
                                 value: '456'
                              }
                           },
                           events: {
                              cleaned: [['events', 'click', 0]],
                              data: {
                                 click: [
                                    {
                                       caption: 'Object',
                                       expandable: true,
                                       type: 'object'
                                    }
                                 ]
                              }
                           },
                           isControl: true
                        }
                     }
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'longMessage'
                  );
                  assert.deepEqual(window.$wasaby, {
                     id: 0,
                     name: 'Controls/Application',
                     instance: controlInstance,
                     options: {
                        value: '456'
                     },
                     attributes: {
                        'attr:class': 'controls-Application'
                     },
                     state: {
                        pageWidth: 400,
                        obj: {
                           field: 'str'
                        }
                     },
                     containers: [container]
                  });

                  // cleanup
                  delete window.$wasaby;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should send all information about the element through the hook', function () {
               const container = document.createElement('div');
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  options: {
                     value: '456'
                  },
                  attributes: {
                     'attr:class': 'controls-Application'
                  },
                  container
               });
               instance.selectedNodePreviousState = {};

               postMessage('inspectElement', {
                  id: 0,
                  expandedTabs: ['options', 'attributes', 'state', 'events']
               });

               return waitForMessageHandler(() => {
                  assert.isUndefined(instance.selectedNodePreviousState);
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'inspectedElement',
                     {
                        id: 0,
                        type: 'full',
                        value: {
                           attributes: {
                              data: {
                                 'attr:class': 'controls-Application'
                              },
                              cleaned: []
                           },
                           state: undefined,
                           options: {
                              data: {
                                 value: '456'
                              },
                              cleaned: []
                           },
                           events: undefined,
                           isControl: false
                        }
                     }
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'longMessage'
                  );
                  assert.deepEqual(window.$wasaby, {
                     id: 0,
                     name: 'Controls/Application',
                     options: {
                        value: '456'
                     },
                     attributes: {
                        'attr:class': 'controls-Application'
                     },
                     container
                  });

                  // cleanup
                  delete window.$wasaby;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it("should only send information about the tabs, without data, because there're no expanded tabs", function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               const container = document.createElement('div');
               const controlInstance = {};
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  instance: controlInstance,
                  options: {
                     value: '456'
                  },
                  changedOptions: {
                     newOption: 'qwerty',
                     value: '123'
                  },
                  attributes: {
                     'attr:class': 'controls-Application'
                  },
                  changedAttributes: {
                     'attr:class': 'controls-Application ws-is-chrome'
                  },
                  state: {
                     pageWidth: 400,
                     obj: {
                        field: 'str'
                     }
                  },
                  container
               });

               postMessage('inspectElement', {
                  id: 0,
                  expandedTabs: []
               });

               return waitForMessageHandler(() => {
                  assert.isUndefined(instance.selectedNodePreviousState);
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'inspectedElement',
                     {
                        id: 0,
                        type: 'full',
                        value: {
                           attributes: {
                              cleaned: [['attributes']],
                              data: {
                                 caption: 'Object',
                                 expandable: true,
                                 type: 'object'
                              }
                           },
                           options: {
                              cleaned: [['options']],
                              data: {
                                 caption: 'Object',
                                 expandable: true,
                                 type: 'object'
                              }
                           },
                           state: {
                              cleaned: [['state']],
                              data: {
                                 caption: 'Object',
                                 expandable: true,
                                 type: 'object'
                              }
                           },
                           events: undefined,
                           isControl: true
                        }
                     }
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'longMessage'
                  );
                  assert.deepEqual(window.$wasaby, {
                     id: 0,
                     name: 'Controls/Application',
                     instance: controlInstance,
                     options: {
                        value: '456'
                     },
                     changedOptions: {
                        newOption: 'qwerty',
                        value: '123'
                     },
                     attributes: {
                        'attr:class': 'controls-Application'
                     },
                     changedAttributes: {
                        'attr:class': 'controls-Application ws-is-chrome'
                     },
                     state: {
                        pageWidth: 400,
                        obj: {
                           field: 'str'
                        }
                     },
                     container
                  });

                  // cleanup
                  delete window.$wasaby;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should send information about changes only from the expanded tabs (options, state) and remember the state', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               const container = document.createElement('div');
               const controlInstance = {};
               instance.selectedNodePreviousState = {
                  pageWidth: 500,
                  obj: {
                     field: 'str'
                  }
               };
               instance.currentInspectedElementId = 0;
               instance.currentInspectedPaths.set('options', new Map());
               instance.currentInspectedPaths.set('state', new Map());
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  instance: controlInstance,
                  options: {
                     value: '456'
                  },
                  changedOptions: {
                     newOption: 'qwerty',
                     value: '123'
                  },
                  attributes: {
                     'attr:class': 'controls-Application'
                  },
                  changedAttributes: {
                     'attr:class': 'controls-Application ws-is-chrome'
                  },
                  state: {
                     pageWidth: 400,
                     obj: {
                        field: 'str'
                     }
                  },
                  container
               });

               postMessage('inspectElement', {
                  id: 0,
                  expandedTabs: ['options', 'state']
               });

               return waitForMessageHandler(() => {
                  assert.deepEqual(instance.selectedNodePreviousState, {
                     pageWidth: 400,
                     obj: {
                        field: 'str'
                     }
                  });
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'inspectedElement',
                     {
                        id: 0,
                        type: 'partial',
                        value: {
                           changedOptions: {
                              cleaned: [],
                              data: {
                                 newOption: 'qwerty',
                                 value: '123'
                              }
                           },
                           changedState: {
                              cleaned: [],
                              data: {
                                 pageWidth: 400
                              }
                           },
                           isControl: true
                        }
                     }
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'longMessage'
                  );
                  assert.deepEqual(window.$wasaby, {
                     id: 0,
                     name: 'Controls/Application',
                     instance: controlInstance,
                     options: {
                        value: '456'
                     },
                     changedOptions: undefined,
                     attributes: {
                        'attr:class': 'controls-Application'
                     },
                     changedAttributes: {
                        'attr:class': 'controls-Application ws-is-chrome'
                     },
                     state: {
                        pageWidth: 400,
                        obj: {
                           field: 'str'
                        }
                     },
                     container
                  });

                  // cleanup
                  delete window.$wasaby;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should send information about changes only from the expanded tabs (attributes)', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               const container = document.createElement('div');
               const controlInstance = {};
               instance.currentInspectedElementId = 0;
               instance.currentInspectedPaths.set('attributes', new Map());
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  instance: controlInstance,
                  options: {
                     value: '456'
                  },
                  changedOptions: {
                     newOption: 'qwerty',
                     value: '123'
                  },
                  attributes: {
                     'attr:class': 'controls-Application'
                  },
                  changedAttributes: {
                     'attr:class': 'controls-Application ws-is-chrome'
                  },
                  state: {
                     pageWidth: 400,
                     obj: {
                        field: 'str'
                     }
                  },
                  container
               });

               postMessage('inspectElement', {
                  id: 0,
                  expandedTabs: ['attributes']
               });

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'inspectedElement',
                     {
                        id: 0,
                        type: 'partial',
                        value: {
                           changedAttributes: {
                              cleaned: [],
                              data: {
                                 'attr:class':
                                    'controls-Application ws-is-chrome'
                              }
                           },
                           isControl: true
                        }
                     }
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'longMessage'
                  );
                  assert.deepEqual(window.$wasaby, {
                     id: 0,
                     name: 'Controls/Application',
                     instance: controlInstance,
                     options: {
                        value: '456'
                     },
                     changedOptions: {
                        newOption: 'qwerty',
                        value: '123'
                     },
                     attributes: {
                        'attr:class': 'controls-Application'
                     },
                     changedAttributes: undefined,
                     state: {
                        pageWidth: 400,
                        obj: {
                           field: 'str'
                        }
                     },
                     container
                  });

                  // cleanup
                  delete window.$wasaby;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should send information from dehydrated path', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               const container = document.createElement('div');
               const controlInstance = {};
               instance.currentInspectedElementId = 0;
               instance.currentInspectedPaths.set('state', new Map());
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  instance: controlInstance,
                  state: {
                     pageWidth: 400,
                     obj: {
                        field: 'str'
                     }
                  },
                  container
               });

               postMessage('inspectElement', {
                  id: 0,
                  expandedTabs: ['state'],
                  path: ['state', 'obj']
               });

               return waitForMessageHandler(() => {
                  assert.isUndefined(instance.selectedNodePreviousState);
                  sinon.assert.calledWithExactly(
                     window.__WASABY_DEV_HOOK__.pushMessage,
                     'inspectedElement',
                     {
                        id: 0,
                        type: 'path',
                        path: ['state', 'obj'],
                        value: {
                           cleaned: [],
                           data: {
                              field: 'str'
                           }
                        }
                     }
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'longMessage'
                  );
                  assert.deepEqual(window.$wasaby, {
                     id: 0,
                     name: 'Controls/Application',
                     instance: controlInstance,
                     state: {
                        pageWidth: 400,
                        obj: {
                           field: 'str'
                        }
                     },
                     container
                  });

                  // cleanup
                  delete window.$wasaby;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('viewTemplate', function () {
            it('should store template of the node in window.__WASABY_DEV_HOOK__.__template', function () {
               stubWasabyDevHook();
               const template = () => {};
               instance.elements.set(0, {
                  template
               });

               postMessage('viewTemplate', 0);

               return waitForMessageHandler(() => {
                  assert.equal(window.__WASABY_DEV_HOOK__.__template, template);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it("should not throw when the node doesn't exist", function () {
               stubWasabyDevHook();

               postMessage('viewTemplate', 0);

               return waitForMessageHandler(() => {
                  assert.isUndefined(window.__WASABY_DEV_HOOK__.__template);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('viewConstructor', function () {
            it('should store constructor of the node in window.__WASABY_DEV_HOOK__.__constructor', function () {
               stubWasabyDevHook();
               const constructor = () => {};
               instance.elements.set(0, {
                  instance: {
                     constructor
                  }
               });

               postMessage('viewConstructor', 0);

               return waitForMessageHandler(() => {
                  assert.equal(
                     window.__WASABY_DEV_HOOK__.__constructor,
                     constructor
                  );

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it("should not throw when the node doesn't have an instance", function () {
               stubWasabyDevHook();
               instance.elements.set(0, {
                  options: {}
               });

               postMessage('viewConstructor', 0);

               return waitForMessageHandler(() => {
                  assert.isUndefined(window.__WASABY_DEV_HOOK__.__constructor);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it("should not throw when the node doesn't exist", function () {
               stubWasabyDevHook();

               postMessage('viewConstructor', 0);

               return waitForMessageHandler(() => {
                  assert.isUndefined(window.__WASABY_DEV_HOOK__.__constructor);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('viewContainer', function () {
            it('should store container of the node in window.__WASABY_DEV_HOOK__.__container', function () {
               stubWasabyDevHook();
               const container = document.createElement('div');
               instance.elements.set(0, {
                  containers: [container]
               });

               postMessage('viewContainer', 0);

               return waitForMessageHandler(() => {
                  assert.equal(
                     window.__WASABY_DEV_HOOK__.__container,
                     container
                  );

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it("should not throw when the node doesn't exist", function () {
               stubWasabyDevHook();

               postMessage('viewContainer', 0);

               return waitForMessageHandler(() => {
                  assert.isUndefined(window.__WASABY_DEV_HOOK__.__template);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('storeAsGlobal', function () {
            it('should store value in window.$tmp and console.log about it', function () {
               stubWasabyDevHook();
               sandbox.stub(console, 'log');
               const value = {
                  a: 123
               };
               instance.elements.set(0, {
                  options: {
                     obj: {
                        value
                     }
                  }
               });

               postMessage('storeAsGlobal', {
                  id: 0,
                  path: ['obj', 'value', 'options']
               });

               return waitForMessageHandler(() => {
                  assert.equal(window.$tmp, value);
                  sinon.assert.calledWithExactly(console.log, '$tmp = ', value);

                  // cleanup
                  delete window.$tmp;
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('getSelectedItem', function () {
            it('should take the first node in the elements Map and fire setSelectedItem event', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               instance.elements.set(0, {
                  id: 0
               });

               postMessage('getSelectedItem');

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'setSelectedItem',
                     0
                  );
                  assert.equal(instance.idClosestToPreviousSelectedElement, 0);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should find control node by the element', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               const element = document.createElement('div');
               window.__WASABY_DEV_HOOK__.$0 = element;
               const node = {
                  id: 0
               };
               instance.domToIds.set(element, [node]);
               instance.elements.set(0, node);

               postMessage('getSelectedItem');

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'setSelectedItem',
                     0
                  );
                  assert.equal(instance.idClosestToPreviousSelectedElement, 0);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should not do anything if getSelectedItem was called two times in a row with one id', function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');
               instance.idClosestToPreviousSelectedElement = 0;
               instance.elements.set(0, {
                  id: 0
               });

               postMessage('getSelectedItem');

               return waitForMessageHandler(() => {
                  sinon.assert.notCalled(instance.channel.dispatch);
                  assert.equal(instance.idClosestToPreviousSelectedElement, 0);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it("should not do anything if there're no nodes", function () {
               stubWasabyDevHook();
               sandbox.stub(instance.channel, 'dispatch');

               postMessage('getSelectedItem');

               return waitForMessageHandler(() => {
                  sinon.assert.notCalled(instance.channel.dispatch);
                  assert.isUndefined(
                     instance.idClosestToPreviousSelectedElement
                  );

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('viewFunctionSource', function () {
            it('should store the function in window.__WASABY_DEV_HOOK__.__function', function () {
               stubWasabyDevHook();
               const dataLoadCallback = () => {};
               instance.elements.set(0, {
                  options: {
                     dataLoadCallback
                  }
               });

               postMessage('viewFunctionSource', {
                  id: 0,
                  path: ['dataLoadCallback', 'options']
               });

               return waitForMessageHandler(() => {
                  assert.equal(
                     window.__WASABY_DEV_HOOK__.__function,
                     dataLoadCallback
                  );

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });

            it('should store the event handler in window.__WASABY_DEV_HOOK__.__function', function () {
               stubWasabyDevHook();
               const container = document.createElement('div');
               const onClick = () => {};
               const controlInstance = {
                  onClick
               };
               instance.elements.set(0, {
                  id: 0,
                  instance: controlInstance,
                  containers: [container]
               });
               container.eventProperties = {
                  'on:click': [
                     {
                        fn: {
                           control: controlInstance,
                           value: 'onClick'
                        },
                        args: ['1']
                     }
                  ]
               };

               postMessage('viewFunctionSource', {
                  id: 0,
                  path: [
                     'click',
                     '0',
                     'function',
                     'control',
                     'onClick',
                     'events'
                  ]
               });

               return waitForMessageHandler(() => {
                  assert.equal(window.__WASABY_DEV_HOOK__.__function, onClick);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });

         describe('highlightElement', function () {
            it('should reset the highlight because the event was fired without id', function () {
               sandbox.stub(instance.highlighter, 'highlightElement');

               postMessage('highlightElement');

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.highlighter.highlightElement
                  );
               });
            });

            it("should reset the highlight because the node doesn't exist", function () {
               sandbox.stub(instance.highlighter, 'highlightElement');

               postMessage('highlightElement', 0);

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.highlighter.highlightElement
                  );
               });
            });

            it("should reset the highlight because the node doesn't have a container", function () {
               sandbox.stub(instance.highlighter, 'highlightElement');

               postMessage('highlightElement', 0);
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application'
               });

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.highlighter.highlightElement
                  );
               });
            });

            it('should highlight the node', function () {
               sandbox.stub(instance.highlighter, 'highlightElement');

               postMessage('highlightElement', 0);
               const container = document.createElement('div');
               instance.elements.set(0, {
                  id: 0,
                  name: 'Controls/Application',
                  containers: [container]
               });

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.highlighter.highlightElement,
                     [container],
                     'Controls/Application'
                  );
               });
            });
         });

         describe('toggleSelectFromPage', function () {
            it('should start selecting from the page', function () {
               sandbox.stub(instance.highlighter, 'startSelectingFromPage');

               postMessage('toggleSelectFromPage', true);

               return waitForMessageHandler(() => {
                  sinon.assert.calledOnce(
                     instance.highlighter.startSelectingFromPage
                  );
               });
            });

            it('should stop selecting from the page', function () {
               sandbox.stub(instance.highlighter, 'stopSelectingFromPage');

               postMessage('toggleSelectFromPage', false);

               return waitForMessageHandler(() => {
                  sinon.assert.calledOnce(
                     instance.highlighter.stopSelectingFromPage
                  );
               });
            });
         });

         describe('toggleProfiling', function () {
            it('should cleanup mutation observer and fire new profiling status', function () {
               sandbox.stub(instance.channel, 'dispatch');
               sandbox.stub(instance.dirtyContainers, 'clear');
               sandbox.stub(instance.dirtyControls, 'clear');
               sandbox.stub(instance.mutationObserver, 'disconnect');

               postMessage('toggleProfiling', false);

               return waitForMessageHandler(() => {
                  assert.isFalse(instance.isProfiling);
                  sinon.assert.calledOnce(instance.dirtyContainers.clear);
                  sinon.assert.calledOnce(instance.dirtyControls.clear);
                  sinon.assert.calledOnce(instance.mutationObserver.disconnect);
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'profilingStatus',
                     false
                  );
               });
            });

            it('should clear internal fields used for profiling, save base durations, cleanup mutation observer and fire new profiling status', function () {
               sandbox.stub(instance.channel, 'dispatch');
               sandbox.stub(instance.changedNodesBySynchronization, 'clear');
               sandbox.stub(instance.initialIdToDuration, 'clear');
               sandbox.stub(instance.dirtyContainers, 'clear');
               sandbox.stub(instance.dirtyControls, 'clear');
               sandbox.stub(instance.mutationObserver, 'disconnect');
               instance.elements.set(0, {
                  id: 0,
                  selfDuration: 10
               });
               instance.elements.set(1, {
                  id: 1,
                  selfDuration: 15
               });
               instance.elements.set(2, {
                  id: 2,
                  selfDuration: 5
               });

               postMessage('toggleProfiling', true);

               return waitForMessageHandler(() => {
                  assert.isTrue(instance.isProfiling);
                  sinon.assert.calledOnce(
                     instance.changedNodesBySynchronization.clear
                  );
                  sinon.assert.calledOnce(instance.initialIdToDuration.clear);
                  assert.deepEqual(
                     instance.initialIdToDuration,
                     new Map([
                        [0, 10],
                        [1, 15],
                        [2, 5]
                     ])
                  );
                  sinon.assert.calledOnce(instance.dirtyContainers.clear);
                  sinon.assert.calledOnce(instance.dirtyControls.clear);
                  sinon.assert.calledOnce(instance.mutationObserver.disconnect);
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'profilingStatus',
                     true
                  );
               });
            });
         });

         describe('getProfilingData', function () {
            it('should transform the profiling data to a serializable representation, then clean it up and fire profilingData event with it', function () {
               sandbox.stub(instance.channel, 'dispatch');
               sandbox.stub(instance.initialIdToDuration, 'clear');
               sandbox.stub(instance.changedNodesBySynchronization, 'clear');

               instance.initialIdToDuration.set(0, 10);
               instance.changedNodesBySynchronization.set(
                  '0',
                  new Map([
                     [
                        0,
                        {
                           node: {
                              selfDuration: 10,
                              lifecycleDuration: 5,
                              domChanged: true,
                              isVisible: true,
                              unusedReceivedState: false,
                              asyncControl: false
                           },
                           operation: OperationType.CREATE
                        }
                     ]
                  ])
               );

               postMessage('getProfilingData');

               return waitForMessageHandler(() => {
                  sinon.assert.calledOnce(instance.initialIdToDuration.clear);
                  sinon.assert.calledOnce(
                     instance.changedNodesBySynchronization.clear
                  );
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'profilingData',
                     {
                        initialIdToDuration: [[0, 10]],
                        syncList: [
                           [
                              '0',
                              {
                                 selfDuration: 10,
                                 changes: [
                                    [
                                       0,
                                       {
                                          selfDuration: 10,
                                          lifecycleDuration: 5,
                                          updateReason: 'mounted',
                                          domChanged: true,
                                          isVisible: true,
                                          unusedReceivedState: false,
                                          changedOptions: undefined,
                                          changedAttributes: undefined,
                                          changedReactiveProps: undefined,
                                          asyncControl: false
                                       }
                                    ]
                                 ]
                              }
                           ]
                        ]
                     }
                  );
               });
            });
         });

         describe('getProfilingStatus', function () {
            it('should fire profilingStatus event with false', function () {
               sandbox.stub(instance.channel, 'dispatch');
               instance.isProfiling = false;

               postMessage('getProfilingStatus');

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'profilingStatus',
                     false
                  );
               });
            });

            it('should fire profilingStatus event with true', function () {
               sandbox.stub(instance.channel, 'dispatch');
               instance.isProfiling = true;

               postMessage('getProfilingStatus');

               return waitForMessageHandler(() => {
                  sinon.assert.calledWithExactly(
                     instance.channel.dispatch,
                     'profilingStatus',
                     true
                  );
               });
            });
         });

         describe('setBreakpoint', function () {
            it('should collect event handlers and store necessary data in window.__WASABY_DEV_HOOK__._breakpoints', function () {
               stubWasabyDevHook();
               const firstContainer = document.createElement('div');
               const firstInstance = {
                  onClick: function onClick() {}
               };
               instance.elements.set(0, {
                  id: 0,
                  instance: firstInstance,
                  containers: [firstContainer]
               });
               instance.instanceToId.set(firstInstance, 0);
               instance.domToIds.set(firstContainer, [0]);
               const firstFunction = {
                  control: firstInstance,
                  value: 'onClick'
               };
               firstContainer.eventProperties = {
                  'on:click': [
                     {
                        fn: firstFunction,
                        args: ['1']
                     }
                  ]
               };

               const secondContainer = document.createElement('div');
               instance.elements.set(1, {
                  parentId: 0,
                  containers: [secondContainer]
               });
               firstContainer.appendChild(secondContainer);
               instance.domToIds.set(secondContainer, [1]);

               const thirdContainer = document.createElement('div');
               instance.elements.set(2, {
                  id: 2,
                  parentId: 1,
                  containers: [thirdContainer]
               });
               const secondFunction = {
                  control: firstInstance,
                  value: 'clickHandler'
               };
               const thirdFunction = {
                  control: firstInstance
               };
               thirdContainer.eventProperties = {
                  'on:click': [
                     {
                        fn: secondFunction,
                        args: []
                     },
                     {
                        fn: thirdFunction,
                        args: []
                     }
                  ]
               };
               secondContainer.appendChild(thirdContainer);
               instance.domToIds.set(thirdContainer, [2]);

               postMessage('setBreakpoint', {
                  id: 2,
                  eventName: 'click'
               });

               return waitForMessageHandler(() => {
                  assert.deepEqual(window.__WASABY_DEV_HOOK__._breakpoints, [
                     [
                        secondFunction,
                        `(arguments.length === 0 || arguments[0].type === "click") && (this === window.__WASABY_DEV_HOOK__._agent.elements.get(0).instance || this.data === window.__WASABY_DEV_HOOK__._agent.elements.get(0).instance)`,
                        0,
                        2
                     ],
                     [
                        thirdFunction,
                        `(arguments.length === 0 || arguments[0].type === "click") && (this === window.__WASABY_DEV_HOOK__._agent.elements.get(0).instance || this.data === window.__WASABY_DEV_HOOK__._agent.elements.get(0).instance)`,
                        0,
                        2
                     ],
                     [
                        firstFunction,
                        `(arguments.length === 0 || arguments[0].type === "click") && (this === window.__WASABY_DEV_HOOK__._agent.elements.get(0).instance || this.data === window.__WASABY_DEV_HOOK__._agent.elements.get(0).instance)`,
                        0,
                        2
                     ]
                  ]);

                  // cleanup
                  delete window.__WASABY_DEV_HOOK__;
               });
            });
         });
      });

      describe('onStartSync', function () {
         it('should initialize state for the root (add it to the stack and changedRoots)', function () {
            sandbox.stub(UserTimingAPIUtils, 'startSyncMark');
            sandbox.stub(instance.mutationObserver, 'observe');

            instance.onStartSync(0);

            assert.deepEqual(instance.rootStack, [0]);
            assert.deepEqual(instance.changedRoots, new Map([[0, new Map()]]));
            sinon.assert.notCalled(instance.mutationObserver.observe);
            sinon.assert.calledWithExactly(UserTimingAPIUtils.startSyncMark, 0);
         });

         it('should initialize state for the root and start observing', function () {
            sandbox.stub(UserTimingAPIUtils, 'startSyncMark');
            sandbox.stub(instance.mutationObserver, 'observe');
            instance.isProfiling = true;

            instance.onStartSync(0);

            assert.deepEqual(instance.rootStack, [0]);
            assert.deepEqual(instance.changedRoots, new Map([[0, new Map()]]));
            sinon.assert.calledWithExactly(
               instance.mutationObserver.observe,
               document,
               {
                  childList: true,
                  attributes: true,
                  characterData: true,
                  subtree: true
               }
            );
            sinon.assert.calledWithExactly(UserTimingAPIUtils.startSyncMark, 0);
         });

         it('should put the root on top of the rootStack if onStartSync was called multiple times with multiple roots without calling endSync', function () {
            instance.onStartSync(0);

            assert.deepEqual(instance.rootStack, [0]);
            assert.deepEqual(instance.changedRoots, new Map([[0, new Map()]]));

            instance.onStartSync(1);

            assert.deepEqual(instance.rootStack, [0, 1]);
            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [0, new Map()],
                  [1, new Map()]
               ])
            );

            instance.onStartSync(0);

            assert.deepEqual(instance.rootStack, [1, 0]);
            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [0, new Map()],
                  [1, new Map()]
               ])
            );
         });
      });

      describe('onStartCommit', function () {
         it("should throw because there're no roots in progress", function () {
            instance.onStartCommit(
               OperationType.CREATE,
               'Controls/Application'
            );

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               'Trying to change nonexistent root'
            );
         });

         it('should log error because startCommit for the node was called several times in a row without calling endCommit', function () {
            sandbox.stub(getNodeId, 'default').returns(0);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.onStartCommit(
               OperationType.CREATE,
               'Controls/Application'
            );

            instance.onStartCommit(
               OperationType.CREATE,
               'Controls/Application',
               {}
            );

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               'startCommit for this node was called several times in a row without calling endCommit.'
            );
            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 lifecycleDuration: 0,
                                 treeDuration: 0,
                                 containers: undefined
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            sinon.assert.calledOnce(UserTimingAPIUtils.startMark);
            assert.deepEqual(instance.componentsStack, [0]);
         });

         it('should generate id for the node and save information about it on the current root', function () {
            sandbox.stub(getNodeId, 'default').returns(0);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());

            instance.onStartCommit(
               OperationType.CREATE,
               'Controls/Application'
            );

            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 treeDuration: 0,
                                 lifecycleDuration: 0,
                                 containers: undefined
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.deepEqual(instance.componentsStack, [0]);
         });

         it('should update the time for the node if onStartCommit was called for it several times during one synchronization', function () {
            const oldVNode = {};
            instance.vNodeToId.set(oldVNode, 0);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            instance.rootStack.push(0);
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0,
                           name: 'Controls/Application',
                           selfStartTime: 10,
                           selfDuration: 0,
                           treeDuration: 0
                        },
                        operation: OperationType.CREATE
                     }
                  ]
               ])
            );

            instance.onStartCommit(
               OperationType.UPDATE,
               'Controls/Application',
               oldVNode
            );

            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 treeDuration: 0
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.deepEqual(instance.componentsStack, [0]);
         });

         it('should update the selfStartTime for the node if onStartCommit was called for it several times during one synchronization', function () {
            const oldVNode = {
               vnode: {}
            };
            instance.vNodeToId.set(oldVNode.vnode, 0);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            instance.rootStack.push(0);
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0,
                           name: 'Controls/Application',
                           selfStartTime: 10,
                           selfDuration: 0,
                           treeDuration: 0
                        },
                        operation: OperationType.CREATE
                     }
                  ]
               ])
            );

            instance.onStartCommit(
               OperationType.UPDATE,
               'Controls/Application',
               oldVNode
            );

            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 treeDuration: 0
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.deepEqual(instance.componentsStack, [0]);
         });

         it('should not set a container for an instance without it', function () {
            sandbox.stub(getNodeId, 'default').returns(0);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());

            instance.onStartCommit(
               OperationType.CREATE,
               'Controls/Application'
            );

            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 treeDuration: 0,
                                 lifecycleDuration: 0,
                                 containers: undefined
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.deepEqual(instance.componentsStack, [0]);
         });

         // TODO: какой-то левый тест
         it('should take container from instance.idToContainers (control has an instance)', function () {
            sandbox.stub(getNodeId, 'default').returns(0);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());

            instance.onStartCommit(
               OperationType.CREATE,
               'Controls/Application'
            );

            const actualContainer = document.createElement('div');
            instance.idToContainers.set(0, [actualContainer]);

            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 treeDuration: 0,
                                 lifecycleDuration: 0,
                                 containers: [actualContainer]
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.deepEqual(instance.componentsStack, [0]);
         });

         it('should take container from instance.idToContainers (control doesnt have an instance)', function () {
            sandbox.stub(getNodeId, 'default').returns(0);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());

            instance.onStartCommit(
               OperationType.CREATE,
               'Controls/Application'
            );

            const actualContainer = document.createElement('div');
            instance.idToContainers.set(0, [actualContainer]);

            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 treeDuration: 0,
                                 lifecycleDuration: 0,
                                 containers: [actualContainer]
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.deepEqual(instance.componentsStack, [0]);
         });
      });

      describe('onEndCommit', function () {
         it("should throw because there're no roots in progress", function () {
            instance.onEndCommit({
               type: 'div',
               key: '_'
            });

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               'Trying to change nonexistent root'
            );
         });

         it("should throw because there're no nodes on the stack", function () {
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());

            instance.onEndCommit({
               type: 'div',
               key: '_'
            });

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               "Trying to commit a node, but there's no uncommitted nodes."
            );
         });

         it("should throw because the last node on the stack doesn't exist in the current root", function () {
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.componentsStack.push(0);

            instance.onEndCommit({
               type: 'div',
               key: '_'
            });

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               "Trying to commit a node with the id: 0, but the node with this id doesn't exist in the current root."
            );
         });

         it('should save information about the node, update selfDuration, add parentId', function () {
            const node = {
               type: 'div',
               key: '_'
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.changedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            });
            instance.componentsStack.push(0);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.equal(instance.vNodeToId.get(node), 0);
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: currentTime - 10,
                  treeDuration: 0,
                  parentId: undefined,
                  logicParentId: undefined,
                  options: {
                     value: '123'
                  }
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
            assert.deepEqual(instance.componentsStack, []);
         });

         it("should update treeDuration of the node's parent", function () {
            const node = {
               type: 'div',
               key: '_'
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.changedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 1
               },
               operation: OperationType.UPDATE
            });
            instance.changedRoots.get(0).set(1, {
               node: {
                  id: 1,
                  name: 'Controls/SwitchableArea:View',
                  selfStartTime: 5,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            });
            instance.vNodeToParentId.set(node, 0);
            instance.componentsStack.push(0);
            instance.componentsStack.push(1);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            const controlInstance = {};
            instance.instanceToId.set(controlInstance, 0);

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               },
               logicParent: controlInstance
            });

            assert.equal(instance.vNodeToId.get(node), 1);
            const commitDuration = currentTime - 5;
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 1 + commitDuration
               },
               operation: OperationType.UPDATE
            });
            expectedChangedRoots.get(0).set(1, {
               node: {
                  id: 1,
                  parentId: 0,
                  logicParentId: 0,
                  logicParent: controlInstance,
                  name: 'Controls/SwitchableArea:View',
                  selfStartTime: 5,
                  selfDuration: commitDuration,
                  treeDuration: 0,
                  options: {
                     value: '123'
                  }
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
            assert.deepEqual(instance.componentsStack, [0]);
            assert.deepEqual(instance.idToParentId, new Map([[1, 0]]));
         });

         it("should update treeDuration and selfDuration of the node's parent", function () {
            const node = {
               type: 'div',
               key: '_'
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.changedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 3,
                  treeDuration: 1
               },
               operation: OperationType.UPDATE
            });
            instance.changedRoots.get(0).set(1, {
               node: {
                  id: 1,
                  name: 'Controls/SwitchableArea:View',
                  selfStartTime: 5,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            });
            instance.vNodeToParentId.set(node, 0);
            instance.componentsStack.push(1);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            assert.equal(instance.vNodeToId.get(node), 1);
            const commitDuration = currentTime - 5;
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 3 + commitDuration,
                  treeDuration: 1 + commitDuration
               },
               operation: OperationType.UPDATE
            });
            expectedChangedRoots.get(0).set(1, {
               node: {
                  id: 1,
                  parentId: 0,
                  logicParentId: undefined,
                  name: 'Controls/SwitchableArea:View',
                  selfStartTime: 5,
                  selfDuration: commitDuration,
                  treeDuration: 0,
                  options: {
                     value: '123'
                  }
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
            assert.deepEqual(instance.componentsStack, []);
            assert.deepEqual(instance.idToParentId, new Map([[1, 0]]));
         });

         it('should set unusedReceivedState and asyncControl to true', function () {
            const node = {
               key: '_'
            };
            const controlInstance = {
               _$resultBeforeMount: Promise.resolve()
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.changedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            });
            instance.componentsStack.push(0);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            instance.isProfiling = true;
            instance.controlsWithReceivedStates.add('_');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               },
               instance: controlInstance
            });

            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.equal(instance.vNodeToId.get(node), 0);
            assert.equal(instance.instanceToId.get(controlInstance), 0);
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: currentTime - 10,
                  treeDuration: 0,
                  parentId: undefined,
                  logicParentId: undefined,
                  options: {
                     value: '123'
                  },
                  instance: controlInstance,
                  unusedReceivedState: true,
                  asyncControl: true
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
            assert.isFalse(instance.controlsWithReceivedStates.has('_'));
         });

         it("should not set unusedReceivedState because the control doesn't have an instance", function () {
            const node = {
               key: '_'
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.changedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            });
            instance.componentsStack.push(0);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            instance.isProfiling = true;

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.equal(instance.vNodeToId.get(node), 0);
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: currentTime - 10,
                  treeDuration: 0,
                  parentId: undefined,
                  logicParentId: undefined,
                  options: {
                     value: '123'
                  }
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
         });

         it('should not set unusedReceivedState because this is not a create operation', function () {
            const node = {
               key: '_'
            };
            const controlInstance = {
               _$resultBeforeMount: Promise.resolve()
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.changedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.UPDATE
            });
            instance.componentsStack.push(0);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            instance.isProfiling = true;
            instance.controlsWithReceivedStates.add('_');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               },
               instance: controlInstance
            });

            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/Application',
               0,
               OperationType.UPDATE
            );
            assert.equal(instance.vNodeToId.get(node), 0);
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: currentTime - 10,
                  treeDuration: 0,
                  parentId: undefined,
                  logicParentId: undefined,
                  options: {
                     value: '123'
                  },
                  instance: controlInstance
               },
               operation: OperationType.UPDATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
            assert.isTrue(instance.controlsWithReceivedStates.has('_'));
         });

         it("should not set unusedReceivedState because this control doesn't have receivedState (but still should set asyncControl to true)", function () {
            const node = {
               key: '_'
            };
            const controlInstance = {
               _$resultBeforeMount: Promise.resolve()
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            instance.changedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            });
            instance.componentsStack.push(0);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            instance.isProfiling = true;

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               },
               instance: controlInstance
            });

            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.equal(instance.vNodeToId.get(node), 0);
            assert.equal(instance.instanceToId.get(controlInstance), 0);
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: currentTime - 10,
                  treeDuration: 0,
                  parentId: undefined,
                  logicParentId: undefined,
                  options: {
                     value: '123'
                  },
                  instance: controlInstance,
                  asyncControl: true
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
         });

         it('should add ref to the node', function () {
            const generatedRef = () => {};
            const childRef = () => {};
            const node = {
               type: 'TemplateNode',
               key: '_',
               children: [
                  {
                     ref: childRef
                  }
               ]
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'getRef').returns(generatedRef);

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/Application',
               0,
               OperationType.CREATE
            );
            assert.equal(instance.vNodeToId.get(node), 0);
            const expectedChangedRoots = new Map();
            expectedChangedRoots.set(0, new Map());
            expectedChangedRoots.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: currentTime - 10,
                  treeDuration: 0,
                  parentId: undefined,
                  logicParentId: undefined,
                  options: {
                     value: '123'
                  }
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedChangedRoots);
            assert.deepEqual(instance.componentsStack, []);
            assert.equal(node.children[0].ref, generatedRef);
            sinon.assert.calledWithExactly(
               ContainerHandling.getRef,
               instance.idToContainers,
               instance.idToParentId,
               instance.domToIds,
               0,
               childRef
            );
         });

         it('should not add ref to the node (child is a template node)', function () {
            const childRef = () => {};
            const node = {
               type: 'TemplateNode',
               key: '_',
               children: [
                  {
                     type: 'TemplateNode',
                     ref: childRef
                  }
               ]
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'getRef');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            assert.equal(node.children[0].ref, childRef);
            sinon.assert.notCalled(ContainerHandling.getRef);
         });

         it('should not add ref to the node (child is a control node)', function () {
            const childRef = () => {};
            const node = {
               type: 'TemplateNode',
               key: '_',
               children: [
                  {
                     controlClass: () => {},
                     ref: childRef
                  }
               ]
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'getRef');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            assert.equal(node.children[0].ref, childRef);
            sinon.assert.notCalled(ContainerHandling.getRef);
         });

         it('should not update container of the control', function () {
            const node = {
               controlClass: () => {},
               key: '_'
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'updateContainer');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.notCalled(ContainerHandling.updateContainer);
         });

         it('should update container of the control because it has element', function () {
            const element = document.createElement('div');
            const node = {
               controlClass: () => {},
               key: '_',
               element
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'updateContainer');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.calledWithExactly(
               ContainerHandling.updateContainer,
               instance.idToContainers,
               instance.idToParentId,
               instance.domToIds,
               0,
               element,
               undefined
            );
         });

         it('should update container of the control because it has element. Also should pass the old container to the updateContainer function', function () {
            const element = document.createElement('div');
            const node = {
               controlClass: () => {},
               key: '_',
               element
            };
            const oldElement = document.createElement('div');
            instance.idToContainers.set(0, [oldElement]);
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'updateContainer');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.calledWithExactly(
               ContainerHandling.updateContainer,
               instance.idToContainers,
               instance.idToParentId,
               instance.domToIds,
               0,
               element,
               oldElement
            );
         });

         it('should proxy element property of the control node because it has markup', function () {
            const node = {
               controlClass: () => {},
               key: '_',
               markup: {}
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'updateContainer');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.notCalled(ContainerHandling.updateContainer);

            const element = document.createElement('div');
            node.element = element;

            assert.equal(node.element, element);
            sinon.assert.calledWithExactly(
               ContainerHandling.updateContainer,
               instance.idToContainers,
               instance.idToParentId,
               instance.domToIds,
               0,
               element,
               undefined
            );
         });

         it("should proxy element property of the control node because it has markup. Then shouldn't call updateContainer the second time, because it would be with the same container", function () {
            const node = {
               controlClass: () => {},
               key: '_',
               markup: {}
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'updateContainer');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.notCalled(ContainerHandling.updateContainer);

            const element = document.createElement('div');
            node.element = element;

            assert.equal(node.element, element);
            sinon.assert.calledWithExactly(
               ContainerHandling.updateContainer,
               instance.idToContainers,
               instance.idToParentId,
               instance.domToIds,
               0,
               element,
               undefined
            );

            node.element = element;
            assert.equal(node.element, element);
            sinon.assert.calledOnce(ContainerHandling.updateContainer);
         });

         it('should proxy element property of the control node because it has markup. Then should call updateContainer the second time, because it would be with a new container', function () {
            const node = {
               controlClass: () => {},
               key: '_',
               markup: {}
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'updateContainer');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.notCalled(ContainerHandling.updateContainer);

            const element = document.createElement('div');
            node.element = element;

            assert.equal(node.element, element);
            sinon.assert.calledWithExactly(
               ContainerHandling.updateContainer,
               instance.idToContainers,
               instance.idToParentId,
               instance.domToIds,
               0,
               element,
               undefined
            );

            const secondElement = document.createElement('div');
            node.element = secondElement;
            assert.equal(node.element, secondElement);
            sinon.assert.calledWithExactly(
               ContainerHandling.updateContainer,
               instance.idToContainers,
               instance.idToParentId,
               instance.domToIds,
               0,
               secondElement,
               element
            );
            sinon.assert.calledTwice(ContainerHandling.updateContainer);
         });

         it("should not update container of the template because it doesn't have any children", function () {
            const node = {
               type: 'TemplateNode',
               key: '_'
            };
            instance.rootStack.push(0);
            instance.changedRoots.set(0, new Map());
            const changedNode = {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 0,
                  treeDuration: 0
               },
               operation: OperationType.CREATE
            };
            instance.changedRoots.get(0).set(0, changedNode);
            instance.componentsStack.push(0);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            sandbox.stub(ContainerHandling, 'updateContainer');

            instance.onEndCommit(node, {
               options: {
                  value: '123'
               }
            });

            sinon.assert.notCalled(ContainerHandling.updateContainer);
         });
      });

      describe('saveChildren', function () {
         let instance;
         beforeEach(function () {
            instance = new Agent({
               logger: {
                  error: sandbox.stub()
               }
            });
         });
         afterEach(function () {
            instance.channel.destructor();
            instance = undefined;
         });

         it('should not change vNodeToParentId because saveChildren was called with undefined', function () {
            sandbox.stub(instance.vNodeToParentId, 'set');

            instance.saveChildren(undefined);

            sinon.assert.notCalled(instance.vNodeToParentId.set);
         });

         it('should save the node in vNodeToParentId (the node is a control node)', function () {
            instance.rootStack.push(0);
            instance.componentsStack.push(0);
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0
                        }
                     }
                  ]
               ])
            );
            const child = {
               controlClass: class Test {}
            };

            instance.saveChildren(child);

            assert.equal(instance.vNodeToParentId.get(child), 0);
         });

         it('should save the node in vNodeToParentId (the node is a template node)', function () {
            instance.rootStack.push(0);
            instance.componentsStack.push(0);
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0
                        }
                     }
                  ]
               ])
            );
            const child = {
               type: 'TemplateNode'
            };

            instance.saveChildren(child);

            assert.equal(instance.vNodeToParentId.get(child), 0);
         });

         it('should save the node in vNodeToParentId (the node is inside children property)', function () {
            instance.rootStack.push(0);
            instance.componentsStack.push(0);
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0
                        }
                     }
                  ]
               ])
            );
            const child = {
               type: 'TemplateNode'
            };

            instance.saveChildren({
               children: child
            });

            assert.equal(instance.vNodeToParentId.get(child), 0);
         });

         it('should save every node in vNodeToParentId', function () {
            instance.rootStack.push(0);
            instance.componentsStack.push(0);
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0
                        }
                     }
                  ]
               ])
            );
            const firstChild = {
               type: 'TemplateNode'
            };
            const secondChild = {
               controlClass: class Test {}
            };
            const thirdChild = {
               type: 'TemplateNode'
            };

            instance.saveChildren([firstChild, secondChild, thirdChild]);

            assert.equal(instance.vNodeToParentId.get(firstChild), 0);
            assert.equal(instance.vNodeToParentId.get(secondChild), 0);
            assert.equal(instance.vNodeToParentId.get(thirdChild), 0);
         });
      });

      describe('onStartLifecycle', function () {
         it("should log error because the node with this id doesn't exist", function () {
            const node = {};
            instance.vNodeToId.set(node, 1);

            instance.onStartLifecycle(node);

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               'Trying to mark the start of a lifecycle method of a node that was not changed during this synchronization. Node id: 1.'
            );
         });

         it('should put the node on the stack and update its selfStartTime', function () {
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'startMark');
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0,
                           name: 'Controls/Application',
                           selfStartTime: 10,
                           selfDuration: 0,
                           treeDuration: 0
                        },
                        operation: OperationType.CREATE
                     }
                  ]
               ])
            );
            instance.changedRoots.set(
               1,
               new Map([
                  [
                     1,
                     {
                        node: {
                           id: 1,
                           name: 'Controls/popup:Manager',
                           selfStartTime: 5,
                           selfDuration: 0,
                           treeDuration: 0
                        },
                        operation: OperationType.CREATE
                     }
                  ]
               ])
            );
            const node = {};
            instance.vNodeToId.set(node, 1);

            instance.onStartLifecycle(node);

            assert.deepEqual(
               instance.changedRoots,
               new Map([
                  [
                     0,
                     new Map([
                        [
                           0,
                           {
                              node: {
                                 id: 0,
                                 name: 'Controls/Application',
                                 selfStartTime: 10,
                                 selfDuration: 0,
                                 treeDuration: 0
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ],
                  [
                     1,
                     new Map([
                        [
                           1,
                           {
                              node: {
                                 id: 1,
                                 name: 'Controls/popup:Manager',
                                 selfStartTime: currentTime,
                                 selfDuration: 0,
                                 treeDuration: 0
                              },
                              operation: OperationType.CREATE
                           }
                        ]
                     ])
                  ]
               ])
            );
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.startMark,
               'Controls/popup:Manager',
               1
            );
            assert.deepEqual(instance.componentsStack, [1]);
         });
      });

      describe('onEndLifecycle', function () {
         it("should log error because the node with this id doesn't exist", function () {
            const node = {};
            instance.vNodeToId.set(node, 1);

            instance.onEndLifecycle(node);

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               'Trying to mark the end of a lifecycle method of a node that was not changed during this synchronization. Node id: 1.'
            );
         });

         it('should remove the node from the stack and update selfDuration', function () {
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0,
                           name: 'Controls/Application',
                           selfStartTime: 10,
                           selfDuration: 10,
                           treeDuration: 10,
                           lifecycleDuration: 0
                        },
                        operation: OperationType.CREATE
                     }
                  ]
               ])
            );
            instance.changedRoots.set(
               1,
               new Map([
                  [
                     1,
                     {
                        node: {
                           id: 1,
                           name: 'Controls/popup:Manager',
                           selfStartTime: 10,
                           selfDuration: 5,
                           treeDuration: 5,
                           lifecycleDuration: 0
                        },
                        operation: OperationType.CREATE
                     }
                  ]
               ])
            );
            const node = {};
            instance.vNodeToId.set(node, 1);
            instance.componentsStack.push(1);

            instance.onEndLifecycle(node);

            const expectedResult = new Map();
            expectedResult.set(0, new Map());
            expectedResult.set(1, new Map());
            expectedResult.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 10,
                  treeDuration: 10,
                  lifecycleDuration: 0
               },
               operation: OperationType.CREATE
            });
            expectedResult.get(1).set(1, {
               node: {
                  id: 1,
                  name: 'Controls/popup:Manager',
                  selfStartTime: 10,
                  selfDuration: 5 + currentTime - 10,
                  treeDuration: 5,
                  lifecycleDuration: -7
               },
               operation: OperationType.CREATE
            });
            assert.deepEqual(instance.changedRoots, expectedResult);
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/popup:Manager',
               1
            );
            assert.deepEqual(instance.componentsStack, []);
         });

         it('should remove the node from the stack, update selfDuration and update treeDuration and selfDuration of its parent', function () {
            const currentTime = 3;
            sandbox.stub(performance, 'now').returns(currentTime);
            sandbox.stub(UserTimingAPIUtils, 'endMark');
            instance.changedRoots.set(
               0,
               new Map([
                  [
                     0,
                     {
                        node: {
                           id: 0,
                           name: 'Controls/Application',
                           selfStartTime: 10,
                           selfDuration: 15,
                           treeDuration: 15,
                           lifecycleDuration: 0
                        },
                        operation: OperationType.UPDATE
                     }
                  ],
                  [
                     1,
                     {
                        node: {
                           id: 1,
                           parentId: 0,
                           name: 'Controls/popup:Manager',
                           selfStartTime: 10,
                           selfDuration: 5,
                           treeDuration: 5,
                           lifecycleDuration: 0
                        },
                        operation: OperationType.UPDATE
                     }
                  ]
               ])
            );
            const node = {};
            instance.vNodeToId.set(node, 1);
            instance.componentsStack.push(1);
            const lifecycleDuration = currentTime - 10;

            instance.onEndLifecycle(node);

            const expectedResult = new Map();
            expectedResult.set(0, new Map());
            expectedResult.get(0).set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfStartTime: 10,
                  selfDuration: 15 + lifecycleDuration,
                  treeDuration: 15 + lifecycleDuration,
                  lifecycleDuration: 0
               },
               operation: OperationType.UPDATE
            });
            expectedResult.get(0).set(1, {
               node: {
                  id: 1,
                  parentId: 0,
                  name: 'Controls/popup:Manager',
                  selfStartTime: 10,
                  selfDuration: 5 + lifecycleDuration,
                  treeDuration: 5,
                  lifecycleDuration
               },
               operation: OperationType.UPDATE
            });
            assert.deepEqual(instance.changedRoots, expectedResult);
            sinon.assert.calledWithExactly(
               UserTimingAPIUtils.endMark,
               'Controls/popup:Manager',
               1
            );
            assert.deepEqual(instance.componentsStack, []);
         });
      });

      describe('onEndSync', function () {
         describe('should apply every basic operation (create, update, delete) and correctly update state', function () {
            let removedContainer;
            let addedContainer;
            let expectedElements;
            let firstInstance;
            let secondInstance;
            beforeEach(() => {
               sandbox.stub(UserTimingAPIUtils, 'endSyncMark');
               instance.rootStack.push(0);
               const changes = new Map();

               removedContainer = document.createElement('div');
               firstInstance = {};
               instance.elements.set(0, {
                  id: 0,
                  containers: [removedContainer],
                  selfDuration: 5,
                  treeDuration: 0,
                  instance: firstInstance
               });
               instance.domToIds.set(removedContainer, [0]);
               instance.instanceToId.set(firstInstance, 0);
               changes.set(0, {
                  node: {
                     id: 0,
                     containers: [removedContainer],
                     selfDuration: 2,
                     treeDuration: 0,
                     instance: firstInstance
                  },
                  operation: OperationType.DELETE
               });

               addedContainer = document.createElement('div');
               secondInstance = {};
               changes.set(1, {
                  node: {
                     id: 1,
                     name: 'Controls/Application',
                     options: {
                        test: 789
                     },
                     selfDuration: 15,
                     treeDuration: 5,
                     containers: [addedContainer],
                     instance: secondInstance
                  },
                  operation: OperationType.CREATE
               });

               instance.elements.set(2, {
                  id: 2,
                  options: {
                     value: 123
                  },
                  selfDuration: 10,
                  treeDuration: 0
               });
               changes.set(2, {
                  node: {
                     id: 2,
                     options: {
                        value: 456
                     },
                     selfDuration: 5,
                     treeDuration: 0,
                     containers: [document.body]
                  },
                  operation: OperationType.UPDATE
               });

               instance.changedRoots.set(0, changes);

               expectedElements = new Map();
               expectedElements.set(1, {
                  id: 1,
                  name: 'Controls/Application',
                  options: {
                     test: 789
                  },
                  selfDuration: 10,
                  treeDuration: 5,
                  containers: [addedContainer],
                  instance: secondInstance
               });
               instance.instanceToId.set(secondInstance, 1);
               expectedElements.set(2, {
                  id: 2,
                  options: {
                     value: 456
                  },
                  selfDuration: 5,
                  treeDuration: 0,
                  containers: [document.body]
               });
            });

            it('without notifying devtools', function () {
               instance.onEndSync(0);

               assert.deepEqual(instance.elements, expectedElements);
               sinon.assert.calledWithExactly(
                  UserTimingAPIUtils.endSyncMark,
                  0
               );
               assert.deepEqual(instance.rootStack, []);
               assert.deepEqual(instance.changedRoots, new Map());
               assert.isFalse(instance.instanceToId.has(firstInstance));
               assert.equal(instance.instanceToId.get(secondInstance), 1);
            });

            it('should notify devtools', function () {
               stubWasabyDevHook();
               sandbox
                  .stub(guid, 'guid')
                  .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
               sandbox.stub(instance.channel, 'dispatch');
               instance.isDevtoolsOpened = true;

               instance.onEndSync(0);

               assert.deepEqual(instance.elements, expectedElements);
               sinon.assert.calledWithExactly(
                  UserTimingAPIUtils.endSyncMark,
                  0
               );
               assert.deepEqual(instance.rootStack, []);
               assert.deepEqual(instance.changedRoots, new Map());

               sinon.assert.calledWithExactly(
                  window.__WASABY_DEV_HOOK__.pushMessage.firstCall,
                  'operation',
                  [OperationType.DELETE, 0]
               );
               sinon.assert.calledWithExactly(
                  window.__WASABY_DEV_HOOK__.pushMessage.secondCall,
                  'operation',
                  [
                     OperationType.CREATE,
                     1,
                     'Controls/Application',
                     ControlType.CONTROL
                  ]
               );
               sinon.assert.calledWithExactly(
                  window.__WASABY_DEV_HOOK__.pushMessage.thirdCall,
                  'operation',
                  [OperationType.UPDATE, 2]
               );
               sinon.assert.calledWithExactly(
                  window.__WASABY_DEV_HOOK__.pushMessage.getCall(3),
                  'endSynchronization',
                  '90ba6e97-ed16-4853-a635-ea4c6a929162'
               );
               assert.isTrue(
                  instance.channel.dispatch.lastCall.calledAfter(
                     window.__WASABY_DEV_HOOK__.pushMessage.getCall(3)
                  )
               );
               sinon.assert.calledWithExactly(
                  instance.channel.dispatch,
                  'longMessage'
               );
               assert.isFalse(instance.instanceToId.has(firstInstance));
               assert.equal(instance.instanceToId.get(secondInstance), 1);

               // cleanup
               delete window.__WASABY_DEV_HOOK__;
            });
         });

         it("should log error because the root doesn't exist", function () {
            instance.onEndSync(0);

            assert.equal(
               instance.logger.error.firstCall.args[0].message,
               'The synchronization for the root with the id: 0 was never started.'
            );
         });

         it('should add the profiling data', function () {
            sandbox.stub(instance.mutationObserver, 'disconnect');
            sandbox
               .stub(guid, 'guid')
               .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
            const addedContainer = document.createElement('div');
            sandbox.stub(instance.mutationObserver, 'takeRecords').returns([
               {
                  target: addedContainer
               },
               {
                  target: document.body
               }
            ]);
            instance.domToIds.set(document.body, [2]);
            instance.isProfiling = true;
            instance.rootStack.push(0);
            const changes = new Map();

            const removedContainer = document.createElement('div');
            instance.elements.set(0, {
               id: 0,
               containers: [removedContainer],
               selfDuration: 5,
               treeDuration: 0
            });
            instance.domToIds.set(removedContainer, [0]);
            changes.set(0, {
               node: {
                  id: 0,
                  containers: [removedContainer],
                  selfDuration: 2,
                  treeDuration: 0
               },
               operation: OperationType.DELETE
            });

            changes.set(1, {
               node: {
                  id: 1,
                  name: 'Controls/Application',
                  selfDuration: 15,
                  treeDuration: 5,
                  containers: [addedContainer]
               },
               operation: OperationType.CREATE
            });

            instance.elements.set(2, {
               id: 2,
               selfDuration: 10,
               treeDuration: 0
            });
            changes.set(2, {
               node: {
                  id: 2,
                  selfDuration: 5,
                  treeDuration: 0,
                  containers: [document.body]
               },
               operation: OperationType.UPDATE
            });

            instance.changedRoots.set(0, changes);
            // setup end

            instance.onEndSync(0);

            const expectedElements = new Map();
            expectedElements.set(1, {
               id: 1,
               name: 'Controls/Application',
               selfDuration: 10,
               treeDuration: 5,
               containers: [addedContainer],
               domChanged: true,
               isVisible: false
            });
            expectedElements.set(2, {
               id: 2,
               selfDuration: 5,
               treeDuration: 0,
               domChanged: true,
               isVisible: true,
               containers: [document.body]
            });
            assert.deepEqual(instance.elements, expectedElements);
            assert.deepEqual(instance.dirtyContainers, new Set());
            assert.deepEqual(instance.dirtyControls, new Set());
            assert.deepEqual(
               instance.changedNodesBySynchronization,
               new Map([['90ba6e97-ed16-4853-a635-ea4c6a929162', changes]])
            );
            sinon.assert.calledOnce(instance.mutationObserver.disconnect);
         });

         it('should pass parentId to the frontend when a node gets added and devtools are opened', function () {
            stubWasabyDevHook();
            sandbox
               .stub(guid, 'guid')
               .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
            instance.rootStack.push(0);
            sandbox.stub(instance.channel, 'dispatch');
            instance.isDevtoolsOpened = true;
            const changes = new Map();

            instance.elements.set(0, {
               id: 0,
               selfDuration: 5,
               treeDuration: 0
            });
            changes.set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfDuration: 20,
                  treeDuration: 15,
                  containers: [document.body]
               },
               operation: OperationType.UPDATE
            });

            const addedContainer = document.createElement('div');
            changes.set(1, {
               node: {
                  id: 1,
                  parentId: 0,
                  logicParentId: 0,
                  name: 'Controls/SwitchableArea:View',
                  selfDuration: 15,
                  treeDuration: 5,
                  containers: [addedContainer]
               },
               operation: OperationType.CREATE
            });

            instance.changedRoots.set(0, changes);
            // setup end

            instance.onEndSync(0);

            const expectedElements = new Map();
            expectedElements.set(0, {
               id: 0,
               name: 'Controls/Application',
               selfDuration: 5,
               treeDuration: 15,
               containers: [document.body]
            });
            expectedElements.set(1, {
               id: 1,
               parentId: 0,
               logicParentId: 0,
               name: 'Controls/SwitchableArea:View',
               selfDuration: 10,
               treeDuration: 5,
               containers: [addedContainer]
            });
            assert.deepEqual(instance.elements, expectedElements);
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.firstCall,
               'operation',
               [OperationType.UPDATE, 0]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.secondCall,
               'operation',
               [
                  OperationType.CREATE,
                  1,
                  'Controls/SwitchableArea:View',
                  ControlType.TEMPLATE,
                  0,
                  0
               ]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.thirdCall,
               'endSynchronization',
               '90ba6e97-ed16-4853-a635-ea4c6a929162'
            );
            assert.isTrue(
               instance.channel.dispatch.lastCall.calledAfter(
                  window.__WASABY_DEV_HOOK__.pushMessage.thirdCall
               )
            );
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'longMessage'
            );

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });

         it("should convert children's vNodes to children's ids and cleanup the idToChildrenVNodes", function () {
            stubWasabyDevHook();
            sandbox
               .stub(guid, 'guid')
               .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
            instance.rootStack.push(0);
            sandbox.stub(instance.channel, 'dispatch');
            instance.isDevtoolsOpened = true;
            const changes = new Map();

            changes.set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfDuration: 20,
                  treeDuration: 15,
                  containers: [document.body]
               },
               operation: OperationType.CREATE
            });

            const addedContainer = document.createElement('div');
            changes.set(1, {
               node: {
                  id: 1,
                  parentId: 0,
                  logicParentId: 0,
                  name: 'Controls/SwitchableArea:View',
                  selfDuration: 15,
                  treeDuration: 5,
                  containers: [addedContainer]
               },
               operation: OperationType.CREATE
            });
            const childVNode = {};
            instance.vNodeToId.set(childVNode, 1);

            instance.idToChildrenVNodes.set(0, new Set([childVNode]));

            instance.changedRoots.set(0, changes);
            // setup end

            instance.onEndSync(0);

            const expectedElements = new Map();
            expectedElements.set(0, {
               id: 0,
               name: 'Controls/Application',
               selfDuration: 5,
               treeDuration: 15,
               containers: [document.body]
            });
            expectedElements.set(1, {
               id: 1,
               parentId: 0,
               logicParentId: 0,
               name: 'Controls/SwitchableArea:View',
               selfDuration: 10,
               treeDuration: 5,
               containers: [addedContainer]
            });
            assert.deepEqual(instance.elements, expectedElements);
            assert.deepEqual(instance.idToChildrenVNodes, new Map());
            assert.deepEqual(
               instance.idToChildrenIds,
               new Map([[0, new Set([1])]])
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.firstCall,
               'operation',
               [OperationType.CREATE, 0, 'Controls/Application', 0]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.secondCall,
               'operation',
               [
                  OperationType.CREATE,
                  1,
                  'Controls/SwitchableArea:View',
                  ControlType.TEMPLATE,
                  0,
                  0
               ]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.thirdCall,
               'endSynchronization',
               '90ba6e97-ed16-4853-a635-ea4c6a929162'
            );
            assert.isTrue(
               instance.channel.dispatch.lastCall.calledAfter(
                  window.__WASABY_DEV_HOOK__.pushMessage.thirdCall
               )
            );
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'longMessage'
            );

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });

         it('TBD', function () {
            stubWasabyDevHook();
            sandbox
               .stub(guid, 'guid')
               .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
            instance.rootStack.push(0);
            sandbox.stub(instance.channel, 'dispatch');
            instance.isDevtoolsOpened = true;
            const changes = new Map();

            instance.elements.set(0, {
               id: 0,
               selfDuration: 5,
               treeDuration: 0
            });
            changes.set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfDuration: 20,
                  treeDuration: 15,
                  containers: [document.body]
               },
               operation: OperationType.UPDATE
            });

            const addedContainer = document.createElement('div');
            changes.set(1, {
               node: {
                  id: 1,
                  parentId: 0,
                  logicParentId: 0,
                  name: 'Controls/SwitchableArea:View',
                  selfDuration: 15,
                  treeDuration: 5,
                  containers: [addedContainer]
               },
               operation: OperationType.CREATE
            });

            instance.changedRoots.set(0, changes);
            // setup end

            instance.onEndSync(0);

            const expectedElements = new Map();
            expectedElements.set(0, {
               id: 0,
               name: 'Controls/Application',
               selfDuration: 5,
               treeDuration: 15,
               containers: [document.body]
            });
            expectedElements.set(1, {
               id: 1,
               parentId: 0,
               logicParentId: 0,
               name: 'Controls/SwitchableArea:View',
               selfDuration: 10,
               treeDuration: 5,
               containers: [addedContainer]
            });
            assert.deepEqual(instance.elements, expectedElements);
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.firstCall,
               'operation',
               [OperationType.UPDATE, 0]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.secondCall,
               'operation',
               [
                  OperationType.CREATE,
                  1,
                  'Controls/SwitchableArea:View',
                  ControlType.TEMPLATE,
                  0,
                  0
               ]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.thirdCall,
               'endSynchronization',
               '90ba6e97-ed16-4853-a635-ea4c6a929162'
            );
            assert.isTrue(
               instance.channel.dispatch.lastCall.calledAfter(
                  window.__WASABY_DEV_HOOK__.pushMessage.thirdCall
               )
            );
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'longMessage'
            );

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });

         it('should add the node if a new node was added with the wrong operation', function () {
            stubWasabyDevHook();
            sandbox
               .stub(guid, 'guid')
               .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
            instance.rootStack.push(0);
            sandbox.stub(instance.channel, 'dispatch');
            instance.isDevtoolsOpened = true;
            const changes = new Map();

            changes.set(0, {
               node: {
                  id: 0,
                  name: 'Controls/Application',
                  selfDuration: 15,
                  treeDuration: 0,
                  containers: [document.body]
               },
               operation: OperationType.UPDATE
            });

            instance.changedRoots.set(0, changes);
            // setup end

            instance.onEndSync(0);

            const expectedElements = new Map();
            expectedElements.set(0, {
               id: 0,
               name: 'Controls/Application',
               selfDuration: 15,
               treeDuration: 0,
               containers: [document.body]
            });
            assert.deepEqual(instance.elements, expectedElements);
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.firstCall,
               'operation',
               [
                  OperationType.CREATE,
                  0,
                  'Controls/Application',
                  ControlType.TEMPLATE
               ]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.secondCall,
               'endSynchronization',
               '90ba6e97-ed16-4853-a635-ea4c6a929162'
            );
            assert.isTrue(
               instance.channel.dispatch.lastCall.calledAfter(
                  window.__WASABY_DEV_HOOK__.pushMessage.secondCall
               )
            );
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'longMessage'
            );

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });

         it('should remove children of the node when it gets deleted', function () {
            instance.idToParentId.set(1, 0);
            instance.idToParentId.set(2, 1);
            instance.idToParentId.set(3, 0);
            stubWasabyDevHook();
            sandbox
               .stub(guid, 'guid')
               .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
            instance.rootStack.push(0);
            sandbox.stub(instance.channel, 'dispatch');
            instance.isDevtoolsOpened = true;
            const changes = new Map();

            changes.set(0, {
               node: {
                  id: 0,
                  selfDuration: 15,
                  treeDuration: 10
               },
               operation: OperationType.DELETE
            });
            instance.elements.set(0, {
               id: 0,
               selfDuration: 15,
               treeDuration: 10
            });
            instance.elements.set(1, {
               id: 1,
               parentId: 0,
               selfDuration: 4,
               treeDuration: 2
            });
            instance.elements.set(2, {
               id: 2,
               parentId: 1,
               selfDuration: 2,
               treeDuration: 0
            });
            instance.elements.set(3, {
               id: 3,
               parentId: 0,
               selfDuration: 6,
               treeDuration: 0
            });
            instance.idToChildrenIds.set(0, new Set([1, 3]));
            instance.idToChildrenIds.set(1, new Set([2]));

            instance.changedRoots.set(0, changes);
            // setup end

            instance.onEndSync(0);

            assert.deepEqual(instance.elements, new Map());
            assert.deepEqual(instance.idToParentId, new Map());
            assert.deepEqual(instance.idToChildrenIds, new Map());
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.firstCall,
               'operation',
               [OperationType.DELETE, 2]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.secondCall,
               'operation',
               [OperationType.DELETE, 1]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.thirdCall,
               'operation',
               [OperationType.DELETE, 3]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.getCall(3),
               'operation',
               [OperationType.DELETE, 0]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.getCall(4),
               'endSynchronization',
               '90ba6e97-ed16-4853-a635-ea4c6a929162'
            );
            assert.isTrue(
               instance.channel.dispatch.lastCall.calledAfter(
                  window.__WASABY_DEV_HOOK__.pushMessage.getCall(4)
               )
            );
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'longMessage'
            );

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });

         it('should remove the node and its children if it got deleted without message', function () {
            instance.idToParentId.set(1, 0);
            instance.idToParentId.set(2, 1);
            instance.idToParentId.set(3, 0);
            stubWasabyDevHook();
            sandbox
               .stub(guid, 'guid')
               .returns('90ba6e97-ed16-4853-a635-ea4c6a929162');
            instance.rootStack.push(0);
            sandbox.stub(instance.channel, 'dispatch');
            instance.isDevtoolsOpened = true;
            instance.deletedChildrenIds.add(0);
            const changes = new Map();

            instance.elements.set(0, {
               id: 0,
               selfDuration: 15,
               treeDuration: 10
            });
            instance.elements.set(1, {
               id: 1,
               parentId: 0,
               selfDuration: 4,
               treeDuration: 2
            });
            instance.elements.set(2, {
               id: 2,
               parentId: 1,
               selfDuration: 2,
               treeDuration: 0
            });
            instance.elements.set(3, {
               id: 3,
               parentId: 0,
               selfDuration: 6,
               treeDuration: 0
            });
            instance.idToChildrenIds.set(0, new Set([1, 3]));
            instance.idToChildrenIds.set(1, new Set([2]));

            instance.changedRoots.set(0, changes);
            // setup end

            instance.onEndSync(0);

            assert.deepEqual(instance.elements, new Map());
            assert.deepEqual(instance.idToParentId, new Map());
            assert.deepEqual(instance.idToChildrenIds, new Map());
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.firstCall,
               'operation',
               [OperationType.DELETE, 2]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.secondCall,
               'operation',
               [OperationType.DELETE, 1]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.thirdCall,
               'operation',
               [OperationType.DELETE, 3]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.getCall(3),
               'operation',
               [OperationType.DELETE, 0]
            );
            sinon.assert.calledWithExactly(
               window.__WASABY_DEV_HOOK__.pushMessage.getCall(4),
               'endSynchronization',
               '90ba6e97-ed16-4853-a635-ea4c6a929162'
            );
            assert.isTrue(
               instance.channel.dispatch.lastCall.calledAfter(
                  window.__WASABY_DEV_HOOK__.pushMessage.getCall(4)
               )
            );
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'longMessage'
            );

            // cleanup
            delete window.__WASABY_DEV_HOOK__;
         });
      });

      describe('selectByDomNode', function () {
         it('should fire stopSelectFromPage event', function () {
            sandbox.stub(hookUtils, 'findControlByDomNode').returns(undefined);
            sandbox.stub(instance.channel, 'dispatch');

            instance.selectByDomNode(document.body);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'stopSelectFromPage'
            );
         });

         it('should fire setSelectedItem event with the id of the control', function () {
            sandbox.stub(hookUtils, 'findControlByDomNode').returns({
               id: 123
            });
            sandbox.stub(instance.channel, 'dispatch');

            instance.selectByDomNode(document.body);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'setSelectedItem',
               123
            );
         });
      });

      describe('mutationObserverCallback', function () {
         it('should mark container and every control on it as dirty', function () {
            const mutations = [
               {
                  target: document.body
               }
            ];
            instance.domToIds.set(document.body, [0, 1]);

            instance.mutationObserverCallback(mutations);

            assert.deepEqual(
               instance.dirtyContainers,
               new Set([document.body])
            );
            assert.deepEqual(instance.dirtyControls, new Set([0, 1]));
         });

         it('should not process the container multiple times if it gets changed multiple times during one synchronization', function () {
            sandbox.spy(instance.dirtyContainers, 'add');
            const mutations = [
               {
                  target: document.body
               }
            ];
            instance.domToIds.set(document.body, [0, 1]);

            instance.mutationObserverCallback(mutations);
            instance.mutationObserverCallback(mutations);

            assert.deepEqual(
               instance.dirtyContainers,
               new Set([document.body])
            );
            assert.deepEqual(instance.dirtyControls, new Set([0, 1]));
            sinon.assert.calledOnce(instance.dirtyContainers.add);
         });

         it('should climb the DOM-tree up until it finds the closest control', function () {
            const parent = document.createElement('div');
            const child = document.createElement('div');
            parent.appendChild(child);
            document.body.appendChild(parent);
            const mutations = [
               {
                  target: child
               }
            ];
            instance.domToIds.set(document.body, [0, 1]);

            instance.mutationObserverCallback(mutations);

            assert.deepEqual(
               instance.dirtyContainers,
               new Set([child, parent, document.body])
            );
            assert.deepEqual(instance.dirtyControls, new Set([0, 1]));

            // cleanup
            parent.remove();
         });
      });

      describe('start with profiling', function () {
         it('should read received states', function () {
            window.__WASABY_START_PROFILING = true;
            window.receivedStates = '{"_":{"value":123},"_0_":true}';

            const localInstance = new Agent({
               logger: {
                  error: sandbox.stub()
               }
            });

            assert.isTrue(localInstance.isDevtoolsOpened);
            assert.deepEqual(
               localInstance.controlsWithReceivedStates,
               new Set(['_', '_0_'])
            );

            // cleanup
            localInstance.mutationObserver.disconnect();
            localInstance.channel.destructor();
            delete window.__WASABY_START_PROFILING;
            delete window.receivedStates;
         });
      });
   });
});
