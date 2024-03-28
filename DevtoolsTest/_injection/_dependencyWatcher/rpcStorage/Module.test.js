define([
   'injection/_dependencyWatcher/rpcStorage/Module',
   'injection/_dependencyWatcher/storage/Query',
   'injection/_dependencyWatcher/require/getFileNames',
   'injection/_dependencyWatcher/require/isRelease'
], function(Module, Query, getFileNames, isRelease) {
   let sandbox;
   let instance;
   Module = Module.Module;
   Query = Query.Query;

   describe('injection/_dependencyWatcher/rpcStorage/Module', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      beforeEach(function() {
         instance = new Module(
            {
               query: () => {},
               getItems: () => {},
               hasUpdates: () => {},
               openSource: () => {}
            },
            {
               getItems: () => {},
               getItem: () => {},
               find: () => {}
            },
            {
               getOrigin: () => {},
               getConfig: () => {}
            }
         );
      });

      afterEach(function() {
         instance = undefined;
      });

      describe('query', function() {
         it('should call query without changing params', function() {
            const expectedResult = {
               data: [1, 2, 3],
               hasMore: true
            };
            sandbox
               .stub(Query.prototype, 'query')
               .withArgs({
                  keys: [1, 2, 3]
               })
               .returns(expectedResult);

            const result = instance.query({
               keys: [1, 2, 3]
            });

            assert.deepEqual(result, expectedResult);
            sinon.assert.calledOn(Query.prototype.query, instance);
         });

         it('should remove files and dependentOnFiles from params, calculate keys based on where.files and add keys to queryParams', function() {
            const expectedResult = {
               data: [1, 2, 3],
               hasMore: true
            };
            sandbox
               .stub(Query.prototype, 'query')
               .withArgs({
                  keys: [1, 2, 3],
                  where: {}
               })
               .returns(expectedResult);
            sandbox
               .stub(instance._files, 'getItems')
               .withArgs([4, 5])
               .returns([
                  {
                     modules: new Set([1])
                  },
                  {
                     modules: new Set([2, 3])
                  }
               ]);

            const result = instance.query({
               where: {
                  files: [4, 5],
                  dependentOnFiles: []
               }
            });

            assert.deepEqual(result, expectedResult);
            sinon.assert.calledOn(Query.prototype.query, instance);
         });

         it('should remove files and dependentOnFiles from params, calculate keys based on where.dependentOnFiles and add keys to queryParams', function() {
            const expectedResult = {
               data: [1, 2, 3],
               hasMore: true
            };
            sandbox
               .stub(Query.prototype, 'query')
               .withArgs({
                  keys: [1, 2, 3],
                  where: {}
               })
               .returns(expectedResult);
            sandbox
               .stub(instance._moduleStorage, 'query')
               .withArgs({
                  keys: undefined,
                  where: {
                     dependentOnFiles: [4, 5]
                  }
               })
               .returns({
                  data: [1, 2, 3]
               });

            const result = instance.query({
               where: {
                  files: [],
                  dependentOnFiles: [4, 5]
               }
            });

            assert.deepEqual(result, expectedResult);
            sinon.assert.calledOn(Query.prototype.query, instance);
         });

         it('should remove files and dependentOnFiles from params, calculate keys based on both where.files and where.dependentOnFiles and add keys to queryParams', function() {
            const expectedResult = {
               data: [2, 3],
               hasMore: true
            };
            sandbox
               .stub(Query.prototype, 'query')
               .withArgs({
                  keys: [2, 3],
                  where: {}
               })
               .returns(expectedResult);
            sandbox
               .stub(instance._files, 'getItems')
               .withArgs([4, 5])
               .returns([
                  {
                     modules: new Set([1])
                  },
                  {
                     modules: new Set([2, 3])
                  }
               ]);
            sandbox
               .stub(instance._moduleStorage, 'query')
               .withArgs({
                  keys: [1, 2, 3],
                  where: {
                     dependentOnFiles: [6]
                  }
               })
               .returns({
                  data: [2, 3]
               });

            const result = instance.query({
               where: {
                  files: [4, 5],
                  dependentOnFiles: [6]
               }
            });

            assert.deepEqual(result, expectedResult);
            sinon.assert.calledOn(Query.prototype.query, instance);
         });
      });

      describe('hasUpdates', function() {
         it('should pass the call to _moduleStorage', function() {
            const expectedResult = [true, false, true];
            sandbox
               .stub(instance._moduleStorage, 'hasUpdates')
               .withArgs([1, 2, 3])
               .returns(expectedResult);

            assert.deepEqual(instance.hasUpdates([1, 2, 3]), expectedResult);
         });
      });

      describe('getItems', function() {
         it('should initialize items and return them', function() {
            const requireConfig = { buildMode: 'release', bundles: {} };
            sandbox.stub(instance._require, 'getConfig').returns(requireConfig);
            const requireOrigin = {
               defined: sandbox
                  .stub()
                  .withArgs('First')
                  .returns(false)
            };
            sandbox.stub(instance._require, 'getOrigin').returns(requireOrigin);
            sandbox
               .stub(isRelease, 'isRelease')
               .withArgs('release')
               .returns(true);
            sandbox
               .stub(getFileNames, 'getFileNames')
               .withArgs(
                  'Third',
                  requireOrigin,
                  true,
                  requireConfig.bundles,
                  new Set([
                     {
                        id: 1,
                        initialized: false,
                        defined: false,
                        fileId: Number.MIN_SAFE_INTEGER,
                        name: 'First',
                        isDeprecated: false,
                        dependent: {
                           static: new Set(),
                           dynamic: new Set()
                        },
                        dependencies: {
                           static: new Set(),
                           dynamic: new Set()
                        }
                     }
                  ])
               )
               .returns(['Third.js']);
            const newFile = {
               id: 5,
               path: 'resources/Third.js',
               name: 'Third.js',
               modules: new Set()
            };
            sandbox
               .stub(instance._files, 'find')
               .withArgs('Third.js')
               .returns(newFile);
            sandbox
               .stub(instance._files, 'getItem')
               .withArgs(5)
               .returns(newFile);
            const firstModule = {
               id: 1,
               initialized: false,
               defined: false,
               fileId: Number.MIN_SAFE_INTEGER,
               name: 'First',
               isDeprecated: false,
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               }
            };
            const secondModule = {
               id: 2,
               initialized: true,
               defined: false,
               fileId: 1,
               name: 'Second',
               isDeprecated: false,
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               }
            };
            const thirdModule = {
               id: 3,
               initialized: true,
               defined: false,
               fileId: Number.MIN_SAFE_INTEGER,
               dependent: {
                  static: new Set([firstModule]),
                  dynamic: new Set()
               },
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               name: 'Third',
               isDeprecated: false
            };
            const fourthModule = {
               id: 4,
               initialized: true,
               defined: true,
               fileId: 2,
               name: 'Fourth',
               isDeprecated: true,
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               }
            };
            sandbox
               .stub(instance._moduleStorage, 'getItems')
               .withArgs([1, 2, 3])
               .returns([firstModule, secondModule, thirdModule, fourthModule]);
            // setup end

            const result = instance.getItems([1, 2, 3]);

            assert.deepEqual(result, [
               {
                  defined: false,
                  initialized: false,
                  id: 1,
                  name: 'First',
                  fileId: Number.MIN_SAFE_INTEGER,
                  dependent: {
                     static: [],
                     dynamic: []
                  },
                  dependencies: {
                     static: [],
                     dynamic: []
                  },
                  path: '',
                  fileName: '',
                  isDeprecated: false
               },
               {
                  defined: true,
                  initialized: true,
                  id: 2,
                  name: 'Second',
                  fileId: 1,
                  dependent: {
                     static: [],
                     dynamic: []
                  },
                  dependencies: {
                     static: [],
                     dynamic: []
                  },
                  path: '',
                  fileName: '',
                  isDeprecated: false
               },
               {
                  defined: true,
                  initialized: true,
                  id: 3,
                  name: 'Third',
                  fileId: 5,
                  dependent: {
                     static: [1],
                     dynamic: []
                  },
                  dependencies: {
                     static: [],
                     dynamic: []
                  },
                  path: 'resources/Third.js',
                  fileName: 'Third.js',
                  isDeprecated: false
               },
               {
                  defined: true,
                  initialized: true,
                  id: 4,
                  name: 'Fourth',
                  fileId: 2,
                  dependent: {
                     static: [],
                     dynamic: []
                  },
                  dependencies: {
                     static: [],
                     dynamic: []
                  },
                  path: '',
                  fileName: '',
                  isDeprecated: true
               }
            ]);
         });
      });

      describe('openSource', function() {
         it('should pass the call to _moduleStorage', function() {
            const openSourceStub = sandbox.stub(
               instance._moduleStorage,
               'openSource'
            );
            openSourceStub.withArgs(1).returns(true);
            openSourceStub.withArgs(2).returns(false);

            assert.isTrue(instance.openSource(1));
            assert.isFalse(instance.openSource(2));
         });
      });
   });
});
