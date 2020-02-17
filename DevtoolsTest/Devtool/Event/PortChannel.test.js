define(['Devtool/Event/PortChannel'], function(PortChannel) {
   let instance;
   let sandbox;
   PortChannel = PortChannel.PortChannel;

   describe('Devtool/Event/PortChannel', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      beforeEach(function() {
         instance = new PortChannel('testChannel', {
            name: 'Wasaby/devtool-content:tabId=1',
            postMessage: sandbox.stub(),
            onMessage: {
               addListener: sandbox.stub(),
               removeListener: sandbox.stub()
            }
         });
      });

      afterEach(function() {
         instance = undefined;
      });

      describe('dispatch', function() {
         it('should post message through the port', function() {
            instance.dispatch('testEvent', 123);

            sinon.assert.calledWithExactly(instance.port.postMessage, {
               source: 'testChannel',
               args: 123,
               event: 'testEvent'
            });
         });
      });

      describe('addListener', function() {
         it('should pass the call to the emitter', function() {
            const callback = sandbox.stub();
            sandbox.stub(instance.emitter, 'addListener');

            instance.addListener('testEvent', callback);

            sinon.assert.calledWithExactly(
               instance.emitter.addListener,
               'testEvent',
               callback
            );
         });
      });

      describe('removeListener', function() {
         it('should pass the call to the emitter', function() {
            const callback = sandbox.stub();
            sandbox.stub(instance.emitter, 'removeListener');

            instance.removeListener('testEvent', callback);

            sinon.assert.calledWithExactly(
               instance.emitter.removeListener,
               'testEvent',
               callback
            );
         });
      });

      describe('removeAllListeners', function() {
         it('should pass the call to the emitter', function() {
            sandbox.stub(instance.emitter, 'removeAllListeners');

            instance.removeAllListeners('testEvent');

            sinon.assert.calledWithExactly(
               instance.emitter.removeAllListeners,
               'testEvent'
            );
         });
      });

      describe('destructor', function() {
         it('should destroy emitter and removeListener from the port', function() {
            sandbox.stub(instance.emitter, 'destructor');

            instance.destructor();

            sinon.assert.calledOnce(instance.emitter.destructor);
            sinon.assert.calledWithExactly(
               instance.port.onMessage.removeListener,
               instance.__onmessage
            );
         });
      });

      describe('__onmessage', function() {
         it('should not call emitter.dispatch on emitter because event came from another source', function() {
            sandbox.stub(instance.emitter, 'dispatch');

            instance.__onmessage({
               source: 'anotherTestChannel',
               event: 'testEvent',
               args: 123
            });

            sinon.assert.notCalled(instance.emitter.dispatch);
         });

         it('should call emitter.dispatch', function() {
            sandbox.stub(instance.emitter, 'dispatch');

            instance.__onmessage({
               source: 'testChannel',
               event: 'testEvent',
               args: 123
            });

            sinon.assert.calledWithExactly(
               instance.emitter.dispatch,
               'testEvent',
               123
            );
         });

         it('should read messages from the message queue on the frontend and then call emitter.dispatch for each of them', function() {
            sandbox.stub(instance.emitter, 'dispatch');
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .callsArgWith(1, [['testEvent', 123], ['anotherEvent', 456]]);

            instance.__onmessage({
               source: 'testChannel',
               event: 'longMessage'
            });

            sinon.assert.calledWithExactly(
               instance.emitter.dispatch,
               'testEvent',
               123
            );
            sinon.assert.calledWithExactly(
               instance.emitter.dispatch,
               'anotherEvent',
               456
            );
         });

         it('should throw error', function() {
            sandbox.stub(instance.emitter, 'dispatch');
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .callsArgWith(1, undefined, {});

            assert.throws(() => {
               instance.__onmessage({
                  source: 'testChannel',
                  event: 'longMessage'
               });
            }, 'Code evaluation failed');

            sinon.assert.notCalled(instance.emitter.dispatch);
         });
      });
   });
});
