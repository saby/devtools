define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_main/Tabs',
   'DependencyWatcher/_main/ViewMode',
   'DependencyWatcher/data',
   'i18n!DevtoolsTest'
], function(mockChrome, Tabs, ViewMode, dataLib, rk) {
   ViewMode = ViewMode.ViewMode;

   describe('DependencyWatcher/_main/Tabs', function() {
      describe('getTabConfig', function() {
         it('should return config for dependency', function() {
            assert.deepEqual(Tabs.getTabConfig(ViewMode.dependency), {
               id: ViewMode.dependency,
               caption: 'Dependency',
               title: rk('Зависимости модулей'),
               Source: dataLib.source.Dependencies
            });
         });

         it('should return config for dependent', function() {
            assert.deepEqual(Tabs.getTabConfig(ViewMode.dependent), {
               id: ViewMode.dependent,
               caption: 'Dependent',
               title: rk('Зависимые модули'),
               Source: dataLib.source.Dependent
            });
         });
      });
   });
});
