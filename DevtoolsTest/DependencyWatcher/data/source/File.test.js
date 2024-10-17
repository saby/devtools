define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/File',
   'DependencyWatcher/_data/source/list/getQueryParam',
   'Types/collection'
], function(mockChrome, File, getQueryParam) {
   let sandbox;
   File = File.File;

   describe('DependencyWatcher/_data/source/File', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('query', function() {
         let instance;
         beforeEach(function() {
            const files = {
               query: () => {},
               getItems: () => {}
            };
            const logger = {
               log: sandbox.stub(),
               error: sandbox.stub()
            };
            instance = new File({
               fileStorage: files,
               logger
            });
         });

         it('should return empty DataSet because the result and where.name are empty', async function() {
            const query = {};
            const queryParam = {
               keys: undefined,
               where: {
                  json: true,
                  onlyDeprecated: true,
                  files: [],
                  dependentOnFiles: [],
                  parent: '1;'
               },
               sortBy: {},
               limit: 50,
               offset: 10
            };
            sandbox
               .stub(getQueryParam, 'getQueryParam')
               .withArgs(query)
               .returns(queryParam);
            sandbox
               .stub(instance._files, 'query')
               .withArgs(queryParam)
               .resolves({
                  data: [],
                  hasMore: false
               });
            sandbox
               .stub(instance._files, 'getItems')
               .withArgs([])
               .resolves([]);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.isTrue(instance._logger.log.calledWithExactly('get items'));
            assert.isTrue(
               instance._logger.log.calledWithExactly('get items - success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [],
               meta: {
                  more: false,
                  switchedStr: undefined
               }
            });
         });

         it('should return empty DataSet because the result is empty and where.name is the same in 2 languages', async function() {
            const query = {};
            const queryParam = {
               keys: undefined,
               where: {
                  json: true,
                  onlyDeprecated: true,
                  files: [],
                  dependentOnFiles: [],
                  parent: '1;',
                  name: '123'
               },
               sortBy: {},
               limit: 50,
               offset: 10
            };
            sandbox
               .stub(getQueryParam, 'getQueryParam')
               .withArgs(query)
               .returns(queryParam);
            sandbox
               .stub(instance._files, 'query')
               .withArgs(queryParam)
               .resolves({
                  data: [],
                  hasMore: false
               });
            sandbox
               .stub(instance._files, 'getItems')
               .withArgs([])
               .resolves([]);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.isTrue(instance._logger.log.calledWithExactly('get items'));
            assert.isTrue(
               instance._logger.log.calledWithExactly('get items - success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [],
               meta: {
                  more: false,
                  switchedStr: undefined
               }
            });
         });

         it('should return DataSet with data', async function() {
            const query = {};
            const queryParam = {
               keys: undefined,
               where: {
                  json: true,
                  onlyDeprecated: true,
                  files: [],
                  dependentOnFiles: [],
                  parent: '1;'
               },
               sortBy: {},
               limit: 50,
               offset: 10
            };
            sandbox
               .stub(getQueryParam, 'getQueryParam')
               .withArgs(query)
               .returns(queryParam);
            sandbox
               .stub(instance._files, 'query')
               .withArgs(queryParam)
               .resolves({
                  data: [1, 2],
                  hasMore: true
               });
            sandbox
               .stub(instance._files, 'getItems')
               .withArgs([1, 2])
               .resolves([
                  {
                     id: 1,
                     name: 'testPath.js'
                  },
                  {
                     id: 2,
                     name: 'anotherPath.js'
                  }
               ]);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.isTrue(instance._logger.log.calledWithExactly('get items'));
            assert.isTrue(
               instance._logger.log.calledWithExactly('get items - success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [
                  {
                     id: 1,
                     name: 'testPath.js',
                     title: 'testPath.js'
                  },
                  {
                     id: 2,
                     name: 'anotherPath.js',
                     title: 'anotherPath.js'
                  }
               ],
               meta: {
                  more: true,
                  switchedStr: undefined
               }
            });
         });

         it('should return DataSet with data after switching where.name to a different language', async function() {
            const query = {};
            const queryParam = {
               keys: undefined,
               where: {
                  json: true,
                  onlyDeprecated: true,
                  files: [],
                  dependentOnFiles: [],
                  parent: '1;',
                  name: 'еуые'
               },
               sortBy: {},
               limit: 50,
               offset: 10
            };
            sandbox
               .stub(getQueryParam, 'getQueryParam')
               .withArgs(query)
               .returns(queryParam);
            const queryStub = sandbox.stub(instance._files, 'query');
            queryStub
               .withArgs({
                  keys: undefined,
                  where: {
                     json: true,
                     onlyDeprecated: true,
                     files: [],
                     dependentOnFiles: [],
                     parent: '1;',
                     name: 'еуые'
                  },
                  sortBy: {},
                  limit: 50,
                  offset: 10
               })
               .resolves({
                  data: [],
                  hasMore: true
               });
            queryStub
               .withArgs({
                  keys: undefined,
                  where: {
                     json: true,
                     onlyDeprecated: true,
                     files: [],
                     dependentOnFiles: [],
                     parent: '1;',
                     name: 'test'
                  },
                  sortBy: {},
                  limit: 50,
                  offset: 10
               })
               .resolves({
                  data: [1, 2],
                  hasMore: true
               });
            sandbox
               .stub(instance._files, 'getItems')
               .withArgs([1, 2])
               .resolves([
                  {
                     id: 1,
                     name: 'testPath.js'
                  },
                  {
                     id: 2,
                     name: 'anotherPath.js'
                  }
               ]);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.isTrue(instance._logger.log.calledWithExactly('get items'));
            assert.isTrue(
               instance._logger.log.calledWithExactly('get items - success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [
                  {
                     id: 1,
                     name: 'testPath.js',
                     title: 'testPath.js'
                  },
                  {
                     id: 2,
                     name: 'anotherPath.js',
                     title: 'anotherPath.js'
                  }
               ],
               meta: {
                  more: true,
                  switchedStr: 'test'
               }
            });
         });

         it('should log and throw error', async function() {
            const query = {};
            const queryParam = {
               keys: undefined,
               where: {
                  json: true,
                  onlyDeprecated: true,
                  files: [],
                  dependentOnFiles: [],
                  parent: '1;'
               },
               sortBy: {},
               limit: 50,
               offset: 10
            };
            sandbox
               .stub(getQueryParam, 'getQueryParam')
               .withArgs(query)
               .returns(queryParam);
            const error = new Error('test error');
            sandbox
               .stub(instance._files, 'query')
               .withArgs(queryParam)
               .rejects(error);

            try {
               await instance.query(query);
            } catch (err) {
               assert.equal(err, error);
            }

            assert.isTrue(
               instance._logger.log.calledOnceWithExactly('start query')
            );
            assert.isTrue(instance._logger.error.calledOnceWithExactly(error));
         });
      });
   });
});
