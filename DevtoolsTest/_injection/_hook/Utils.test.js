define([
   'injection/_hook/Utils',
   'Extension/Plugins/Elements/const',
   'DevtoolsTest/getJSDOM'
], function(Utils, elementsConst, getJSDOM) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_hook/Utils', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
            global.getComputedStyle = dom.window.getComputedStyle;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
            delete global.getComputedStyle;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
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
               containers: [container],
               instance: control
            });

            assert.deepEqual(Utils.getEvents(elements, new WeakMap(), 0), {
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
            const instanceToId = new WeakMap();
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
            const controlNode = {
               containers: [container],
               instance: control
            };
            elements.set(0, controlNode);
            instanceToId.set(control, 0);

            assert.deepEqual(Utils.getEvents(elements, instanceToId, 0, true), {
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

         it('should find the right control node (handler.control === node.instance)', function() {
            const elements = new Map();
            const instanceToId = new WeakMap();
            const container = document.createElement('div');
            const onValueChanged = sandbox.stub();
            const control = {
               onValueChanged
            };
            container.eventProperties = {
               'on:valueChanged': [
                  {
                     fn: {
                        control
                     },
                     value: 'onValueChanged',
                     args: ['1']
                  }
               ]
            };
            const firstControlNode = {
               containers: [container]
            };
            const secondControlNode = {
               containers: [container],
               instance: {}
            };
            const thirdControlNode = {
               containers: [container],
               instance: control
            };
            elements.set(0, firstControlNode);
            elements.set(1, secondControlNode);
            elements.set(2, thirdControlNode);
            instanceToId.set(control, 2);

            assert.deepEqual(Utils.getEvents(elements, instanceToId, 2, true), {
               valueChanged: [
                  {
                     function: onValueChanged,
                     arguments: ['1'],
                     controlNode: thirdControlNode
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
