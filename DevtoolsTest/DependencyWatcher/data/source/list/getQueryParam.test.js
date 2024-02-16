define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/list/getQueryParam',
   'Types/source'
], function(mockChrome, getQueryParam, sourceLib) {
   getQueryParam = getQueryParam.getQueryParam;
   const Query = sourceLib.Query;

   describe('DependencyWatcher/_data/source/list/getQueryParam', function() {
      it('should filter out files, dependentOnFiles, onlyDeprecated from where', function() {
         const query = new Query()
            .where({
               json: true,
               onlyDeprecated: true,
               files: [],
               dependentOnFiles: [],
               parent: '1;'
            })
            .orderBy('fileName')
            .limit(50);
         const ignoreFilters = {
            parent: ['files', 'dependentOnFiles', 'onlyDeprecated']
         };
         const defaultFilters = {
            css: false,
            json: false,
            i18n: false,
            onlyDeprecated: false
         };

         assert.deepEqual(getQueryParam(query, ignoreFilters, defaultFilters), {
            keys: undefined,
            where: {
               css: false,
               json: true,
               i18n: false,
               parent: '1;'
            },
            sortBy: {
               fileName: true
            },
            limit: 50,
            offset: 0
         });
      });

      it('should convert the id from where to array of keys', function() {
         const query = new Query()
            .where({
               id: 1,
               json: true,
               onlyDeprecated: true,
               files: [],
               dependentOnFiles: [],
               parent: null
            })
            .limit(50)
            .offset(10);

         assert.deepEqual(getQueryParam(query), {
            keys: [1],
            where: {
               json: true,
               onlyDeprecated: true,
               files: [],
               dependentOnFiles: [],
               parent: null
            },
            sortBy: {},
            limit: 50,
            offset: 10
         });
      });

      it('should use the id from where as keys', function() {
         const query = new Query()
            .where({
               id: [1, 2],
               json: true,
               onlyDeprecated: true,
               files: [],
               dependentOnFiles: [],
               parent: null
            })
            .limit(50)
            .offset(10);

         assert.deepEqual(getQueryParam(query), {
            keys: [1, 2],
            where: {
               json: true,
               onlyDeprecated: true,
               files: [],
               dependentOnFiles: [],
               parent: null
            },
            sortBy: {},
            limit: 50,
            offset: 10
         });
      });
   });
});
