define([
   'Extension/Event/RPC',
   'Extension/Utils/guid',
   'DevtoolsTest/getJSDOM'
], function(RPC, guid, getJSDOM) {
   let instance;
   let sandbox;
   RPC = RPC.RPC;
   const needJSDOM = typeof window === 'undefined';

   describe('Extension/Event/RPC', function() {
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

      beforeEach(function() {
         instance = new RPC({
            channel: {
               addListener: sandbox.stub(),
               removeListener: sandbox.stub(),
               dispatch: sandbox.stub()
            }
         });
      });

      afterEach(function() {
         instance.destructor();
         instance = undefined;
      });

      describe('destructor', function() {
         it('should remove handlers from the channel', function() {
            instance.destructor();

            sinon.assert.calledWithExactly(
               instance._channel.removeListener,
               'data-request',
               instance.__requestHandler
            );
            sinon.assert.calledWithExactly(
               instance._channel.removeListener,
               'data-response',
               instance.__responseHandler
            );
         });
      });

      describe('execute', function() {
         it('should fail after default timeout (10 seconds)', function() {
            const clock = sandbox.useFakeTimers();
            sandbox.stub(guid, 'guid').returns(1);

            const executePromise = instance.execute({
               methodName: 'testMethod',
               args: 123
            });

            clock.tick(10000);

            return executePromise.catch((error) => {
               assert.equal(error.message, 'timeout');
               assert.deepEqual(instance._waitingRequests, new Map());
               assert.deepEqual(instance._waitingTimeout, new Map());
               sinon.assert.calledWithExactly(
                  instance._channel.dispatch,
                  'data-request',
                  {
                     methodName: 'testMethod',
                     id: 1,
                     args: 123
                  }
               );

               // cleanup
               clock.restore();
            });
         });
      });

      describe('registerMethod', function() {
         it('should throw error because the method has a handler', function() {
            instance._methods.set('testMethod', sandbox.stub());

            assert.throws(() => {
               instance.registerMethod('testMethod', sandbox.stub());
            }, 'The method "testMethod" has a handler.');
         });

         it('should save handler', function() {
            const handler = sandbox.stub();

            instance.registerMethod('testMethod', handler);

            assert.deepEqual(
               instance._methods,
               new Map([['testMethod', handler]])
            );
         });
      });

      describe('__responseHandler', function() {
         it("shouldn't do anything because there're no waitingRequests", function() {
            assert.doesNotThrow(() => {
               instance.__responseHandler({
                  id: 1
               });
            });
         });

         it('should resolve waiting request with result', function() {
            sandbox.stub(window, 'clearTimeout');
            const resolve = sandbox.stub();
            instance._waitingRequests.set(1, {
               resolve,
               methodName: 'testMethod'
            });
            instance._waitingTimeout.set(1, 123);

            instance.__responseHandler({
               id: 1,
               result: 456
            });

            assert.deepEqual(instance._waitingRequests, new Map());
            assert.deepEqual(instance._waitingTimeout, new Map());
            sinon.assert.calledWithExactly(window.clearTimeout, 123);
            sinon.assert.calledWithExactly(resolve, 456);
         });

         it('should resolve waiting request with error', function() {
            sandbox.stub(window, 'clearTimeout');
            const rejectedPromise = {};
            sandbox.stub(Promise, 'reject').returns(rejectedPromise);
            const resolve = sandbox.stub();
            instance._waitingRequests.set(1, {
               resolve,
               methodName: 'testMethod'
            });
            instance._waitingTimeout.set(1, 123);

            instance.__responseHandler({
               id: 1,
               error: {
                  message: 'testMessage',
                  code: 500
               }
            });

            assert.deepEqual(instance._waitingRequests, new Map());
            assert.deepEqual(instance._waitingTimeout, new Map());
            sinon.assert.calledWithExactly(window.clearTimeout, 123);
            sinon.assert.calledWithExactly(resolve, rejectedPromise);
            assert.equal(
               Promise.reject.firstCall.args[0].message,
               'testMessage'
            );
            assert.equal(
               Promise.reject.firstCall.args[0].methodName,
               'testMethod'
            );
            assert.equal(Promise.reject.firstCall.args[0].code, 500);
         });

         it('should resolve waiting request with default error', function() {
            sandbox.stub(window, 'clearTimeout');
            const rejectedPromise = {};
            sandbox.stub(Promise, 'reject').returns(rejectedPromise);
            const resolve = sandbox.stub();
            instance._waitingRequests.set(1, {
               resolve,
               methodName: 'testMethod'
            });
            instance._waitingTimeout.set(1, 123);

            instance.__responseHandler({
               id: 1,
               error: {
                  code: 500
               }
            });

            assert.deepEqual(instance._waitingRequests, new Map());
            assert.deepEqual(instance._waitingTimeout, new Map());
            sinon.assert.calledWithExactly(window.clearTimeout, 123);
            sinon.assert.calledWithExactly(resolve, rejectedPromise);
            assert.equal(
               Promise.reject.firstCall.args[0].message,
               'RPC call method "testMethod" error[500]'
            );
            assert.equal(
               Promise.reject.firstCall.args[0].methodName,
               'testMethod'
            );
            assert.equal(Promise.reject.firstCall.args[0].code, 500);
         });
      });

      describe('__requestHandler', function() {
         it('should dispatch response event with 404 error code', function() {
            instance.__requestHandler({
               id: 1,
               args: 123,
               methodName: 'testMethod'
            });

            sinon.assert.calledWithExactly(
               instance._channel.dispatch,
               'data-response',
               {
                  id: 1,
                  error: {
                     message: undefined,
                     code: 404
                  }
               }
            );
         });

         it('should dispatch response event with result (method returns value)', function() {
            instance._methods.set(
               'testMethod',
               sandbox
                  .stub()
                  .withArgs(123)
                  .returns(456)
            );

            instance.__requestHandler({
               id: 1,
               args: 123,
               methodName: 'testMethod'
            });

            sinon.assert.calledWithExactly(
               instance._channel.dispatch,
               'data-response',
               {
                  id: 1,
                  result: 456
               }
            );
         });

         it('should dispatch response event with result (method returns promise)', function(done) {
            instance._methods.set(
               'testMethod',
               sandbox
                  .stub()
                  .withArgs(123)
                  .resolves(456)
            );

            instance.__requestHandler({
               id: 1,
               args: 123,
               methodName: 'testMethod'
            });

            setTimeout(() => {
               sinon.assert.calledWithExactly(
                  instance._channel.dispatch,
                  'data-response',
                  {
                     id: 1,
                     result: 456
                  }
               );

               done();
            }, 0);
         });

         it('should dispatch response event with 500 error code', function(done) {
            const testError = new Error('test error');
            instance._methods.set(
               'testMethod',
               sandbox
                  .stub()
                  .withArgs(123)
                  .rejects(testError)
            );

            instance.__requestHandler({
               id: 1,
               args: 123,
               methodName: 'testMethod'
            });

            setTimeout(() => {
               sinon.assert.calledWithExactly(
                  instance._channel.dispatch,
                  'data-response',
                  {
                     id: 1,
                     error: {
                        code: 500,
                        message: testError
                     }
                  }
               );

               done();
            }, 0);
         });
      });
   });
});
