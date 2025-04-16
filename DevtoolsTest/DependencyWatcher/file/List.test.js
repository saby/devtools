define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_file/List',
   'DependencyWatcher/_file/columns',
   'DependencyWatcher/_file/header'
], function(mockChrome, List, columns, headers) {
   let instance;
   List = List.List;

   describe('DependencyWatcher/_file/List', function() {
      beforeEach(function() {
         instance = new List();
      });

      afterEach(function() {
         instance = undefined;
      });

      describe('_beforeMount', function() {
         it('should save sorting on instance for binding', function() {
            const sorting = [{ name: 'DESC' }];

            instance._beforeMount({
               sorting
            });

            assert.deepEqual(instance._sorting, sorting);
         });
      });

      it('getDefaultOptions', function() {
         assert.deepEqual(List.getDefaultOptions(), {
            headers: headers.headers,
            columns: columns.columns
         });
      });
   });
});
