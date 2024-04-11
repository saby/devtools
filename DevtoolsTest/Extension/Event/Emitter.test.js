define(['Extension/Event/Emitter'], function(Emitter) {
   let instance;
   let sandbox;
   Emitter = Emitter.Emitter;

   describe('Extension/Event/Emitter', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      beforeEach(function() {
         instance = new Emitter();
      });

      afterEach(function() {
         instance = undefined;
      });

      describe('addListener', function() {
         it('should correctly save listeners', function() {
            const firstListener = sandbox.stub();
            const secondListener = sandbox.stub();
            const thirdListener = sandbox.stub();
            const expectedListeners = new Map();
            expectedListeners.set('firstEvent', new Set([firstListener]));
            expectedListeners.set('secondEvent', new Set([secondListener]));
            expectedListeners.get('firstEvent').add(thirdListener);

            instance.addListener('firstEvent', firstListener);
            instance.addListener('secondEvent', secondListener);
            instance.addListener('firstEvent', thirdListener);

            assert.deepEqual(instance._listeners, expectedListeners);
         });
      });

      describe('removeListener', function() {
         it("should not throw when there're no listeners", function() {
            assert.doesNotThrow(() => {
               instance.removeListener('firstEvent', sandbox.stub());
            });
         });

         it('should remove listener', function() {
            const firstListener = sandbox.stub();
            const secondListener = sandbox.stub();
            instance._listeners.set('firstEvent', new Set([firstListener]));
            instance._listeners.get('firstEvent').add(secondListener);
            const expectedListeners = new Map();
            expectedListeners.set('firstEvent', new Set([firstListener]));

            instance.removeListener('firstEvent', secondListener);

            assert.deepEqual(instance._listeners, expectedListeners);
         });
      });

      describe('removeAllListeners', function() {
         it('should remove all listeners', function() {
            const firstListener = sandbox.stub();
            const secondListener = sandbox.stub();
            const thirdListener = sandbox.stub();
            instance._listeners.set('firstEvent', new Set([firstListener]));
            instance._listeners.set('secondEvent', new Set([secondListener]));
            instance._listeners.get('firstEvent').add(thirdListener);

            instance.removeAllListeners();

            assert.deepEqual(instance._listeners, new Map());
         });

         it('should remove all listeners of firstEvent', function() {
            const firstListener = sandbox.stub();
            const secondListener = sandbox.stub();
            const thirdListener = sandbox.stub();
            instance._listeners.set('firstEvent', new Set([firstListener]));
            instance._listeners.set('secondEvent', new Set([secondListener]));
            instance._listeners.get('firstEvent').add(thirdListener);

            instance.removeAllListeners('firstEvent');

            assert.deepEqual(
               instance._listeners,
               new Map([['secondEvent', new Set([secondListener])]])
            );
         });
      });

      describe('dispatch', function() {
         it("should not throw when there're no listeners", function() {
            assert.doesNotThrow(() => {
               instance.dispatch('eventName', 123);
            });
         });

         it('should asynchronously call every listener', function() {
            const clock = sinon.useFakeTimers();
            const firstListener = sandbox.stub();
            const secondListener = sandbox.stub();
            const thirdListener = sandbox.stub();
            instance._listeners.set('firstEvent', new Set([firstListener]));
            instance._listeners.set('secondEvent', new Set([secondListener]));
            instance._listeners.get('firstEvent').add(thirdListener);

            instance.dispatch('firstEvent', 123);

            sinon.assert.notCalled(firstListener);
            sinon.assert.notCalled(thirdListener);

            clock.tick(0);

            sinon.assert.calledWithExactly(firstListener, 123);
            sinon.assert.calledWithExactly(thirdListener, 123);
            assert.isTrue(thirdListener.calledAfter(firstListener));
            sinon.assert.notCalled(secondListener);

            // cleanup
            clock.restore();
         });
      });

      describe('destructor', function() {
         it('should remove all listeners', function() {
            const firstListener = sandbox.stub();
            const secondListener = sandbox.stub();
            const thirdListener = sandbox.stub();
            instance._listeners.set('firstEvent', new Set([firstListener]));
            instance._listeners.set('secondEvent', new Set([secondListener]));
            instance._listeners.get('firstEvent').add(thirdListener);

            instance.destructor();

            assert.deepEqual(instance._listeners, new Map());
         });
      });
   });
});
