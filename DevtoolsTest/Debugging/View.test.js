define([
   'DevtoolsTest/mockChrome',
   'Debugging/_view/View',
   'Types/entity',
   'Types/collection',
   'Controls/popup'
], function(mockChrome, View, entityLib, collectionLib, popupLib) {
   let sandbox;
   let instance;
   View = View.default;
   const Confirmation = popupLib.Confirmation;
   const RecordSet = collectionLib.RecordSet;
   const Model = entityLib.Model;
   const Record = entityLib.Record;

   describe('Debugging/_view/View', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new View();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_beforeMount', function() {
         it('should select all modules if s3debug=true', async function() {
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .withArgs('contents ? Object.keys(contents.modules) : []')
               .callsArgWith(1, ['Controls', 'UI', 'Core']);
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'get')
               .withArgs({
                  name: 's3debug',
                  url
               })
               .callsArgWith(1, {
                  value: 'true'
               });
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('debuggingPinnedModules')
               .callsArgWith(1, []);

            await instance._beforeMount();

            assert.deepEqual(instance._unselectedSource.data, []);
            assert.deepEqual(instance._selectedSource.data, [
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               },
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            ]);
         });

         it('should select all modules from s3debug', async function() {
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .withArgs('contents ? Object.keys(contents.modules) : []')
               .callsArgWith(1, ['Controls', 'UI', 'Core']);
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'get')
               .withArgs({
                  name: 's3debug',
                  url
               })
               .callsArgWith(1, {
                  value: 'Controls,UI,Core'
               });
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('debuggingPinnedModules')
               .callsArgWith(1, []);

            await instance._beforeMount();

            assert.deepEqual(instance._unselectedSource.data, []);
            assert.deepEqual(instance._selectedSource.data, [
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               },
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            ]);
         });

         it('should not add an empty module to selected keys', async function() {
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .withArgs('contents ? Object.keys(contents.modules) : []')
               .callsArgWith(1, ['Controls', 'UI', 'Core']);
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'get')
               .withArgs({
                  name: 's3debug',
                  url
               })
               .callsArgWith(1, {
                  value: ''
               });
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('debuggingPinnedModules')
               .callsArgWith(1, []);

            await instance._beforeMount();

            assert.deepEqual(instance._unselectedSource.data, [
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               },
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            ]);
            assert.deepEqual(instance._selectedSource.data, []);
         });

         it('should not fail if the cookie is not set', async function() {
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .withArgs('contents ? Object.keys(contents.modules) : []')
               .callsArgWith(1, ['Controls', 'UI', 'Core']);
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'get')
               .withArgs({
                  name: 's3debug',
                  url
               })
               .callsArgWith(1, null);
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('debuggingPinnedModules')
               .callsArgWith(1, []);

            await instance._beforeMount();

            assert.deepEqual(instance._unselectedSource.data, [
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               },
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            ]);
            assert.deepEqual(instance._selectedSource.data, []);
         });

         it('should correctly set isPinned for modules from s3debug', async function() {
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .withArgs('contents ? Object.keys(contents.modules) : []')
               .callsArgWith(1, ['Controls', 'UI', 'Core']);
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'get')
               .withArgs({
                  name: 's3debug',
                  url
               })
               .callsArgWith(1, {
                  value: 'Controls,UI,Core'
               });
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('debuggingPinnedModules')
               .callsArgWith(1, {
                  debuggingPinnedModules: ['UI']
               });

            await instance._beforeMount();

            assert.deepEqual(instance._unselectedSource.data, []);
            assert.deepEqual(instance._selectedSource.data, [
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               },
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: true
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            ]);
         });

         it('should correctly set isPinned if s3debug=true', async function() {
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .withArgs('contents ? Object.keys(contents.modules) : []')
               .callsArgWith(1, ['Controls', 'UI', 'Core']);
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'get')
               .withArgs({
                  name: 's3debug',
                  url
               })
               .callsArgWith(1, {
                  value: 'true'
               });
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('debuggingPinnedModules')
               .callsArgWith(1, {
                  debuggingPinnedModules: ['UI']
               });

            await instance._beforeMount();

            assert.deepEqual(instance._unselectedSource.data, []);
            assert.deepEqual(instance._selectedSource.data, [
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               },
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: true
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            ]);
         });
      });

      describe('moveItems', function() {
         it('should remove the item from the unselected source and add it to the selected source', async function() {
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._unselectedSource = {
               destroy: sandbox.stub()
            };
            instance._selectedSource = {
               update: sandbox.stub()
            };
            instance.pinnedModules = new Set();

            await instance._unselectedActions[0].handler(
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               })
            );

            sinon.assert.calledWithExactly(instance._unselectedSource.destroy, [
               'UI'
            ]);
            assert.deepEqual(
               instance._selectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            );
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should remove the item from the selected source and add it to the unselected source', async function() {
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._unselectedSource = {
               update: sandbox.stub()
            };
            instance._selectedSource = {
               destroy: sandbox.stub()
            };
            instance.pinnedModules = new Set();

            await instance._selectedActions[0].handler(
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               })
            );

            assert.deepEqual(
               instance._unselectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            );
            sinon.assert.calledWithExactly(instance._selectedSource.destroy, [
               'UI'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should remove existing WS.Core modules from the unselected source and add it to the selected source', async function() {
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._unselectedSource = {
               destroy: sandbox.stub()
            };
            instance._selectedSource = {
               update: sandbox.stub()
            };
            instance.existingModules = new Set([
               'WS.Core',
               'WS.Deprecated',
               'Core'
            ]);
            instance.pinnedModules = new Set();

            await instance._unselectedActions[0].handler(
               new Record({
                  rawData: {
                     id: 'WS.Core',
                     title: 'WS.Core',
                     isPinned: false
                  }
               })
            );

            sinon.assert.calledWithExactly(instance._unselectedSource.destroy, [
               'WS.Core',
               'WS.Deprecated',
               'Core'
            ]);
            assert.deepEqual(
               instance._selectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'WS.Core',
                  title: 'WS.Core',
                  isPinned: false
               }
            );
            assert.deepEqual(
               instance._selectedSource.update.secondCall.args[0].getRawData(),
               {
                  id: 'WS.Deprecated',
                  title: 'WS.Deprecated',
                  isPinned: false
               }
            );
            assert.deepEqual(
               instance._selectedSource.update.thirdCall.args[0].getRawData(),
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            );
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should not lose isPinned during the move', async function() {
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._unselectedSource = {
               destroy: sandbox.stub()
            };
            instance._selectedSource = {
               update: sandbox.stub()
            };
            instance.pinnedModules = new Set(['UI']);

            await instance._unselectedActions[0].handler(
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: true
                  }
               })
            );

            sinon.assert.calledWithExactly(instance._unselectedSource.destroy, [
               'UI'
            ]);
            assert.deepEqual(
               instance._selectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: true
               }
            );
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });
      });

      describe('_applyChanges', function() {
         it('should remove s3debug cookie', async function() {
            instance._selectedItems = new RecordSet({
               rawData: []
            });
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            const removeStub = sandbox.stub(chrome.cookies, 'remove');

            await instance._applyChanges();

            assert.isTrue(
               removeStub.calledOnceWithExactly(
                  {
                     name: 's3debug',
                     url
                  },
                  chrome.devtools.inspectedWindow.reload
               )
            );
         });

         it('should set keys as s3debug cookie value', async function() {
            instance._selectedItems = new RecordSet({
               rawData: [
                  {
                     id: 'Controls',
                     title: 'Controls'
                  },
                  {
                     id: 'UI',
                     title: 'UI'
                  }
               ]
            });
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'getAll')
               .withArgs({
                  url
               })
               .callsArgWith(1, [
                  {
                     name: 'testCookie',
                     value: '1234',
                     url
                  }
               ]);
            const setStub = sandbox.stub(chrome.cookies, 'set');

            await instance._applyChanges();

            assert.isTrue(
               setStub.calledOnceWithExactly(
                  {
                     name: 's3debug',
                     url,
                     value: 'Controls,UI'
                  },
                  chrome.devtools.inspectedWindow.reload
               )
            );
         });

         it('should overwrite s3debug cookie value', async function() {
            instance._selectedItems = new RecordSet({
               rawData: [
                  {
                     id: 'Controls',
                     title: 'Controls'
                  },
                  {
                     id: 'UI',
                     title: 'UI'
                  }
               ]
            });
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'getAll')
               .withArgs({
                  url
               })
               .callsArgWith(1, [
                  {
                     name: 's3debug',
                     value: '1'.repeat(4074),
                     url
                  }
               ]);
            const setStub = sandbox.stub(chrome.cookies, 'set');

            await instance._applyChanges();

            assert.isTrue(
               setStub.calledOnceWithExactly(
                  {
                     name: 's3debug',
                     url,
                     value: 'Controls,UI'
                  },
                  chrome.devtools.inspectedWindow.reload
               )
            );
         });

         it("should show popup because cookies don't fit in the available space", async function() {
            instance._selectedItems = new RecordSet({
               rawData: [
                  {
                     id: 'Controls',
                     title: 'Controls'
                  },
                  {
                     id: 'UI',
                     title: 'UI'
                  },
                  {
                     id: 'Core',
                     title: 'Core'
                  }
               ]
            });
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'getAll')
               .withArgs({
                  url
               })
               .callsArgWith(1, [
                  {
                     name: 'testCookie',
                     value: '1'.repeat(4074),
                     url
                  }
               ]);
            sandbox
               .stub(Confirmation, 'openPopup')
               .withArgs({
                  type: 'ok',
                  style: 'danger',
                  details:
                     'The resulting cookie will be too large and very likely will crash the page.' +
                     'Consider selecting fewer modules or removing some cookies to make space.'
               })
               .resolves();

            await instance._applyChanges();
         });

         it("should show popup because there's no available space", async function() {
            instance._selectedItems = new RecordSet({
               rawData: [
                  {
                     id: 'Controls',
                     title: 'Controls'
                  },
                  {
                     id: 'UI',
                     title: 'UI'
                  },
                  {
                     id: 'Core',
                     title: 'Core'
                  }
               ]
            });
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'getAll')
               .withArgs({
                  url
               })
               .callsArgWith(1, [
                  {
                     name: 'testCookie',
                     value: '1'.repeat(4096),
                     url
                  }
               ]);
            sandbox
               .stub(Confirmation, 'openPopup')
               .withArgs({
                  type: 'ok',
                  style: 'danger',
                  details:
                     'The resulting cookie will be too large and very likely will crash the page.\n' +
                     'Consider selecting fewer modules or removing some cookies to make space.'
               })
               .resolves();

            await instance._applyChanges();
         });
      });

      describe('sourceFilter', function() {
         it('should return true because the filter is empty', function() {
            const item = new Model({
               rawData: {
                  title: 'Controls'
               }
            });
            const filter = {};

            assert.isTrue(View.sourceFilter(item, filter));
         });

         it('should return false because the item does not match the filter', function() {
            const item = new Model({
               rawData: {
                  title: 'Controls'
               }
            });
            const filter = {
               title: 'UI'
            };

            assert.isFalse(View.sourceFilter(item, filter));
         });

         it('should return true because the item matches the filter', function() {
            const item = new Model({
               rawData: {
                  title: 'Controls'
               }
            });
            const filter = {
               title: 'Con'
            };

            assert.isTrue(View.sourceFilter(item, filter));
         });
      });

      describe('_selectedItemsReadyCallback', function() {
         it('should save items on instance', async function() {
            const items = new RecordSet({
               rawData: []
            });
            const url = 'https://online.sbis.ru';
            sandbox
               .stub(chrome.devtools.inspectedWindow, 'eval')
               .withArgs('contents ? Object.keys(contents.modules) : []')
               .callsArgWith(1, ['Controls', 'UI', 'Core']);
            sandbox
               .stub(chrome.tabs, 'get')
               .withArgs(chrome.devtools.inspectedWindow.tabId)
               .callsArgWith(1, {
                  url
               });
            sandbox
               .stub(chrome.cookies, 'get')
               .withArgs({
                  name: 's3debug',
                  url
               })
               .callsArgWith(1, {
                  value: 'true'
               });
            sandbox
               .stub(chrome.storage.sync, 'get')
               .withArgs('debuggingPinnedModules')
               .callsArgWith(1, []);
            await instance._beforeMount();

            instance._selectedItemsReadyCallback(items);

            assert.equal(instance._selectedItems, items);
         });
      });

      describe('togglePin', function() {
         it('should pin the item, update it in the source and reload the unselectedList', async function() {
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._unselectedSource = {
               update: sandbox.stub().resolves()
            };
            instance.pinnedModules = new Set();
            sandbox.stub(chrome.storage.sync, 'set');
            const oldItem = new Record({
               rawData: {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            });

            await instance._unselectedActions[1].handler(oldItem);

            assert.notEqual(
               instance._unselectedSource.update.firstCall.args[0],
               oldItem
            );
            assert.deepEqual(
               instance._unselectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: true
               }
            );
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            assert.deepEqual(instance.pinnedModules, new Set(['UI']));
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: ['UI']
            });
         });

         it('should unpin the item, update it in the source and reload the unselectedList', async function() {
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._unselectedSource = {
               update: sandbox.stub().resolves()
            };
            instance.pinnedModules = new Set(['UI']);
            sandbox.stub(chrome.storage.sync, 'set');
            const oldItem = new Record({
               rawData: {
                  id: 'UI',
                  title: 'UI',
                  isPinned: true
               }
            });

            await instance._unselectedActions[2].handler(oldItem);

            assert.notEqual(
               instance._unselectedSource.update.firstCall.args[0],
               oldItem
            );
            assert.deepEqual(
               instance._unselectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            );
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            assert.deepEqual(instance.pinnedModules, new Set());
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: []
            });
         });

         it('should pin the item, update it in the source and reload the selectedList', async function() {
            instance._children = {
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._selectedSource = {
               update: sandbox.stub().resolves()
            };
            instance.pinnedModules = new Set();
            sandbox.stub(chrome.storage.sync, 'set');
            const oldItem = new Record({
               rawData: {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            });

            await instance._selectedActions[1].handler(oldItem);

            assert.notEqual(
               instance._selectedSource.update.firstCall.args[0],
               oldItem
            );
            assert.deepEqual(
               instance._selectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: true
               }
            );
            sinon.assert.calledOnce(instance._children.selectedList.reload);
            assert.deepEqual(instance.pinnedModules, new Set(['UI']));
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: ['UI']
            });
         });

         it('should unpin the item, update it in the source and reload the selectedList', async function() {
            instance._children = {
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._selectedSource = {
               update: sandbox.stub().resolves()
            };
            instance.pinnedModules = new Set(['UI']);
            sandbox.stub(chrome.storage.sync, 'set');
            const oldItem = new Record({
               rawData: {
                  id: 'UI',
                  title: 'UI',
                  isPinned: true
               }
            });

            await instance._selectedActions[2].handler(oldItem);

            assert.notEqual(
               instance._selectedSource.update.firstCall.args[0],
               oldItem
            );
            assert.deepEqual(
               instance._selectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            );
            sinon.assert.calledOnce(instance._children.selectedList.reload);
            assert.deepEqual(instance.pinnedModules, new Set());
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: []
            });
         });
      });

      it('_itemActionVisibilityCallback', function() {
         const pinnedItem = new Record({
            rawData: {
               id: 'UI',
               title: 'UI',
               isPinned: true
            }
         });
         const unpinnedItem = new Record({
            rawData: {
               id: 'UI',
               title: 'UI',
               isPinned: false
            }
         });

         assert.isFalse(
            instance._itemActionVisibilityCallback(
               {
                  id: 'pin'
               },
               pinnedItem
            )
         );
         assert.isTrue(
            instance._itemActionVisibilityCallback(
               {
                  id: 'pin'
               },
               unpinnedItem
            )
         );
         assert.isTrue(
            instance._itemActionVisibilityCallback(
               {
                  id: 'unpin'
               },
               pinnedItem
            )
         );
         assert.isFalse(
            instance._itemActionVisibilityCallback(
               {
                  id: 'unpin'
               },
               unpinnedItem
            )
         );
         assert.isTrue(
            instance._itemActionVisibilityCallback(
               {
                  id: 'moveRight'
               },
               unpinnedItem
            )
         );
         assert.isTrue(
            instance._itemActionVisibilityCallback(
               {
                  id: 'moveRight'
               },
               pinnedItem
            )
         );
         assert.isTrue(
            instance._itemActionVisibilityCallback(
               {
                  id: 'moveLeft'
               },
               unpinnedItem
            )
         );
         assert.isTrue(
            instance._itemActionVisibilityCallback(
               {
                  id: 'moveLeft'
               },
               pinnedItem
            )
         );
      });
   });
});
