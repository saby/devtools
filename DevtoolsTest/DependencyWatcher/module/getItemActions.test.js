define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_module/getItemActions',
   'i18n!DevtoolsTest'
], function(mockChrome, getItemActions, rk) {
   getItemActions = getItemActions.getItemActions;

   describe('DependencyWatcher/_module/getItemActions', function() {
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
