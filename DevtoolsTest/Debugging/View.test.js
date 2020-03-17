define([
   'DevtoolsTest/mockChrome',
   'Debugging/_view/View',
   'Types/entity',
   'Controls/popup'
], function(mockChrome, View, entityLib, popupLib) {
   let sandbox;
   let instance;
   View = View.default;
   const Confirmation = popupLib.Confirmation;

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

            await instance._beforeMount();

            assert.deepEqual(instance._selectedKeys, [
               'Controls',
               'UI',
               'Core'
            ]);
            assert.deepEqual(instance._source.data, [
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

            await instance._beforeMount();

            assert.deepEqual(instance._selectedKeys, [
               'Controls',
               'UI',
               'Core'
            ]);
            assert.deepEqual(instance._source.data, [
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

            await instance._beforeMount();

            assert.deepEqual(instance._selectedKeys, []);
            assert.deepEqual(instance._source.data, [
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
            ]);
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

            await instance._beforeMount();

            assert.deepEqual(instance._selectedKeys, []);
            assert.deepEqual(instance._source.data, [
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
            ]);
         });
      });

      describe('_onSelectedKeysChanged', function() {
         it('should not do anything because the keys did not change', function() {
            const selectedKeys = ['Controls', 'UI'];
            instance._selectedKeys = selectedKeys;

            instance._onSelectedKeysChanged({}, selectedKeys, [], []);

            assert.equal(instance._selectedKeys, selectedKeys);
         });

         it('should save new keys on instance', function() {
            instance._selectedKeys = [];

            instance._onSelectedKeysChanged({}, ['Controls'], ['Controls'], []);

            assert.deepEqual(instance._selectedKeys, ['Controls']);
         });

         it('should add every module from WS_CORE_MODULES if WS.Core was selected', function() {
            instance._selectedKeys = [];

            instance._onSelectedKeysChanged({}, ['WS.Core'], ['WS.Core'], []);

            assert.sameMembers(instance._selectedKeys, [
               'WS',
               'WS.Core',
               'Lib',
               'Ext',
               'WS.Deprecated',
               'Deprecated',
               'Helpers',
               'Transport',
               'Core'
            ]);
         });

         it('should remove every module from WS_CORE_MODULES if WS.Core was unselected', function() {
            instance._selectedKeys = [
               'WS',
               'WS.Core',
               'Lib',
               'Ext',
               'WS.Deprecated',
               'Deprecated',
               'Helpers',
               'Transport',
               'Core'
            ];

            instance._onSelectedKeysChanged({}, [], [], ['WS.Core']);

            assert.deepEqual(instance._selectedKeys, []);
         });

         it('should add every module from WS_CORE_MODULES if WS.Deprecated was selected', function() {
            instance._selectedKeys = [];

            instance._onSelectedKeysChanged(
               {},
               ['WS.Deprecated'],
               ['WS.Deprecated'],
               []
            );

            assert.sameMembers(instance._selectedKeys, [
               'WS',
               'WS.Core',
               'Lib',
               'Ext',
               'WS.Deprecated',
               'Deprecated',
               'Helpers',
               'Transport',
               'Core'
            ]);
         });

         it('should remove every module from WS_CORE_MODULES if WS.Deprecated was unselected', function() {
            instance._selectedKeys = [
               'WS',
               'WS.Core',
               'Lib',
               'Ext',
               'WS.Deprecated',
               'Deprecated',
               'Helpers',
               'Transport',
               'Core'
            ];

            instance._onSelectedKeysChanged({}, [], [], ['WS.Deprecated']);

            assert.deepEqual(instance._selectedKeys, []);
         });
      });

      describe('_applyChanges', function() {
         it('should remove s3debug cookie', async function() {
            instance._selectedKeys = [];
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
            instance._selectedKeys = ['Controls', 'UI'];
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
            instance._selectedKeys = ['Controls', 'UI'];
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
            instance._selectedKeys = ['Controls', 'UI', 'Core'];
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
            instance._selectedKeys = ['Controls', 'UI', 'Core'];
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
            const item = new entityLib.Model({
               rawData: {
                  title: 'Controls'
               }
            });
            const filter = {};

            assert.isTrue(View.sourceFilter(item, filter));
         });

         it('should return false because the item does not match the filter', function() {
            const item = new entityLib.Model({
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
            const item = new entityLib.Model({
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
   });
});
