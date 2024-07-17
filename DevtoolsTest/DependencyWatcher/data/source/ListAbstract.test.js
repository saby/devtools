define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_data/source/ListAbstract',
   'DependencyWatcher/_data/source/list/getQueryParam',
   'Types/collection'
], function(mockChrome, ListAbstract, getQueryParam, collectionLib) {
   let sandbox;
   ListAbstract = ListAbstract.ListAbstract;

   describe('DependencyWatcher/_data/source/ListAbstract', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should set correct state', function() {
            const items = {};
            const logger = {};
            const defaultFilters = {
               css: false,
               json: false
            };
            const ignoreFilters = {
               i18n: false,
               onlyDeprecated: false
            };

            const instance = new ListAbstract({
               itemStorage: items,
               logger,
               defaultFilters,
               ignoreFilters
            });

            assert.equal(instance._items, items);
            assert.equal(instance._logger, logger);
            assert.equal(instance._defaultFilters, defaultFilters);
            assert.equal(instance._ignoreFilters, ignoreFilters);
         });

         it('should set correct defaultOptions', function() {
            const items = {};
            const logger = {};

            const instance = new ListAbstract({
               itemStorage: items,
               logger
            });

            assert.equal(instance._items, items);
            assert.equal(instance._logger, logger);
            assert.deepEqual(instance._defaultFilters, {});
            assert.deepEqual(instance._ignoreFilters, {});
         });
      });

      describe('query', function() {
         let instance;
         beforeEach(function() {
            const items = {};
            const logger = {
               log: sandbox.stub(),
               error: sandbox.stub()
            };
            instance = new ListAbstract({
               itemStorage: items,
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
               .stub(instance, '__callQuery')
               .withArgs(queryParam, '1;')
               .resolves({
                  data: [],
                  hasMore: true
               });
            const path = new collectionLib.RecordSet({
               data: [],
               keyProperty: 'id'
            });
            sandbox
               .stub(instance, '__createPath')
               .withArgs('1;')
               .resolves(path);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly(
                  'query success. create path'
               )
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [],
               meta: {
                  more: true,
                  path,
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
               .stub(instance, '__callQuery')
               .withArgs(queryParam, '1;')
               .resolves({
                  data: [],
                  hasMore: true
               });
            const path = new collectionLib.RecordSet({
               data: [],
               keyProperty: 'id'
            });
            sandbox
               .stub(instance, '__createPath')
               .withArgs('1;')
               .resolves(path);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly(
                  'query success. create path'
               )
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [],
               meta: {
                  more: true,
                  path,
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
               .stub(instance, '__callQuery')
               .withArgs(queryParam, '1;')
               .resolves({
                  data: [
                     {
                        id: 0
                     },
                     {
                        id: 1
                     }
                  ],
                  hasMore: true
               });
            const path = new collectionLib.RecordSet({
               data: [
                  {
                     id: 0
                  },
                  {
                     id: 1
                  }
               ],
               keyProperty: 'id'
            });
            sandbox
               .stub(instance, '__createPath')
               .withArgs('1;')
               .resolves(path);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly(
                  'query success. create path'
               )
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [
                  {
                     id: 0
                  },
                  {
                     id: 1
                  }
               ],
               meta: {
                  more: true,
                  path,
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
            const callQueryStub = sandbox.stub(instance, '__callQuery');
            callQueryStub
               .withArgs(
                  {
                     keys: undefined,
                     where: {
                        json: true,
                        onlyDeprecated: true,
                        files: [],
                        dependentOnFiles: [],
                        name: 'еуые'
                     },
                     sortBy: {},
                     limit: 50,
                     offset: 10
                  },
                  '1;'
               )
               .resolves({
                  data: [],
                  hasMore: false
               });
            callQueryStub
               .withArgs(
                  {
                     keys: undefined,
                     where: {
                        json: true,
                        onlyDeprecated: true,
                        files: [],
                        dependentOnFiles: [],
                        name: 'test'
                     },
                     sortBy: {},
                     limit: 50,
                     offset: 10
                  },
                  '1;'
               )
               .resolves({
                  data: [
                     {
                        id: 0
                     },
                     {
                        id: 1
                     }
                  ],
                  hasMore: true
               });
            const path = new collectionLib.RecordSet({
               data: [
                  {
                     id: 0
                  },
                  {
                     id: 1
                  }
               ],
               keyProperty: 'id'
            });
            sandbox
               .stub(instance, '__createPath')
               .withArgs('1;')
               .resolves(path);

            const result = await instance.query(query);

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly(
                  'query success. create path'
               )
            );
            assert.isTrue(
               instance._logger.log.calledWithExactly('query success')
            );
            assert.deepEqual(result.getRawData(), {
               data: [
                  {
                     id: 0
                  },
                  {
                     id: 1
                  }
               ],
               meta: {
                  more: true,
                  path,
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
               .stub(instance, '__callQuery')
               .withArgs(queryParam, '1;')
               .rejects(error);

            try {
               await instance.query(query);
            } catch (err) {
               assert.equal(err, error);
            }

            assert.isTrue(
               instance._logger.log.calledWithExactly('start query')
            );
            assert.isTrue(
               instance._logger.error.calledWithExactly(error)
            );
         });
      });

      describe('__callQuery', function() {
         let instance;
         beforeEach(function() {
            const items = {};
            const logger = {};
            instance = new ListAbstract({
               itemStorage: items,
               logger
            });
         });

         it('should return the result of a __query call', async function() {
            const queryResult = {
               data: [],
               hasMore: false
            };
            const params = {
               limit: 10,
               offset: 0,
               sortBy: {
                  fileId: true
               },
               where: {
                  css: true
               }
            };
            const stub = sandbox
               .stub(instance, '__query')
               .resolves(queryResult);

            const result = await instance.__callQuery(params);

            assert.isTrue(stub.calledOnceWithExactly(params));
            assert.equal(result, queryResult);
         });

         it('should return the result of a __queryItems call', async function() {
            const queryResult = {
               data: [],
               hasMore: false
            };
            const params = {
               limit: 10,
               offset: 0,
               sortBy: {
                  fileId: true
               },
               where: {
                  css: true
               }
            };
            const parent = ['1;', '2;'];
            const stub = sandbox
               .stub(instance, '__queryItems')
               .resolves(queryResult);

            const result = await instance.__callQuery(params, parent);

            assert.isTrue(stub.calledOnceWithExactly(parent, params));
            assert.equal(result, queryResult);
         });

         it('should return the result of a __queryItem call', async function() {
            const queryResult = {
               data: [],
               hasMore: false
            };
            const params = {
               limit: 10,
               offset: 0,
               sortBy: {
                  fileId: true
               },
               where: {
                  css: true
               }
            };
            const parent = '1;';
            const stub = sandbox
               .stub(instance, '__queryItem')
               .resolves(queryResult);

            const result = await instance.__callQuery(params, parent);

            assert.isTrue(stub.calledOnceWithExactly(1, parent, params));
            assert.equal(result, queryResult);
         });
      });

      describe('__query', function() {
         let instance;
         beforeEach(function() {
            const items = {
               query: () => {},
               getItems: () => {}
            };
            const logger = {
               log: sandbox.stub()
            };
            instance = new ListAbstract({
               itemStorage: items,
               logger
            });
         });

         it('should read data for every item from content script and transform it to items', async function() {
            const queryResult = {
               data: [1, 2, 3],
               hasMore: false
            };
            const params = {
               limit: 10,
               offset: 0,
               sortBy: {
                  fileId: true
               },
               where: {
                  css: true
               }
            };
            const items = [
               {
                  fileId: 1,
                  name: '~> page <~'
               },
               {
                  fileId: 2,
                  name: 'TestModule'
               },
               {
                  fileId: 3,
                  name: 'AnotherModule'
               }
            ];
            sandbox
               .stub(instance._items, 'query')
               .withArgs(params)
               .resolves(queryResult);
            sandbox
               .stub(instance._items, 'getItems')
               .withArgs(queryResult.data)
               .resolves(items);
            sandbox.stub(instance, '__createItem').returnsArg(0);

            const result = await instance.__query(params);

            assert.isTrue(
               instance._logger.log.calledOnceWithExactly(
                  'query without parent'
               )
            );
            assert.deepEqual(result, {
               hasMore: false,
               data: [
                  {
                     fileId: 2,
                     name: 'TestModule'
                  },
                  {
                     fileId: 3,
                     name: 'AnotherModule'
                  }
               ]
            });
         });
      });

      describe('__queryItem', function() {
         let instance;
         beforeEach(function() {
            const items = {
               query: () => {},
               getItems: () => {}
            };
            const logger = {
               log: sandbox.stub()
            };
            instance = new ListAbstract({
               itemStorage: items,
               logger
            });
         });

         it('should read data for one item from content script and transform it to items', async function() {
            const queryResult = {
               data: [
                  {
                     id: 3,
                     fileId: 3,
                     name: 'AnotherModule'
                  },
                  {
                     id: 4,
                     fileId: 4,
                     name: 'AndAnotherOne'
                  }
               ],
               hasMore: true
            };
            const params = {
               limit: 10,
               offset: 0,
               sortBy: {
                  fileId: true
               },
               where: {
                  css: true
               }
            };
            const items = [
               {
                  id: 1,
                  fileId: 1,
                  name: '~> page <~'
               },
               {
                  id: 2,
                  fileId: 2,
                  name: 'TestModule'
               },
               {
                  id: 3,
                  fileId: 3,
                  name: 'AnotherModule'
               },
               {
                  id: 4,
                  fileId: 4,
                  name: 'AndAnotherOne'
               }
            ];
            const getItemsStub = sandbox.stub(instance._items, 'getItems');
            getItemsStub.withArgs([2]).resolves([items[1]]);
            getItemsStub.withArgs(queryResult.data).resolves(queryResult.data);
            instance._getChildren = sandbox
               .stub()
               .withArgs(items[1])
               .returns({
                  dynamic: [3],
                  static: [4]
               });
            sandbox
               .stub(instance._items, 'query')
               .withArgs({
                  ...params,
                  keys: [3, 4]
               })
               .resolves(queryResult);
            sandbox.stub(instance, '__createItem').callsFake((...args) => {
               return {
                  module: args[0],
                  parent: args[1],
                  isDynamic: args[2]
               };
            });

            const result = await instance.__queryItem(2, '2;', params);

            assert.isTrue(
               instance._logger.log.calledOnceWithExactly(
                  'query with parent: 2;'
               )
            );
            assert.deepEqual(result, {
               hasMore: true,
               data: [
                  {
                     module: queryResult.data[0],
                     parent: '2;',
                     isDynamic: true
                  },
                  {
                     module: queryResult.data[1],
                     parent: '2;',
                     isDynamic: false
                  }
               ]
            });
         });

         it('should throw error because the item does not exist', async function() {
            const params = {
               limit: 10,
               offset: 0,
               sortBy: {
                  fileId: true
               },
               where: {
                  css: true
               }
            };
            sandbox
               .stub(instance._items, 'getItems')
               .withArgs([2])
               .resolves([]);

            try {
               await instance.__queryItem(2, '2;', params);
            } catch (error) {
               assert.instanceOf(error, Error);
               assert.equal(error.message, 'Не удалось получить данные узла');
            }
            assert.isTrue(
               instance._logger.log.calledOnceWithExactly(
                  'query with parent: 2;'
               )
            );
         });
      });

      describe('__queryItems', function() {
         let instance;
         beforeEach(function() {
            const items = {
               query: () => {},
               getItems: () => {}
            };
            const logger = {
               log: sandbox.stub()
            };
            instance = new ListAbstract({
               itemStorage: items,
               logger
            });
         });

         it('should call __callQuery for every item and merge results', async function() {
            const params = {
               limit: 10,
               offset: 0,
               sortBy: {
                  fileId: true
               },
               where: {
                  css: true
               }
            };
            const callQueryStub = sandbox.stub(instance, '__callQuery');
            callQueryStub.withArgs(params, '2;').resolves({
               hasMore: false,
               data: [0, 1]
            });
            callQueryStub.withArgs(params, '3;').resolves({
               hasMore: true,
               data: [2, 3]
            });

            const result = await instance.__queryItems(['2;', '3;'], params);

            assert.isTrue(
               instance._logger.log.calledOnceWithExactly(
                  `query with parents: 2;,3; (on update event called)`
               )
            );
            assert.deepEqual(result, {
               hasMore: true,
               data: [0, 1, 2, 3]
            });
         });
      });

      describe('__createItem', function() {
         let instance;
         beforeEach(function() {
            const items = {
               query: () => {},
               getItems: () => {}
            };
            const logger = {
               log: sandbox.stub()
            };
            instance = new ListAbstract({
               itemStorage: items,
               logger
            });
         });

         it('should create an item with some default values', function() {
            const item = {
               id: 1,
               name: 'test',
               defined: true,
               initialized: false,
               fileName: 'testPath.js',
               fileId: 1,
               path: 'https://example.com/testPath.js',
               isDeprecated: true
            };
            instance._getChildren = sandbox
               .stub()
               .withArgs(item)
               .returns({
                  dynamic: [1, 2],
                  static: []
               });

            assert.deepEqual(instance.__createItem(item), {
               name: 'test',
               defined: true,
               initialized: false,
               fileName: 'testPath.js',
               fileId: 1,
               path: 'https://example.com/testPath.js',
               isDeprecated: true,
               parent: null,
               isDynamic: false,
               itemId: 1,
               id: '1;',
               hasChildren: true
            });
         });

         it('should create an item', function() {
            const item = {
               id: 1,
               name: 'test',
               defined: true,
               initialized: false,
               fileName: 'testPath.js',
               fileId: 1,
               path: 'https://example.com/testPath.js',
               isDeprecated: true
            };
            instance._getChildren = sandbox
               .stub()
               .withArgs(item)
               .returns({
                  dynamic: [1, 2],
                  static: []
               });

            assert.deepEqual(instance.__createItem(item, '0;', true), {
               name: 'test',
               defined: true,
               initialized: false,
               fileName: 'testPath.js',
               fileId: 1,
               path: 'https://example.com/testPath.js',
               isDeprecated: true,
               parent: '0;',
               isDynamic: true,
               itemId: 1,
               id: '1;0;',
               hasChildren: true
            });
         });
      });

      describe('__createPath', function() {
         let instance;
         beforeEach(function() {
            const items = {
               query: () => {},
               getItems: () => {}
            };
            const logger = {
               log: sandbox.stub()
            };
            instance = new ListAbstract({
               itemStorage: items,
               logger
            });
         });

         it('should resolve with undefined if the parent is not passed', async function() {
            assert.isUndefined(await instance.__createPath());
         });

         it('should resolve with undefined if the parent is an array', async function() {
            assert.isUndefined(await instance.__createPath(['2;', '1;']));
         });

         it('should resolve with the correct path', async function() {
            const getItemsResult = [
               {
                  defined: true,
                  initialized: true,
                  id: 1,
                  name: 'test',
                  fileId: 1,
                  dependent: {
                     static: [],
                     dynamic: []
                  },
                  dependencies: {
                     static: [],
                     dynamic: []
                  },
                  path: 'https://example.com/testPath.js',
                  fileName: 'testPath.js',
                  isDeprecated: false
               },
               {
                  defined: true,
                  initialized: true,
                  id: 2,
                  name: 'anotherTest',
                  fileId: 2,
                  dependent: {
                     static: [],
                     dynamic: []
                  },
                  dependencies: {
                     static: [],
                     dynamic: []
                  },
                  path: 'https://example.com/anotherPath.js',
                  fileName: 'anotherPath.js',
                  isDeprecated: false
               }
            ];
            sandbox
               .stub(instance._items, 'getItems')
               .withArgs([1, 2])
               .resolves(getItemsResult);
            const createItemStub = sandbox.stub(instance, '__createItem');
            const firstItem = {
               name: 'test',
               defined: true,
               fileName: 'testPath.js',
               fileId: 1,
               path: 'https://example.com/testPath.js',
               initialized: true,
               isDynamic: false,
               isDeprecated: false,
               parent: null,
               itemId: 1,
               id: '1;',
               hasChildren: true
            };
            createItemStub.withArgs(getItemsResult[0]).returns(firstItem);
            const secondItem = {
               name: 'anotherTest',
               defined: true,
               fileName: 'anotherPath.js',
               fileId: 1,
               path: 'https://example.com/anotherPath.js',
               initialized: true,
               isDynamic: false,
               isDeprecated: false,
               parent: '1;',
               itemId: 1,
               id: '2;1;',
               hasChildren: false
            };
            createItemStub.withArgs(getItemsResult[1]).returns(secondItem);

            const result = await instance.__createPath('2;1;');

            assert.equal(result.getCount(), 2);
            assert.deepEqual(result.at(0).getRawData(), firstItem);
            assert.deepEqual(result.at(1).getRawData(), secondItem);
         });
      });
   });
});
