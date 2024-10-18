define([
   'DevtoolsTest/mockChrome',
   'Debugging/_view/View',
   'Types/entity',
   'Types/source',
   'Controls/popup'
], function (mockChrome, View, entityLib, sourceLib, popupLib) {
   let sandbox;
   let instance;
   View = View.default;
   const Confirmation = popupLib.Confirmation;
   const Model = entityLib.Model;
   const Record = entityLib.Record;
   const Memory = sourceLib.Memory;

   describe('Debugging/_view/View', function () {
      function stubTabURL(url) {
         sandbox
            .stub(chrome.tabs, 'get')
            .withArgs(chrome.devtools.inspectedWindow.tabId)
            .callsArgWith(1, {
               url
            });
      }

      function stubContentsModules(modules) {
         sandbox
            .stub(chrome.devtools.inspectedWindow, 'eval')
            .withArgs('contents ? Object.keys(contents.modules) : []')
            .callsArgWith(1, modules);
      }

      function stubCookieValue(value, url) {
         sandbox
            .stub(chrome.cookies, 'get')
            .withArgs({
               name: 's3debug',
               url
            })
            .callsArgWith(
               1,
               value
                  ? {
                       value
                    }
                  : value
            );
      }

      function stubCookiesGetAll(cookies, url) {
         sandbox
            .stub(chrome.cookies, 'getAll')
            .withArgs({
               url
            })
            .callsArgWith(1, cookies);
      }

      function stubStorage(values) {
         const stub = sandbox
            .stub(chrome.storage.sync, 'get');
         const defaultValue = {
            debuggingPinnedModules: [],
            debuggingSavedSets: []
         };
         Object.entries(defaultValue).forEach(([key, value]) => {
            stub.withArgs(key).callsArgWith(1, {
               [key]: values[key] ? values[key] : value
            })
         });
      }

      function stubModulesAndLists(
         inst,
         unselectedModules,
         selectedModules,
         pinnedModules
      ) {
         inst.pinnedModules = new Set(pinnedModules);
         inst.unselectedModules = unselectedModules.slice();
         inst.selectedModules = selectedModules.slice();
         inst._unselectedSource = new Memory({
            data: unselectedModules.slice(),
            keyProperty: 'id'
         });
         inst._selectedSource = new Memory({
            data: selectedModules.slice(),
            keyProperty: 'id'
         });
         sandbox.stub(inst._unselectedSource, 'update');
         sandbox.stub(inst._unselectedSource, 'destroy');
         sandbox.stub(inst._selectedSource, 'update');
         sandbox.stub(inst._selectedSource, 'destroy');
         inst._children = {
            unselectedList: {
               reload: sandbox.stub()
            },
            selectedList: {
               reload: sandbox.stub()
            }
         };
      }

      beforeEach(function () {
         sandbox = sinon.createSandbox();
         instance = new View();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('_beforeMount', function () {
         it('should select all modules if s3debug=true', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue('true', url);
            stubStorage({});

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

         it('should select all modules from s3debug', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue('Controls,UI,Core', url);
            stubStorage({});

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

         it('should not add an empty module to selected keys', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue('', url);
            stubStorage({});

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

         it('should not fail if the cookie is not set', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue(null, url);
            stubStorage({});

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

         it('should correctly set isPinned for modules from s3debug', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue('Controls,UI,Core', url);
            stubStorage({
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

         it('should correctly set isPinned if s3debug=true', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue('true', url);
            stubStorage({
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

         it('should add listener for cookies.onChanged', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue('true', url);
            stubStorage({});
            const boundCallback = sandbox.stub();
            sandbox
               .stub(instance.onCookieChange, 'bind')
               .withArgs(instance)
               .returns(boundCallback);
            sandbox.stub(chrome.cookies.onChanged, 'addListener');

            await instance._beforeMount();

            sinon.assert.calledWithExactly(
               chrome.cookies.onChanged.addListener,
               boundCallback
            );
         });

         it('should not add nonexistent pinned module to any source', async function () {
            const url = 'https://online.sbis.ru';
            stubContentsModules(['Controls', 'UI', 'Core']);
            stubTabURL(url);
            stubCookieValue('Controls,UI,Core', url);
            stubStorage({
               debuggingPinnedModules: ['UI', 'ThisModuleDoesntExist']
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

      describe('_changeCookie', function () {
         it('should add a new module to the cookie', async function () {
            const url = 'https://online.sbis.ru';
            stubTabURL(url);
            stubCookieValue(null, url);
            stubCookiesGetAll([], url);
            stubModulesAndLists(
               instance,
               [
                  {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               ],
               [],
               []
            );
            sandbox.stub(chrome.cookies, 'set').callsArgWith(1, {
               value: 'UI'
            });

            await instance._changeCookie(
               {},
               'add',
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               })
            );

            sinon.assert.calledWith(chrome.cookies.set, {
               name: 's3debug',
               value: 'UI',
               url
            });
            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, []);
            assert.deepEqual(instance.selectedModules, [
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            ]);
            assert.deepEqual(
               instance._selectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            );
            sinon.assert.calledWithExactly(instance._unselectedSource.destroy, [
               'UI'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should remove a module from the cookie', async function () {
            const url = 'https://online.sbis.ru';
            stubTabURL(url);
            stubCookieValue('UI,Controls', url);
            stubCookiesGetAll(
               [
                  {
                     name: 's3debug',
                     value: 'UI,Controls',
                     url
                  }
               ],
               url
            );
            stubModulesAndLists(
               instance,
               [],
               [
                  {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  },
                  {
                     id: 'Controls',
                     title: 'Controls',
                     isPinned: false
                  }
               ],
               []
            );
            sandbox.stub(chrome.cookies, 'set').callsArgWith(1, {
               value: 'Controls'
            });

            await instance._changeCookie(
               {},
               'delete',
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               })
            );

            sinon.assert.calledWith(chrome.cookies.set, {
               name: 's3debug',
               value: 'Controls',
               url
            });
            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, [
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            ]);
            assert.deepEqual(instance.selectedModules, [
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               }
            ]);
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

         it("should remove the cookie, because there're no selected modules left", async function () {
            const url = 'https://online.sbis.ru';
            stubTabURL(url);
            stubCookieValue('UI', url);
            stubCookiesGetAll(
               [
                  {
                     name: 's3debug',
                     value: 'UI',
                     url
                  }
               ],
               url
            );
            stubModulesAndLists(
               instance,
               [],
               [
                  {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               ],
               []
            );
            sandbox.stub(chrome.cookies, 'remove').callsArgWith(1, {
               value: ''
            });

            await instance._changeCookie(
               {},
               'delete',
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               })
            );

            sinon.assert.calledWith(chrome.cookies.remove, {
               name: 's3debug',
               url
            });
            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, [
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               }
            ]);
            assert.deepEqual(instance.selectedModules, []);
            sinon.assert.calledWithExactly(instance._selectedSource.destroy, [
               'UI'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should add existing WS.Core modules to the cookie', async function () {
            const url = 'https://online.sbis.ru';
            stubTabURL(url);
            stubCookieValue(null, url);
            stubCookiesGetAll([], url);
            instance.existingModules = new Set([
               'WS.Core',
               'WS.Deprecated',
               'Core'
            ]);
            stubModulesAndLists(
               instance,
               [
                  {
                     id: 'WS.Core',
                     title: 'WS.Core',
                     isPinned: false
                  },
                  {
                     id: 'WS.Deprecated',
                     title: 'WS.Deprecated',
                     isPinned: false
                  },
                  {
                     id: 'Core',
                     title: 'Core',
                     isPinned: false
                  }
               ],
               [],
               []
            );
            sandbox.stub(chrome.cookies, 'set').callsArgWith(1, {
               value: 'WS.Core,WS.Deprecated,Core'
            });

            await instance._changeCookie(
               {},
               'add',
               new Record({
                  rawData: {
                     id: 'WS.Core',
                     title: 'WS.Core',
                     isPinned: false
                  }
               })
            );

            sinon.assert.calledWith(chrome.cookies.set, {
               name: 's3debug',
               value: 'WS.Core,WS.Deprecated,Core',
               url
            });
            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, []);
            assert.deepEqual(instance.selectedModules, [
               {
                  id: 'WS.Core',
                  title: 'WS.Core',
                  isPinned: false
               },
               {
                  id: 'WS.Deprecated',
                  title: 'WS.Deprecated',
                  isPinned: false
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
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
            sinon.assert.calledWithExactly(instance._unselectedSource.destroy, [
               'WS.Core',
               'WS.Deprecated',
               'Core'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should remove existing WS.Core modules from the cookie', async function () {
            const url = 'https://online.sbis.ru';
            stubTabURL(url);
            stubCookieValue('UI,Controls,WS.Core,WS.Deprecated,Core', url);
            stubCookiesGetAll(
               [
                  {
                     name: 's3debug',
                     value: 'UI,Controls,WS.Core,WS.Deprecated,Core',
                     url
                  }
               ],
               url
            );
            instance.existingModules = new Set([
               'WS.Core',
               'WS.Deprecated',
               'Core'
            ]);
            stubModulesAndLists(
               instance,
               [],
               [
                  {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  },
                  {
                     id: 'Controls',
                     title: 'Controls',
                     isPinned: false
                  },
                  {
                     id: 'WS.Core',
                     title: 'WS.Core',
                     isPinned: false
                  },
                  {
                     id: 'WS.Deprecated',
                     title: 'WS.Deprecated',
                     isPinned: false
                  },
                  {
                     id: 'Core',
                     title: 'Core',
                     isPinned: false
                  }
               ],
               []
            );
            sandbox.stub(chrome.cookies, 'set').callsArgWith(1, {
               value: 'UI,Controls'
            });

            await instance._changeCookie(
               {},
               'delete',
               new Record({
                  rawData: {
                     id: 'WS.Core',
                     title: 'WS.Core',
                     isPinned: false
                  }
               })
            );

            sinon.assert.calledWith(chrome.cookies.set, {
               name: 's3debug',
               value: 'UI,Controls',
               url
            });
            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, [
               {
                  id: 'WS.Core',
                  title: 'WS.Core',
                  isPinned: false
               },
               {
                  id: 'WS.Deprecated',
                  title: 'WS.Deprecated',
                  isPinned: false
               },
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            ]);
            assert.deepEqual(instance.selectedModules, [
               {
                  id: 'UI',
                  title: 'UI',
                  isPinned: false
               },
               {
                  id: 'Controls',
                  title: 'Controls',
                  isPinned: false
               }
            ]);
            assert.deepEqual(
               instance._unselectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'WS.Core',
                  title: 'WS.Core',
                  isPinned: false
               }
            );
            assert.deepEqual(
               instance._unselectedSource.update.secondCall.args[0].getRawData(),
               {
                  id: 'WS.Deprecated',
                  title: 'WS.Deprecated',
                  isPinned: false
               }
            );
            assert.deepEqual(
               instance._unselectedSource.update.thirdCall.args[0].getRawData(),
               {
                  id: 'Core',
                  title: 'Core',
                  isPinned: false
               }
            );
            sinon.assert.calledWithExactly(instance._selectedSource.destroy, [
               'WS.Core',
               'WS.Deprecated',
               'Core'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it("should show popup because the cookie doesn't fit in the available space", async function () {
            const url = 'https://online.sbis.ru';
            stubTabURL(url);
            stubCookieValue('1'.repeat(4094), url);
            stubCookiesGetAll(
               [
                  {
                     name: 's3debug',
                     value: '1'.repeat(4094),
                     url
                  }
               ],
               url
            );
            const popupConfig = {
               type: 'ok',
               style: 'danger',
               details:
                  'The resulting cookie will be too large and very likely will crash the page.\n' +
                  'Consider selecting fewer modules or removing some cookies to make space.'
            };
            sandbox
               .stub(Confirmation, 'openPopup')
               .withArgs(popupConfig)
               .resolves();
            sandbox.stub(chrome.cookies, 'set');

            await instance._changeCookie(
               {},
               'add',
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               })
            );

            sinon.assert.notCalled(chrome.cookies.set);
            sinon.assert.calledWithExactly(Confirmation.openPopup, popupConfig);
         });

         it("should show popup because there's no available space", async function () {
            const url = 'https://online.sbis.ru';
            stubTabURL(url);
            stubCookieValue(null, url);
            stubCookiesGetAll(
               [
                  {
                     name: 'testCookie',
                     value: '1'.repeat(4096),
                     url
                  }
               ],
               url
            );
            const popupConfig = {
               type: 'ok',
               style: 'danger',
               details:
                  'The resulting cookie will be too large and very likely will crash the page.\n' +
                  'Consider selecting fewer modules or removing some cookies to make space.'
            };
            sandbox
               .stub(Confirmation, 'openPopup')
               .withArgs(popupConfig)
               .resolves();
            sandbox.stub(chrome.cookies, 'set');

            await instance._changeCookie(
               {},
               'add',
               new Record({
                  rawData: {
                     id: 'UI',
                     title: 'UI',
                     isPinned: false
                  }
               })
            );

            sinon.assert.notCalled(chrome.cookies.set);
            sinon.assert.calledWithExactly(Confirmation.openPopup, popupConfig);
         });
      });

      describe('onCookieChange', function () {
         it('should not move items because another cookie was changed', async function () {
            instance._hasUnsavedChanges = false;
            sandbox.stub(instance, 'moveItemsInSource');

            await instance.onCookieChange({
               cookie: {
                  name: 'testCookie'
               }
            });

            assert.isFalse(instance._hasUnsavedChanges);
            sinon.assert.notCalled(instance.moveItemsInSource);
         });

         it("should not move items after removal of the cookie because there's no selected items", async function () {
            instance._hasUnsavedChanges = false;
            sandbox.stub(instance, 'moveItemsInSource');
            instance.selectedModules = [];

            await instance.onCookieChange({
               cookie: {
                  name: 's3debug'
               },
               removed: true,
               cause: 'explicit'
            });

            assert.isFalse(instance._hasUnsavedChanges);
            assert.isEmpty(instance.selectedModules);
            sinon.assert.notCalled(instance.moveItemsInSource);
         });

         it('should not move items after removal of the cookie because the cookie was overwritten by devtools', async function () {
            instance._hasUnsavedChanges = false;
            sandbox.stub(instance, 'moveItemsInSource');
            const rawData = [
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               }
            ];
            instance.selectedModules = rawData.slice();

            await instance.onCookieChange({
               cookie: {
                  name: 's3debug'
               },
               removed: true,
               cause: 'overwrite'
            });

            assert.isFalse(instance._hasUnsavedChanges);
            assert.deepEqual(instance.selectedModules, rawData);
            sinon.assert.notCalled(instance.moveItemsInSource);
         });

         it('should move all selected items to unselected (s3debug=true)', async function () {
            instance._hasUnsavedChanges = false;
            const rawData = [
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               },
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               }
            ];
            instance.pinnedModules = new Set(['anotherTest']);
            instance.unselectedModules = [];
            instance.selectedModules = rawData.slice();
            instance._unselectedSource = new Memory({
               data: [],
               keyProperty: 'id'
            });
            instance._selectedSource = new Memory({
               data: rawData.slice(),
               keyProperty: 'id'
            });
            sandbox.stub(instance._unselectedSource, 'update');
            sandbox.stub(instance._selectedSource, 'destroy');
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };

            await instance.onCookieChange({
               cookie: {
                  name: 's3debug',
                  value: 'true'
               },
               removed: true,
               cause: 'explicit'
            });

            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, rawData);
            assert.isEmpty(instance.selectedModules);
            assert.deepEqual(
               instance._unselectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               }
            );
            assert.deepEqual(
               instance._unselectedSource.update.secondCall.args[0].getRawData(),
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               }
            );
            sinon.assert.calledWithExactly(instance._selectedSource.destroy, [
               'test',
               'anotherTest'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should move all selected items to unselected (s3debug=string[])', async function () {
            instance._hasUnsavedChanges = false;
            const rawData = [
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               },
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               }
            ];
            instance.pinnedModules = new Set(['anotherTest']);
            instance.unselectedModules = [];
            instance.selectedModules = rawData.slice();
            instance._unselectedSource = new Memory({
               data: [],
               keyProperty: 'id'
            });
            instance._selectedSource = new Memory({
               data: rawData.slice(),
               keyProperty: 'id'
            });
            sandbox.stub(instance._unselectedSource, 'update');
            sandbox.stub(instance._selectedSource, 'destroy');
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };

            await instance.onCookieChange({
               cookie: {
                  name: 's3debug',
                  value: 'test,anotherTest'
               },
               removed: true,
               cause: 'explicit'
            });

            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, rawData);
            assert.isEmpty(instance.selectedModules);
            assert.deepEqual(
               instance._unselectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               }
            );
            assert.deepEqual(
               instance._unselectedSource.update.secondCall.args[0].getRawData(),
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               }
            );
            sinon.assert.calledWithExactly(instance._selectedSource.destroy, [
               'test',
               'anotherTest'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });

         it('should move all unselected items to selected (s3debug=true)', async function () {
            instance._hasUnsavedChanges = false;
            const rawData = [
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               },
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               }
            ];
            instance.pinnedModules = new Set(['anotherTest']);
            instance.unselectedModules = [rawData[0]];
            instance.selectedModules = [rawData[1]];
            instance._unselectedSource = new Memory({
               data: [],
               keyProperty: 'id'
            });
            instance._selectedSource = new Memory({
               data: rawData.slice(),
               keyProperty: 'id'
            });
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            const oldUnselectedSource = instance._unselectedSource;
            const oldSelectedSource = instance._selectedSource;

            await instance.onCookieChange({
               cookie: {
                  name: 's3debug',
                  value: 'true'
               },
               removed: false,
               cause: 'explicit'
            });

            assert.isTrue(instance._hasUnsavedChanges);
            assert.isEmpty(instance.unselectedModules);
            assert.deepEqual(instance.selectedModules, rawData);
            assert.notEqual(instance._unselectedSource, oldUnselectedSource);
            assert.notEqual(instance._selectedSource, oldSelectedSource);
            assert.deepEqual(instance._unselectedSource.data, []);
            assert.deepEqual(instance._selectedSource.data, rawData);
            sinon.assert.notCalled(instance._children.unselectedList.reload);
            sinon.assert.notCalled(instance._children.selectedList.reload);
         });

         it('should swap items between lists', async function () {
            instance._hasUnsavedChanges = false;
            const rawData = [
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               },
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               }
            ];
            instance.pinnedModules = new Set(['anotherTest']);
            instance.unselectedModules = [rawData[0]];
            instance.selectedModules = [rawData[1]];
            instance._unselectedSource = new Memory({
               data: [],
               keyProperty: 'id'
            });
            instance._selectedSource = new Memory({
               data: rawData.slice(),
               keyProperty: 'id'
            });
            sandbox.stub(instance._unselectedSource, 'update');
            sandbox.stub(instance._unselectedSource, 'destroy');
            sandbox.stub(instance._selectedSource, 'update');
            sandbox.stub(instance._selectedSource, 'destroy');
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };
            instance._children = {
               unselectedList: {
                  reload: sandbox.stub()
               },
               selectedList: {
                  reload: sandbox.stub()
               }
            };

            await instance.onCookieChange({
               cookie: {
                  name: 's3debug',
                  value: 'test'
               },
               removed: false,
               cause: 'explicit'
            });

            assert.isTrue(instance._hasUnsavedChanges);
            assert.deepEqual(instance.unselectedModules, [rawData[1]]);
            assert.deepEqual(instance.selectedModules, [rawData[0]]);
            assert.deepEqual(
               instance._selectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               }
            );
            sinon.assert.calledWithExactly(instance._unselectedSource.destroy, [
               'test'
            ]);
            assert.deepEqual(
               instance._unselectedSource.update.firstCall.args[0].getRawData(),
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               }
            );
            sinon.assert.calledWithExactly(instance._selectedSource.destroy, [
               'anotherTest'
            ]);
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            sinon.assert.calledOnce(instance._children.selectedList.reload);
         });
      });

      describe('sourceFilter', function () {
         it('should return true because the filter is empty', function () {
            const item = new Model({
               rawData: {
                  title: 'Controls'
               }
            });
            const filter = {};

            assert.isTrue(View.sourceFilter(item, filter));
         });

         it('should return false because the item does not match the filter', function () {
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

         it('should return true because the item matches the filter', function () {
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

      describe('togglePin', function () {
         it('should pin the item, update it in the source and reload the unselectedList', async function () {
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
            const rawData = {
               id: 'UI',
               title: 'UI',
               isPinned: false
            };
            instance.unselectedModules = [rawData];
            const oldItem = new Record({
               rawData
            });

            await instance._unselectedActions[0].handler(oldItem);

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
            assert.isTrue(instance.unselectedModules[0].isPinned);
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: ['UI']
            });
         });

         it('should unpin the item, update it in the source and reload the unselectedList', async function () {
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
            const rawData = {
               id: 'UI',
               title: 'UI',
               isPinned: true
            };
            instance.unselectedModules = [rawData];
            const oldItem = new Record({
               rawData
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
                  isPinned: false
               }
            );
            sinon.assert.calledOnce(instance._children.unselectedList.reload);
            assert.deepEqual(instance.pinnedModules, new Set());
            assert.isFalse(instance.unselectedModules[0].isPinned);
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: []
            });
         });

         it('should pin the item, update it in the source and reload the selectedList', async function () {
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
            const rawData = {
               id: 'UI',
               title: 'UI',
               isPinned: false
            };
            instance.selectedModules = [rawData];
            const oldItem = new Record({
               rawData
            });

            await instance._selectedActions[0].handler(oldItem);

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
            assert.isTrue(instance.selectedModules[0].isPinned);
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: ['UI']
            });
         });

         it('should unpin the item, update it in the source and reload the selectedList', async function () {
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
            const rawData = {
               id: 'UI',
               title: 'UI',
               isPinned: true
            };
            instance.selectedModules = [rawData];
            const oldItem = new Record({
               rawData
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
                  isPinned: false
               }
            );
            sinon.assert.calledOnce(instance._children.selectedList.reload);
            assert.deepEqual(instance.pinnedModules, new Set());
            assert.isFalse(instance.selectedModules[0].isPinned);
            sinon.assert.calledWithExactly(chrome.storage.sync.set, {
               debuggingPinnedModules: []
            });
         });
      });

      describe('_beforeUnmount', function () {
         it('should remove listener from chrome.cookies.onChanged', function () {
            sandbox.stub(chrome.cookies.onChanged, 'removeListener');

            instance._beforeUnmount();

            sinon.assert.calledWithExactly(
               chrome.cookies.onChanged.removeListener,
               instance.onCookieChange
            );
         });
      });

      describe('_reloadPage', function () {
         it('should set _hasUnsavedChanges to false and reload the page', function () {
            sandbox.stub(chrome.devtools.inspectedWindow, 'reload');
            instance._hasUnsavedChanges = true;

            instance._reloadPage();

            assert.isFalse(instance._hasUnsavedChanges);
            sinon.assert.calledWithExactly(
               chrome.devtools.inspectedWindow.reload,
               {}
            );
         });
      });

      describe('_moveFavoriteItems', function () {
         it('should set cookie to all pinned modules + selected items', function () {
            sandbox.stub(instance, 'setCookie');
            instance.pinnedModules = new Set();
            instance.pinnedModules.add('anotherTest');
            instance.pinnedModules.add('andAnotherOne');
            instance.unselectedModules = [
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               },
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               },
               {
                  id: 'andAnotherOne',
                  title: 'andAnotherOne',
                  isPinned: true
               }
            ];
            instance.selectedModules = [
               {
                  id: 'andAnotherNotPinnedOne',
                  title: 'andAnotherNotPinnedOne',
                  isPinned: false
               }
            ];

            instance._moveFavoriteItems({}, true);

            sinon.assert.calledWithExactly(instance.setCookie, [
               'anotherTest',
               'andAnotherOne',
               'andAnotherNotPinnedOne'
            ]);
         });

         it('should unselect selected pinned modules', function () {
            sandbox.stub(instance, 'setCookie');
            instance.pinnedModules = new Set();
            instance.pinnedModules.add('anotherTest');
            instance.pinnedModules.add('andAnotherOne');
            instance.unselectedModules = [
               {
                  id: 'test',
                  title: 'test',
                  isPinned: false
               },
               {
                  id: 'andAnotherOne',
                  title: 'andAnotherOne',
                  isPinned: true
               }
            ];
            instance.selectedModules = [
               {
                  id: 'anotherTest',
                  title: 'anotherTest',
                  isPinned: true
               },
               {
                  id: 'andAnotherNotPinnedOne',
                  title: 'andAnotherNotPinnedOne',
                  isPinned: false
               }
            ];

            instance._moveFavoriteItems({}, false);

            sinon.assert.calledWithExactly(instance.setCookie, [
               'andAnotherNotPinnedOne'
            ]);
         });
      });

      describe('_moveAllItems', function () {
         it('should set cookie to true', function () {
            sandbox.stub(instance, 'setCookie');

            instance._moveAllItems({}, true);

            sinon.assert.calledWithExactly(instance.setCookie, ['true']);
         });

         it('should call setCookie with empty array (this will remove the cookie)', function () {
            sandbox.stub(instance, 'setCookie');

            instance._moveAllItems({}, false);

            sinon.assert.calledWithExactly(instance.setCookie, []);
         });
      });

      it('_itemActionVisibilityCallback', function () {
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
