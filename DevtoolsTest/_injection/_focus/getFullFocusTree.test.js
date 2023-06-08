define([
   'DevtoolsTest/mockChrome',
   'injection/_focus/getFullFocusTree',
   'DevtoolsTest/getJSDOM'
], function (mockChrome, getFullFocusTree, getJSDOM) {
   getFullFocusTree = getFullFocusTree.getFullFocusTree;
   let sandbox;
   let elementFinder;
   let removalObserver;
   let removalCallback;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_focus/getFullFocusTree', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
         elementFinder = {
            getElementProps: sandbox.stub()
         };
         removalObserver = {
            observe: sandbox.stub()
         };
         removalCallback = sandbox.stub();
      });

      afterEach(function () {
         sandbox.restore();
      });

      it('should construct the right tree', function () {
         elementFinder.getElementProps.withArgs(document.body).returns({
            tabStop: false,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         const bodyChildren = [];
         function addToBody(tagName, props) {
            const elem = document.createElement(tagName);
            bodyChildren.push(elem);
            document.body.appendChild(elem);
            elementFinder.getElementProps.withArgs(elem).returns(props);
            return elem;
         }

         // unfocusableElement
         addToBody('div', {
            tabStop: false,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         // tabStopThatWouldntGetAdded
         addToBody('div', {
            tabStop: true,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         const vdomFocusIn = addToBody('div', {
            tabStop: true,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: false
         });
         vdomFocusIn.classList.add('vdom-focus-in');
         const vdomFocusOut = addToBody('div', {
            tabStop: true,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: false
         });
         vdomFocusOut.classList.add('vdom-focus-out');
         const tabCycling = addToBody('div', {
            tabStop: false,
            tabCycling: true,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         const focusBlocker = addToBody('div', {
            tabStop: false,
            tabCycling: false,
            tabIndex: -1,
            delegateFocusToChildren: true
         });
         const autofocus = addToBody('input', {
            tabStop: true,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         autofocus.setAttribute('ws-autofocus', 'true');
         const invisible = addToBody('input', {
            tabStop: true,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         invisible.style.display = 'none';
         const hidden = addToBody('input', {
            tabStop: true,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         hidden.style.visibility = 'hidden';
         const brokenLink = addToBody('a', {
            tabStop: true,
            tabCycling: false,
            tabIndex: 0,
            delegateFocusToChildren: true
         });
         const expectedResult = new Map();
         expectedResult.set(tabCycling, {
            id: 1,
            parentId: null,
            focusable: false,
            caption: 'DIV',
            tabindex: 0,
            labels: ['cycle']
         });
         expectedResult.set(focusBlocker, {
            id: 2,
            parentId: null,
            focusable: false,
            caption: 'DIV',
            tabindex: -1,
            labels: ['focusBlocker']
         });
         expectedResult.set(autofocus, {
            id: 3,
            parentId: null,
            focusable: true,
            caption: 'INPUT',
            tabindex: 0,
            labels: ['autofocus']
         });
         expectedResult.set(invisible, {
            id: 4,
            parentId: null,
            focusable: true,
            caption: 'INPUT',
            tabindex: 0,
            labels: ['invisible']
         });
         expectedResult.set(hidden, {
            id: 5,
            parentId: null,
            focusable: true,
            caption: 'INPUT',
            tabindex: 0,
            labels: ['hidden']
         });
         expectedResult.set(brokenLink, {
            id: 6,
            parentId: null,
            focusable: true,
            caption: 'A',
            tabindex: 0,
            labels: ['brokenLink']
         });

         assert.deepEqual(
            getFullFocusTree(elementFinder, removalObserver, removalCallback),
            expectedResult
         );
         Array.from(expectedResult.keys()).forEach((child) => {
            sinon.assert.calledWithExactly(
               removalObserver.observe,
               child,
               removalCallback
            );
         });

         // cleanup
         bodyChildren.forEach((child) => {
            document.body.removeChild(child);
         });
      });
   });
});
