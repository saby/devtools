define([
   'DevtoolsTest/mockChrome',
   'injection/_focus/RemovalObserver',
   'DevtoolsTest/getJSDOM'
], function (mockChrome, RemovalObserver, getJSDOM) {
   RemovalObserver = RemovalObserver.RemovalObserver;
   let sandbox;
   let instance;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_focus/RemovalObserver', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
            global.MutationObserver = dom.window.MutationObserver;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
            delete global.MutationObserver;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
         instance = new RemovalObserver();
      });

      afterEach(function () {
         sandbox.restore();
         instance.mutationObserver.disconnect();
      });

      describe('observe', function () {
         it('should start the underlying MutationObserver and save the element', function () {
            const elem = document.createElement('div');
            const callback = sandbox.stub();
            sandbox.stub(instance.mutationObserver, 'observe');

            instance.observe(elem, callback);

            sinon.assert.calledWithExactly(
               instance.mutationObserver.observe,
               document.documentElement,
               {
                  childList: true,
                  subtree: true
               }
            );
            assert.deepEqual(
               instance.observedElements,
               new Map([[elem, callback]])
            );
         });

         it('should start the underlying MutationObserver only once, but save both elements', function () {
            const firstElem = document.createElement('div');
            const firstCallback = sandbox.stub();
            const secondElem = document.createElement('div');
            const secondCallback = sandbox.stub();
            sandbox.stub(instance.mutationObserver, 'observe');

            instance.observe(firstElem, firstCallback);
            instance.observe(secondElem, secondCallback);

            sinon.assert.calledOnce(instance.mutationObserver.observe);
            sinon.assert.calledWithExactly(
               instance.mutationObserver.observe,
               document.documentElement,
               {
                  childList: true,
                  subtree: true
               }
            );
            assert.deepEqual(
               instance.observedElements,
               new Map([
                  [firstElem, firstCallback],
                  [secondElem, secondCallback]
               ])
            );
         });
      });

      describe('clearObservedElements', function () {
         it('should disconnect the MutationObserver and clear observed elements', function () {
            sandbox.stub(instance.mutationObserver, 'disconnect');
            sandbox.stub(instance.observedElements, 'clear');

            instance.clearObservedElements();

            sinon.assert.calledOnce(instance.mutationObserver.disconnect);
            sinon.assert.calledOnce(instance.observedElements.clear);
         });
      });

      describe('observerCallback', function () {
         it('should call the callback for each detached element', function () {
            const callback = sandbox.stub();
            const firstDetachedElement = document.createElement('div');
            const secondDetachedElement = document.createElement('div');
            const liveElement = document.createElement('div');
            document.body.append(liveElement);
            instance.observe(firstDetachedElement, callback);
            instance.observe(liveElement, callback);
            instance.observe(secondDetachedElement, callback);

            instance.observerCallback();

            sinon.assert.calledTwice(callback);
            sinon.assert.calledWithExactly(callback, firstDetachedElement);
            sinon.assert.calledWithExactly(callback, secondDetachedElement);
            assert.deepEqual(
               instance.observedElements,
               new Map([[liveElement, callback]])
            );

            document.body.removeChild(liveElement);
         });
      });
   });
});
