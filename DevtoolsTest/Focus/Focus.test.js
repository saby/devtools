define(['DevtoolsTest/mockChrome', 'Focus/_Focus/Focus'], function (
   mockChrome,
   Focus
) {
   Focus = Focus.default;
   let sandbox;
   let instance;

   describe('Focus/_Focus/Focus', function () {
      beforeEach(function () {
         sandbox = sinon.createSandbox();
         instance = new Focus();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('_beforeMount', function () {
         it('should set _detailsWidth to default value because the storage is empty', async function () {
            const instance = new Focus();
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('focusDetailsWidth')
               .callsArgWith(1, {});

            await instance._beforeMount();

            assert.equal(instance._detailsWidth, 300);
         });

         it('should set _detailsWidth to value from the storage', async function () {
            const instance = new Focus();
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('focusDetailsWidth')
               .callsArgWith(1, {
                  focusDetailsWidth: 123
               });

            await instance._beforeMount();

            assert.equal(instance._detailsWidth, 123);
         });
      });

      describe('_afterMount', function () {
         it('should add event listeners and notify the backend about tab initialization', function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'addListener');
            sandbox.stub(instance.channel, 'dispatch');

            instance._afterMount();

            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'fullItems',
               instance.preprocessItems
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'addItemToHistory',
               instance.addItemToHistory
            );
            sinon.assert.calledWithExactly(
               instance.channel.addListener,
               'changeFocusedItem',
               instance.changeFocusedItem
            );
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'focusInitialized'
            );
         });
      });

      describe('_beforeUpdate', function () {
         it("should not dispatch any events if the 'selected' option wasn't changed", function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');
            const oldOptions = {
               selected: true
            };
            instance.saveOptions(oldOptions);
            const newOptions = {
               selected: true
            };

            instance._beforeUpdate(newOptions);

            sinon.assert.notCalled(instance.channel.dispatch);
         });

         it("should dispatch 'tabClosed' event if another tab was selected", function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');
            const oldOptions = {
               selected: true
            };
            instance.saveOptions(oldOptions);
            const newOptions = {
               selected: false
            };

            instance._beforeUpdate(newOptions);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'tabClosed'
            );
         });

         it("should dispatch 'focusInitialized' event if the focus tab was selected", function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');
            const oldOptions = {
               selected: false
            };
            instance.saveOptions(oldOptions);
            const newOptions = {
               selected: true
            };

            instance._beforeUpdate(newOptions);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'focusInitialized'
            );
         });
      });

      describe('_beforeUnmount', function () {
         it('should destroy the channel', function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'destructor');

            instance._beforeUnmount();

            sinon.assert.calledOnce(instance.channel.destructor);
         });
      });

      describe('_offsetHandler', function () {
         it('should change _offsetWidth on instance and save it', function () {
            const instance = new Focus();
            instance._detailsWidth = 50;
            sandbox.stub(chrome.storage.sync, 'set');

            instance._offsetHandler({}, 150);

            assert.equal(instance._detailsWidth, 200);
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               focusDetailsWidth: 200
            });
         });
      });

      describe('_highlightElement', function () {
         it("should dispatch 'highlightElement' event without arguments to disable highlighting", function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');

            instance._highlightElement({});

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'highlightElement'
            );
         });

         it("should dispatch 'highlightElement' event with the passed id and isHistory: false", function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');

            instance._highlightElement({}, false, 1);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'highlightElement',
               {
                  id: 1,
                  isHistory: false
               }
            );
         });

         it("should dispatch 'highlightElement' event with the passed id and isHistory: true", function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');

            instance._highlightElement({}, true, 1);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'highlightElement',
               {
                  id: 1,
                  isHistory: true
               }
            );
         });
      });

      describe('_onItemClick', function () {
         it('should ask the backend for container and inspect it after 100ms, isHistory: false', function () {
            const instance = new Focus();
            const clock = sinon.useFakeTimers();
            sandbox.stub(instance.channel, 'dispatch');
            sandbox.stub(chrome.devtools.inspectedWindow, 'eval');

            instance._onItemClick({}, false, 1);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'viewContainer',
               {
                  id: 1,
                  isHistory: false
               }
            );
            sinon.assert.notCalled(chrome.devtools.inspectedWindow.eval);

            // assert that eval is called after exactly 100ms
            clock.tick(99);
            sinon.assert.notCalled(chrome.devtools.inspectedWindow.eval);
            clock.tick(1);
            sinon.assert.calledWithExactly(
               chrome.devtools.inspectedWindow.eval,
               'inspect(window.__WASABY_DEV_HOOK__.__container)'
            );

            clock.restore();
         });

         it('should ask the backend for container and inspect it after 100ms, isHistory: true', function () {
            const instance = new Focus();
            const clock = sinon.useFakeTimers();
            sandbox.stub(instance.channel, 'dispatch');
            sandbox.stub(chrome.devtools.inspectedWindow, 'eval');

            instance._onItemClick({}, true, 1);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'viewContainer',
               {
                  id: 1,
                  isHistory: true
               }
            );
            sinon.assert.notCalled(chrome.devtools.inspectedWindow.eval);

            // assert that eval is called after exactly 100ms
            clock.tick(99);
            sinon.assert.notCalled(chrome.devtools.inspectedWindow.eval);
            clock.tick(1);
            sinon.assert.calledWithExactly(
               chrome.devtools.inspectedWindow.eval,
               'inspect(window.__WASABY_DEV_HOOK__.__container)'
            );

            clock.restore();
         });
      });

      describe('_getColorClassForItem', function () {
         it('should return nonFocusable class for an item with focusable: false and without labels', function () {
            const instance = new Focus();
            const item = {
               labels: [],
               focusable: false
            };

            assert.equal(
               instance._getColorClassForItem(item),
               'devtools-Focus__item_nonFocusable'
            );
         });

         it('should return nonFocusable class for an item with focusable: false and without bad labels', function () {
            const instance = new Focus();
            const item = {
               labels: ['cycle', 'autofocus', 'focusBlocker'],
               focusable: false
            };

            assert.equal(
               instance._getColorClassForItem(item),
               'devtools-Focus__item_nonFocusable'
            );
         });

         it('should return focusable class for an item with focusable: true and without labels', function () {
            const instance = new Focus();
            const item = {
               labels: [],
               focusable: true
            };

            assert.equal(
               instance._getColorClassForItem(item),
               'devtools-Focus__item_focusable'
            );
         });

         it('should return focusable class for an item with focusable: true and without bad labels', function () {
            const instance = new Focus();
            const item = {
               labels: ['cycle', 'autofocus', 'focusBlocker'],
               focusable: true
            };

            assert.equal(
               instance._getColorClassForItem(item),
               'devtools-Focus__item_focusable'
            );
         });

         function runTest(focusable, label) {
            it(`should return withDangerousLabel class for an item with focusable: ${focusable} and with label ${label}`, function () {
               const instance = new Focus();
               const item = {
                  labels: [label],
                  focusable
               };

               assert.equal(
                  instance._getColorClassForItem(item),
                  'devtools-Focus__item_withDangerousLabel'
               );
            });
         }
         ['invisible', 'hidden', 'brokenLink'].forEach((badLabel) => {
            runTest(false, badLabel);
            runTest(true, badLabel);
         });
      });

      describe('_getBackgroundClassForFocusedItem', function () {
         it('should return selfFocused class for an item with type: self', function () {
            const instance = new Focus();
            const item = {
               type: 'self'
            };

            assert.equal(
               instance._getBackgroundClassForFocusedItem(item),
               'devtools-Focus__item_selfFocused'
            );
         });

         it('should return selfFocused class for an item with type: child', function () {
            const instance = new Focus();
            const item = {
               type: 'child'
            };

            assert.equal(
               instance._getBackgroundClassForFocusedItem(item),
               'devtools-Focus__item_childFocused'
            );
         });
      });

      describe('_moveFocus', function () {
         it('should ask the backend to move focus backwards', function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');

            instance._moveFocus({}, true);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'moveFocus',
               true
            );
         });

         it('should ask the backend to move focus forwards', function () {
            const instance = new Focus();
            sandbox.stub(instance.channel, 'dispatch');

            instance._moveFocus({}, false);

            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'moveFocus',
               false
            );
         });
      });

      describe('_clearHistory', function () {
         it('should clear historyItems and ask the backend to clear its history', function () {
            const instance = new Focus();
            instance._historyItems = [1, 2, 3];
            sandbox.stub(instance.channel, 'dispatch');

            instance._clearHistory();

            assert.isEmpty(instance._historyItems);
            sinon.assert.calledWithExactly(
               instance.channel.dispatch,
               'clearHistory'
            );
         });
      });

      describe('addItemToHistory', function () {
         it('should add items at the beginning of the _historyItems', function () {
            const instance = new Focus();
            const firstItem = {
               id: 1
            };
            const secondItem = {
               id: 2
            };
            assert.isEmpty(instance._historyItems);

            instance.addItemToHistory(firstItem);

            assert.deepEqual(instance._historyItems, [firstItem]);

            instance.addItemToHistory(secondItem);

            assert.deepEqual(instance._historyItems, [secondItem, firstItem]);
         });
      });

      describe('changeFocusedItem', function () {
         it('should save focusedItem on instance', function () {
            const instance = new Focus();
            const focusedItem = {
               id: 1
            };
            assert.isUndefined(instance._focusedItem);

            instance.changeFocusedItem(focusedItem);

            assert.equal(instance._focusedItem, focusedItem);

            instance.changeFocusedItem();

            assert.isUndefined(instance._focusedItem);
         });
      });

      describe('preprocessItems', function () {
         function getItem(id, parentId, tabindex) {
            return {
               id,
               parentId,
               tabindex
            };
         }

         function getItemWithDepth(rawItems, id, depth) {
            const sourceItem = rawItems.find((item) => item.id === id);
            return {
               ...sourceItem,
               depth
            };
         }

         it('should correctly sort items by depth and tabindex and save the result in _items field', function () {
            const instance = new Focus();
            const rawItems = [
               getItem(0, null, 0),
               getItem(8, null, 0),
               getItem(1, 0, 2),
               getItem(6, 0, 1),
               getItem(2, 1, -2),
               getItem(3, 1, -1),
               getItem(4, 1, 0),
               getItem(5, 1, -3),
               getItem(7, 6, 0)
            ];

            instance.preprocessItems(rawItems);

            /*
            0
               6
                  7
               1
                  2
                  3
                  4
                  5
            8
             */
            assert.deepEqual(instance._items, [
               getItemWithDepth(rawItems, 0, 0),
               getItemWithDepth(rawItems, 6, 1),
               getItemWithDepth(rawItems, 7, 2),
               getItemWithDepth(rawItems, 1, 1),
               getItemWithDepth(rawItems, 2, 2),
               getItemWithDepth(rawItems, 3, 2),
               getItemWithDepth(rawItems, 4, 2),
               getItemWithDepth(rawItems, 5, 2),
               getItemWithDepth(rawItems, 8, 0)
            ]);
         });
      });
   });
});
