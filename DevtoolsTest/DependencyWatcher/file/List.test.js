define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_file/List',
   'DependencyWatcher/_file/navigation',
   'DependencyWatcher/_file/columns',
   'DependencyWatcher/_file/header'
], function(mockChrome, List, navigation, columns, headers) {
   let sandbox;
   let instance;
   List = List.List;

   describe('DependencyWatcher/_file/List', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new List();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_beforeMount', function() {
         it('should save sorting on instance for binding', function() {
            const sorting = [{ size: 'DESC' }];

            instance._beforeMount({
               sorting
            });

            assert.deepEqual(instance._sorting, sorting);
         });
      });

      it('getDefaultOptions', function() {
         assert.deepEqual(List.getDefaultOptions(), {
            navigation: navigation.navigation,
            headers: headers.headers,
            columns: columns.columns,
            sorting: [{ size: 'ASC' }]
         });
      });
   });
});
