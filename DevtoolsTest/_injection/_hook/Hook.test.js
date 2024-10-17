define([
   'injection/_hook/Hook',
   'injection/_devtool/globalChannel',
   'injection/_hook/Agent',
   'DevtoolsTest/getJSDOM'
], function (Hook, globalChannel, Agent, getJSDOM) {
   let sandbox;
   let instance;
   const needJSDOM = typeof window === 'undefined';
   Hook = Hook.Hook;

   function stubWasabyDevtoolsOptions(value) {
      window.wasabyDevtoolsOptions = value;
   }

   describe('injection/_hook/Hook', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.window;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      beforeEach(function () {
         instance = new Hook({
            create: sandbox.stub()
         });
         stubWasabyDevtoolsOptions();
      });

      afterEach(function () {
         instance = undefined;
      });

      describe('onStartCommit', function () {
         it('should not throw if agent is not initialized', function () {
            const oldNode = {
               value: 123
            };

            assert.doesNotThrow(() => {
               instance.onStartCommit(0, 'Controls/Application', oldNode);
            });
         });

         it('should pass the call to the agent', function () {
            const oldNode = {
               value: 123
            };
            instance._agent = {
               onStartCommit: sandbox.stub()
            };

            instance.onStartCommit(0, 'Controls/Application', oldNode);

            sinon.assert.calledWithExactly(
               instance._agent.onStartCommit,
               0,
               'Controls/Application',
               oldNode
            );
         });
      });

      describe('onEndCommit', function () {
         it('should not throw if agent is not initialized', function () {
            const node = {
               value: 123
            };
            const data = {
               value: 456
            };

            assert.doesNotThrow(() => {
               instance.onEndCommit(node, data);
            });
         });

         it('should pass the call to the agent', function () {
            const node = {
               value: 123
            };
            const data = {
               value: 456
            };
            instance._agent = {
               onEndCommit: sandbox.stub()
            };

            instance.onEndCommit(node, data);

            sinon.assert.calledWithExactly(
               instance._agent.onEndCommit,
               node,
               data
            );
         });
      });

      describe('saveChildren', function () {
         it('should not throw if agent is not initialized', function () {
            const children = [
               {
                  value: 123
               }
            ];

            assert.doesNotThrow(() => {
               instance.saveChildren(children);
            });
         });

         it('should pass the call to the agent', function () {
            const children = [
               {
                  value: 123
               }
            ];
            instance._agent = {
               saveChildren: sandbox.stub()
            };

            instance.saveChildren(children);

            sinon.assert.calledWithExactly(
               instance._agent.saveChildren,
               children
            );
         });
      });

      describe('onStartLifecycle', function () {
         it('should not throw if agent is not initialized', function () {
            const node = {
               value: 123
            };

            assert.doesNotThrow(() => {
               instance.onStartLifecycle(node);
            });
         });

         it('should pass the call to the agent', function () {
            const node = {
               value: 123
            };
            instance._agent = {
               onStartLifecycle: sandbox.stub()
            };

            instance.onStartLifecycle(node);

            sinon.assert.calledWithExactly(
               instance._agent.onStartLifecycle,
               node
            );
         });
      });

      describe('onEndLifecycle', function () {
         it('should not throw if agent is not initialized', function () {
            const node = {
               value: 123
            };

            assert.doesNotThrow(() => {
               instance.onEndLifecycle(node);
            });
         });

         it('should pass the call to the agent', function () {
            const node = {
               value: 123
            };
            instance._agent = {
               onEndLifecycle: sandbox.stub()
            };

            instance.onEndLifecycle(node);

            sinon.assert.calledWithExactly(
               instance._agent.onEndLifecycle,
               node
            );
         });
      });

      describe('onStartSync', function () {
         it('should not throw if agent is not initialized', function () {
            assert.doesNotThrow(() => {
               instance.onStartSync(1);
            });
         });

         it('should pass the call to the agent', function () {
            instance._agent = {
               onStartSync: sandbox.stub()
            };

            instance.onStartSync(1);

            sinon.assert.calledWithExactly(instance._agent.onStartSync, 1);
         });
      });

      describe('onEndSync', function () {
         it('should not throw if agent is not initialized', function () {
            assert.doesNotThrow(() => {
               instance.onEndSync(1);
            });
         });

         it('should pass the call to the agent', function () {
            instance._agent = {
               onEndSync: sandbox.stub()
            };

            instance.onEndSync(1);

            sinon.assert.calledWithExactly(instance._agent.onEndSync, 1);
         });
      });

      describe('init', function () {
         it('should not create the agent if neither Elements nor Profiler tab is enabled', function () {
            stubWasabyDevtoolsOptions({
               tabs: ['Debugging']
            });
            sandbox.stub(globalChannel, 'getGlobalChannel');

            instance.init();

            assert.isUndefined(instance._agent);
            assert.isTrue(instance._$hasWasaby);
            sinon.assert.notCalled(globalChannel.getGlobalChannel);
         });

         it('should create the agent because the Elements tabs is enabled', function () {
            stubWasabyDevtoolsOptions({
               tabs: ['Elements']
            });
            const fakeGlobalChannel = {
               addListener: sandbox.stub()
            };
            sandbox
               .stub(globalChannel, 'getGlobalChannel')
               .returns(fakeGlobalChannel);
            const fakeAgent = {
               onStartCommit: sandbox.stub()
            };
            sandbox.stub(Agent, 'default').returns(fakeAgent);

            instance.init();

            assert.equal(instance._agent, fakeAgent);
            sinon.assert.calledWithNew(Agent.default);
            sinon.assert.calledWithExactly(Agent.default, {
               logger: instance._logger
            });
            assert.isTrue(instance._$hasWasaby);
            assert.equal(
               fakeGlobalChannel.addListener.firstCall.args[0],
               'devtoolsClosed'
            );
            assert.isFunction(fakeGlobalChannel.addListener.firstCall.args[1]);

            instance._breakpoints = [];

            fakeGlobalChannel.addListener.firstCall.args[1]();

            assert.isUndefined(instance._breakpoints);
         });

         it('should create the agent because the Profiler tabs is enabled', function () {
            stubWasabyDevtoolsOptions({
               tabs: ['Profiler']
            });
            const fakeGlobalChannel = {
               addListener: sandbox.stub()
            };
            sandbox
               .stub(globalChannel, 'getGlobalChannel')
               .returns(fakeGlobalChannel);
            const fakeAgent = {
               onStartCommit: sandbox.stub()
            };
            sandbox.stub(Agent, 'default').returns(fakeAgent);

            instance.init();

            assert.equal(instance._agent, fakeAgent);
            sinon.assert.calledWithNew(Agent.default);
            sinon.assert.calledWithExactly(Agent.default, {
               logger: instance._logger
            });
            assert.isTrue(instance._$hasWasaby);
            assert.equal(
               fakeGlobalChannel.addListener.firstCall.args[0],
               'devtoolsClosed'
            );
            assert.isFunction(fakeGlobalChannel.addListener.firstCall.args[1]);

            instance._breakpoints = [];

            fakeGlobalChannel.addListener.firstCall.args[1]();

            assert.isUndefined(instance._breakpoints);
         });
      });

      describe('pushMessage', function () {
         it('should add message to messageQueue', function () {
            instance.pushMessage('testEvent', 123);

            assert.deepEqual(instance._messageQueue, [['testEvent', 123]]);

            instance.pushMessage('anotherEvent', 456);

            assert.deepEqual(instance._messageQueue, [
               ['testEvent', 123],
               ['anotherEvent', 456]
            ]);
         });
      });

      describe('readMessageQueue', function () {
         it('should read messages from message queue and empty it', function () {
            instance._messageQueue = [
               ['testEvent', 123],
               ['anotherEvent', 456]
            ];

            const result = instance.readMessageQueue();

            assert.deepEqual(result, [
               ['testEvent', 123],
               ['anotherEvent', 456]
            ]);
            assert.deepEqual(instance._messageQueue, []);
         });
      });
   });
});
