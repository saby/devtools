define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_module/getItemActions',
   'Core/i18n'
], function(mockChrome, getItemActions, i18n) {
   let sandbox;
   getItemActions = getItemActions.getItemActions;
   const rk = i18n.rk;

   describe('DependencyWatcher/_module/getItemActions', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('getItemActions', function() {
         it('should return action configs with correct handlers', function() {
            const firstHandler = () => {};
            const secondHandler = () => {};
            const actions = {
               fileId: firstHandler,
               dependentOnFile: secondHandler,
               testAction: () => {}
            };

            assert.deepEqual(getItemActions(actions), [
               {
                  id: 'fileId',
                  title: rk('Отобразить модули файла'),
                  icon: 'icon-RelatedDocumentsDown',
                  showType: 0,
                  handler: firstHandler
               },
               {
                  id: 'dependentOnFile',
                  title: rk('Отобразить модули, зависящие от файла'),
                  icon: 'icon-RelatedDocumentsUp',
                  showType: 0,
                  handler: secondHandler
               }
            ]);
         });
      });
   });
});
