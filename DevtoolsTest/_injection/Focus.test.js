define([
   'DevtoolsTest/mockChrome',
   'injection/Focus',
   'injection/_focus/getFullFocusTree',
   'injection/_focus/getId',
   'injection/_devtool/globalChannel',
   'DevtoolsTest/getJSDOM'
], function (
   mockChrome,
   Focus,
   getFullFocusTree,
   getId,
   globalChannel,
   getJSDOM
) {
   let sandbox;
   Focus = Focus.Focus;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/Focus', function () {
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
      });

      afterEach(function () {
         sandbox.restore();
      });

      let instance;
      beforeEach(function () {
         sandbox.stub(globalChannel, 'getGlobalChannel').returns({
            addListener: sandbox.stub()
         });
         instance = new Focus({
            channel: {
               addListener: sandbox.stub(),
               dispatch: sandbox.stub()
            }
         });
      });

      afterEach(function () {
         instance.mutationObserver.disconnect();
      });

      function stubWasabyDevHook() {
         if (!window.__WASABY_DEV_HOOK__) {
            window.__WASABY_DEV_HOOK__ = {};
         }
      }

      describe('constructor', function () {
         it('adds correct listeners', function () {
            sinon.assert.calledWithExactly(
               globalChannel.getGlobalChannel().addListener,
               'devtoolsClosed',
               instance.onTabClosed
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'tabClosed',
               instance.onTabClosed
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'clearHistory',
               instance.clearHistory
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'focusInitialized',
               instance.initializePlugin
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'highlightElement',
               instance.highlightElementByConfig
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'viewContainer',
               instance.saveContainer
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'moveFocus',
               instance.moveFocus
            );
         });
      });

      describe('initializePlugin', function () {
         it('should start observing, initialize the tree and change focused item', async function () {
            sandbox.stub(instance, 'initializeTree');
            sandbox.stub(instance, 'changeFocusedItem');
            sandbox.stub(instance.mutationObserver, 'observe');

            await instance.initializePlugin();

            sinon.assert.calledWithExactly(
               instance.mutationObserver.observe,
               document.documentElement,
               {
                  childList: true,
                  subtree: true
               }
            );
            sinon.assert.calledWithExactly(instance.initializeTree);
            sinon.assert.calledWithExactly(
               instance.changeFocusedItem,
               document.activeElement
            );
         });
      });

      describe('initializeTree', function () {
         it('should construct the new tree without adding focus listener', async function () {
            instance.pluginInitialized = true;
            sandbox.stub(instance.historyItems, 'clear');
            sandbox.stub(instance, 'constructTree');
            sandbox.stub(document.body, 'addEventListener');

            await instance.initializeTree();

            sinon.assert.calledOnce(instance.historyItems.clear);
            sinon.assert.calledOnce(instance.constructTree);
            assert.isTrue(
               instance.constructTree.calledAfter(instance.historyItems.clear)
            );
            sinon.assert.notCalled(document.body.addEventListener);
            assert.isTrue(instance.pluginInitialized);
         });

         it('should construct the new tree and add focus listener', async function () {
            instance.pluginInitialized = false;
            sandbox.stub(instance.historyItems, 'clear');
            sandbox.stub(instance, 'constructTree');
            sandbox.stub(document.body, 'addEventListener');

            await instance.initializeTree();

            sinon.assert.calledOnce(instance.historyItems.clear);
            sinon.assert.calledOnce(instance.constructTree);
            assert.isTrue(
               instance.constructTree.calledAfter(instance.historyItems.clear)
            );
            sinon.assert.calledOnce(document.body.addEventListener);
            sinon.assert.calledWithExactly(
               document.body.addEventListener,
               'focus',
               instance.focusHandler,
               true
            );
            assert.isTrue(
               document.body.addEventListener.calledAfter(
                  instance.constructTree
               )
            );
            assert.isTrue(instance.pluginInitialized);
         });
      });

      describe('constructTree', function () {
         it('should construct the tree and send it to the frontend', async function () {
            const elementFinder = {};
            sandbox
               .stub(instance.focusLibLoader, 'getElementFinder')
               .resolves(elementFinder);
            sandbox.stub(instance.removalObserver, 'clearObservedElements');
            const items = new Map([
               [
                  document.createElement('div'),
                  {
                     id: 0
                  }
               ],
               [
                  document.createElement('span'),
                  {
                     id: 1
                  }
               ]
            ]);
            sandbox.stub(getFullFocusTree, 'getFullFocusTree').returns(items);

            await instance.constructTree();

            sinon.assert.calledOnce(
               instance.removalObserver.clearObservedElements
            );
            assert.strictEqual(instance.elementFinder, elementFinder);
            assert.strictEqual(instance.items, items);
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'fullItems',
               Array.from(items.values())
            );
         });
      });

      describe('highlightElementByConfig', function () {
         it('should disable the highlighting', function () {
            sandbox.stub(instance.highlighter, 'highlightElement');

            instance.highlightElementByConfig();

            sinon.assert.calledWithExactly(
               instance.highlighter.highlightElement
            );
         });

         it('should find a regular item and highlight it', function () {
            sandbox.stub(instance.highlighter, 'highlightElement');
            const itemContainer = document.createElement('div');
            const item = {
               id: 0,
               caption: 'test'
            };
            sandbox
               .stub(instance, 'getHistoryItemById')
               .throws('This test should not use this getter.');
            sandbox
               .stub(instance, 'getItemById')
               .withArgs(0)
               .returns([itemContainer, item]);

            instance.highlightElementByConfig({
               id: 0,
               isHistory: false
            });

            sinon.assert.calledWithExactly(
               instance.highlighter.highlightElement,
               [itemContainer],
               'test'
            );
         });

         it('should find a history item and highlight it', function () {
            sandbox.stub(instance.highlighter, 'highlightElement');
            const itemContainer = document.createElement('div');
            const item = {
               id: 0,
               caption: 'test'
            };
            sandbox
               .stub(instance, 'getHistoryItemById')
               .withArgs(0)
               .returns([itemContainer, item]);
            sandbox
               .stub(instance, 'getItemById')
               .throws('This test should not use this getter.');

            instance.highlightElementByConfig({
               id: 0,
               isHistory: true
            });

            sinon.assert.calledWithExactly(
               instance.highlighter.highlightElement,
               [itemContainer],
               'test'
            );
         });

         it('should not highlight anything if a regular item is not found', function () {
            sandbox.stub(instance.highlighter, 'highlightElement');
            sandbox
               .stub(instance, 'getHistoryItemById')
               .throws('This test should not use this getter.');
            sandbox.stub(instance, 'getItemById');

            instance.highlightElementByConfig({
               id: 0,
               isHistory: false
            });

            sinon.assert.calledWithExactly(instance.getItemById, 0);
            sinon.assert.notCalled(instance.highlighter.highlightElement);
         });

         it('should not highlight anything if a history item is not found', function () {
            sandbox.stub(instance.highlighter, 'highlightElement');
            sandbox.stub(instance, 'getHistoryItemById');
            sandbox
               .stub(instance, 'getItemById')
               .throws('This test should not use this getter.');

            instance.highlightElementByConfig({
               id: 0,
               isHistory: true
            });

            sinon.assert.calledWithExactly(instance.getHistoryItemById, 0);
            sinon.assert.notCalled(instance.highlighter.highlightElement);
         });
      });

      describe('saveContainer', function () {
         it('should find a regular item and save it', function () {
            stubWasabyDevHook();
            const itemContainer = document.createElement('div');
            const item = {
               id: 0,
               caption: 'test'
            };
            sandbox
               .stub(instance, 'getHistoryItemById')
               .throws('This test should not use this getter.');
            sandbox
               .stub(instance, 'getItemById')
               .withArgs(0)
               .returns([itemContainer, item]);

            instance.saveContainer({
               id: 0,
               isHistory: false
            });

            assert.equal(window.__WASABY_DEV_HOOK__.__container, itemContainer);

            delete window.__WASABY_DEV_HOOK__;
         });

         it('should find a history item and save it', function () {
            stubWasabyDevHook();
            const itemContainer = document.createElement('div');
            const item = {
               id: 0,
               caption: 'test'
            };
            sandbox
               .stub(instance, 'getHistoryItemById')
               .withArgs(0)
               .returns([itemContainer, item]);
            sandbox
               .stub(instance, 'getItemById')
               .throws('This test should not use this getter.');

            instance.saveContainer({
               id: 0,
               isHistory: true
            });

            assert.equal(window.__WASABY_DEV_HOOK__.__container, itemContainer);

            delete window.__WASABY_DEV_HOOK__;
         });

         it('should reset the window.__WASABY_DEV_HOOK__.__container if a regular item is not found', function () {
            stubWasabyDevHook();
            sandbox
               .stub(instance, 'getHistoryItemById')
               .throws('This test should not use this getter.');
            sandbox.stub(instance, 'getItemById');
            window.__WASABY_DEV_HOOK__.__container = document.createElement(
               'div'
            );

            instance.saveContainer({
               id: 0,
               isHistory: false
            });

            assert.isUndefined(window.__WASABY_DEV_HOOK__.__container);

            delete window.__WASABY_DEV_HOOK__;
         });

         it('should reset the window.__WASABY_DEV_HOOK__.__container if a history item is not found', function () {
            stubWasabyDevHook();
            sandbox.stub(instance, 'getHistoryItemById');
            sandbox
               .stub(instance, 'getItemById')
               .throws('This test should not use this getter.');
            window.__WASABY_DEV_HOOK__.__container = document.createElement(
               'div'
            );

            instance.saveContainer({
               id: 0,
               isHistory: true
            });

            assert.isUndefined(window.__WASABY_DEV_HOOK__.__container);

            delete window.__WASABY_DEV_HOOK__;
         });
      });

      describe('getItemById', function () {
         it('should find the correct item', function () {
            const firstEntry = [
               document.createElement('div'),
               {
                  id: 0
               }
            ];
            const secondEntry = [
               document.createElement('div'),
               {
                  id: 1
               }
            ];
            instance.items = new Map([firstEntry, secondEntry]);

            assert.deepEqual(secondEntry, instance.getItemById(1));
         });
      });

      describe('getItemById', function () {
         it('should find the correct item', function () {
            const firstEntry = [
               document.createElement('div'),
               {
                  ids: [0]
               }
            ];
            const secondEntry = [
               document.createElement('div'),
               {
                  ids: [1, 2]
               }
            ];
            instance.historyItems = new Map([firstEntry, secondEntry]);

            assert.deepEqual(secondEntry, instance.getHistoryItemById(2));
         });
      });

      describe('mutationObserverCallback', function () {
         it('should call throttledConstructTree', function () {
            sandbox.stub(instance, 'throttledConstructTree');

            instance.mutationObserverCallback();

            sinon.assert.calledOnce(instance.throttledConstructTree);
         });
      });

      describe('removalCallback', function () {
         it('should delete the element from historyItems and items', function () {
            sandbox.stub(instance.items, 'delete');
            sandbox.stub(instance.historyItems, 'delete');
            const elem = document.createElement('elem');

            instance.removalCallback(elem);

            sinon.assert.calledOnce(instance.items.delete);
            sinon.assert.calledWithExactly(instance.items.delete, elem);
            sinon.assert.calledOnce(instance.historyItems.delete);
            sinon.assert.calledWithExactly(instance.historyItems.delete, elem);
         });
      });

      describe('focusHandler', function () {
         it('should add item to history and change focused item', function () {
            sandbox.stub(instance, 'addItemToHistory');
            sandbox.stub(instance, 'changeFocusedItem');
            const target = document.createElement('elem');

            instance.focusHandler({
               target
            });

            sinon.assert.calledWithExactly(instance.addItemToHistory, target);
            sinon.assert.calledWithExactly(instance.changeFocusedItem, target);
         });
      });

      describe('moveFocus', function () {
         it('should move focus forwards', async function () {
            sandbox.stub(instance, 'addItemToHistory');
            sandbox.stub(instance, 'changeFocusedItem');
            const nextElem = document.createElement('div');
            instance.elementFinder = {
               findWithContexts: sandbox
                  .stub()
                  .withArgs(document.body, document.body, false)
                  .returns(nextElem)
            };
            const focusFromLib = sandbox.stub().returns(true);
            sandbox
               .stub(instance.focusLibLoader, 'getFocusFromLib')
               .resolves(focusFromLib);
            document.body.focus();

            await instance.moveFocus(false);

            sinon.assert.calledWithExactly(focusFromLib, nextElem);
            sinon.assert.calledWithExactly(instance.addItemToHistory, nextElem);
            sinon.assert.calledWithExactly(
               instance.changeFocusedItem,
               nextElem
            );
         });

         it('should move focus backwards', async function () {
            sandbox.stub(instance, 'addItemToHistory');
            sandbox.stub(instance, 'changeFocusedItem');
            const nextElem = document.createElement('div');
            instance.elementFinder = {
               findWithContexts: sandbox
                  .stub()
                  .withArgs(document.body, document.body, true)
                  .returns(nextElem)
            };
            const focusFromLib = sandbox.stub().returns(true);
            sandbox
               .stub(instance.focusLibLoader, 'getFocusFromLib')
               .resolves(focusFromLib);
            document.body.focus();

            await instance.moveFocus(true);

            sinon.assert.calledWithExactly(focusFromLib, nextElem);
            sinon.assert.calledWithExactly(instance.addItemToHistory, nextElem);
            sinon.assert.calledWithExactly(
               instance.changeFocusedItem,
               nextElem
            );
         });

         it("shouldn't move focus because there's no next element", async function () {
            sandbox.stub(instance, 'addItemToHistory');
            sandbox.stub(instance, 'changeFocusedItem');
            instance.elementFinder = {
               findWithContexts: sandbox
                  .stub()
                  .withArgs(document.body, document.body, false)
            };
            sandbox.stub(instance.focusLibLoader, 'getFocusFromLib');
            document.body.focus();

            await instance.moveFocus(false);

            sinon.assert.notCalled(instance.focusLibLoader.getFocusFromLib);
            sinon.assert.notCalled(instance.addItemToHistory);
            sinon.assert.notCalled(instance.changeFocusedItem);
         });

         it("shouldn't move focus because the next element is not focusable", async function () {
            sandbox.stub(instance, 'addItemToHistory');
            sandbox.stub(instance, 'changeFocusedItem');
            const nextElem = document.createElement('div');
            instance.elementFinder = {
               findWithContexts: sandbox
                  .stub()
                  .withArgs(document.body, document.body, false)
                  .returns(nextElem)
            };
            const focusFromLib = sandbox.stub().returns(false);
            sandbox
               .stub(instance.focusLibLoader, 'getFocusFromLib')
               .resolves(focusFromLib);
            document.body.focus();

            await instance.moveFocus(false);

            sinon.assert.calledWithExactly(focusFromLib, nextElem);
            sinon.assert.notCalled(instance.addItemToHistory);
            sinon.assert.notCalled(instance.changeFocusedItem);
         });
      });

      describe('addItemToHistory', function () {
         it('should add a new id to the existing element and notify the frontend', function () {
            const target = document.createElement('div');
            const existingItem = {
               ids: [0, 1],
               caption: 'div'
            };
            sandbox.stub(getId, 'default').returns(2);
            instance.historyItems.set(target, existingItem);

            instance.addItemToHistory(target);

            assert.deepEqual(instance.historyItems.get(target), {
               ids: [0, 1, 2],
               caption: 'div'
            });
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'addItemToHistory',
               {
                  ids: [0, 1, 2],
                  caption: 'div'
               }
            );
         });

         it('should create a new element and notify the frontend', function () {
            const target = document.createElement('div');
            target.classList.add('testClass');
            sandbox.stub(getId, 'default').returns(123);

            instance.addItemToHistory(target);

            assert.deepEqual(instance.historyItems.get(target), {
               ids: [123],
               caption: 'testClass'
            });
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'addItemToHistory',
               {
                  ids: [123],
                  caption: 'testClass'
               }
            );
         });
      });

      describe('changeFocusedItem', function () {
         it('should notify the frontend about self focus', function () {
            const target = document.createElement('div');
            const item = {
               id: 0
            };
            instance.items.set(target, item);

            instance.changeFocusedItem(target);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'changeFocusedItem',
               {
                  id: 0,
                  type: 'self'
               }
            );
         });

         it('should notify the frontend about child focus', function () {
            const target = document.createElement('div');
            const parent = document.createElement('div');
            parent.append(target);
            const topParent = document.createElement('div');
            const topParentItem = {
               id: 0
            };
            topParent.append(parent);
            instance.items.set(topParent, topParentItem);

            instance.changeFocusedItem(target);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'changeFocusedItem',
               {
                  id: 0,
                  type: 'child'
               }
            );
         });

         it('should notify the frontend about focus loss', function () {
            const target = document.createElement('div');

            instance.changeFocusedItem(target);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'changeFocusedItem'
            );
         });
      });

      describe('onTabClosed', function () {
         it('should perform the cleanup', function () {
            sandbox.stub(instance.mutationObserver, 'disconnect');
            instance.pluginInitialized = true;
            sandbox.stub(instance, 'clearHistory');
            sandbox.stub(document.body, 'removeEventListener');

            instance.onTabClosed();

            sinon.assert.calledOnce(instance.mutationObserver.disconnect);
            assert.isFalse(instance.pluginInitialized);
            sinon.assert.calledOnce(instance.clearHistory);
            sinon.assert.calledOnce(document.body.removeEventListener);
            sinon.assert.calledWithExactly(
               document.body.removeEventListener,
               'focus',
               instance.focusHandler,
               true
            );
         });
      });

      describe('clearHistory', function () {
         it('should clear the history', function () {
            sandbox.stub(instance.historyItems, 'clear');

            instance.clearHistory();

            sinon.assert.calledOnce(instance.historyItems.clear);
         });
      });

      it('getName', function () {
         assert.equal(Focus.getName(), 'Focus');
      });

      describe('constructTreeIfAlive', function () {
         it('should neither construct a tree nor change focused item if the plugin is not initialized', async function () {
            instance.pluginInitialized = false;
            sandbox.stub(instance, 'constructTree');
            sandbox.stub(instance, 'changeFocusedItem');

            await instance.constructTreeIfAlive();

            sinon.assert.notCalled(instance.constructTree);
            sinon.assert.notCalled(instance.changeFocusedItem);
         });

         it('should construct a tree and change focused item', async function () {
            instance.pluginInitialized = true;
            sandbox.stub(instance, 'constructTree');
            sandbox.stub(instance, 'changeFocusedItem');
            document.body.focus();

            await instance.constructTreeIfAlive();

            sinon.assert.calledOnce(instance.constructTree);
            sinon.assert.calledWithExactly(
               instance.changeFocusedItem,
               document.body
            );
         });
      });
   });
});
