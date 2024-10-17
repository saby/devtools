define([
   'injection/_dependencyWatcher/storage/File',
   'injection/_dependencyWatcher/storage/file/getResourcesFromPerformance',
   'injection/_dependencyWatcher/storage/Storage',
   'injection/_dependencyWatcher/storage/getId',
   'injection/_dependencyWatcher/data/applyWhere',
   'injection/_dependencyWatcher/data/applySort',
   'injection/_dependencyWatcher/data/applyPaging',
   'injection/_dependencyWatcher/data/filter/fileFilters',
   'injection/_dependencyWatcher/data/sort/filesSort'
], function(
   FileStorage,
   getResourcesFromPerformance,
   Storage,
   getId,
   applyWhere,
   applySort,
   applyPaging,
   fileFilters,
   filesSort
) {
   let sandbox;
   FileStorage = FileStorage.FileStorage;

   describe('injection/_dependencyWatcher/storage/File', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should init performance observer and create storage with correct index', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            sandbox.stub(Storage, 'Storage');

            const instance = new FileStorage();

            sinon.assert.calledWithExactly(Storage.Storage, 'path');
            assert.instanceOf(instance._storage, Storage.Storage);
            sinon.assert.calledOnce(getResourcesFromPerformance.init);
         });
      });

      describe('getItems', function() {
         it('should return items', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            const instance = new FileStorage();
            const keys = [0, 1, 2];
            const expectedResult = [{}, {}, {}];
            sandbox
               .stub(instance._storage, 'getItemsById')
               .withArgs(keys)
               .returns(expectedResult);

            assert.equal(instance.getItems(keys), expectedResult);
         });
      });

      describe('getItem', function() {
         it('should return item', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            const instance = new FileStorage();
            const expectedResult = {};
            sandbox
               .stub(instance._storage, 'getItemById')
               .withArgs(0)
               .returns(expectedResult);

            assert.equal(instance.getItem(0), expectedResult);
         });
      });

      describe('find', function() {
         it('should find in items', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            const instance = new FileStorage();
            sandbox.stub(instance._storage, 'getItems').returns([
               {
                  path: 'resources/Types/entity.min.js'
               },
               {
                  path: 'resources/Controls/Application.min.js'
               }
            ]);

            assert.deepEqual(instance.find('Controls/Application'), {
               path: 'resources/Controls/Application.min.js'
            });
         });

         it('should find in resources from performance', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            const instance = new FileStorage();
            sandbox.stub(instance._storage, 'getItems').returns([]);
            sandbox.stub(instance._storage, 'add');
            sandbox
               .stub(getResourcesFromPerformance, 'default')
               .returns([
                  'resources/Types/entity.min.js',
                  'resources/Controls/Application.min.js'
               ]);
            sandbox.stub(getId, 'getId').returns(1);
            const expectedResult = {
               path: 'resources/Controls/Application.min.js',
               name: 'Application.min.js',
               id: 1,
               modules: new Set()
            };

            const result = instance.find('Controls/Application');

            assert.deepEqual(result, expectedResult);
            sinon.assert.calledWithExactly(
               instance._storage.add,
               expectedResult
            );
         });
      });

      describe('create', function() {
         it('should create a new file and at it to the storage', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            const instance = new FileStorage();
            sandbox.stub(instance._storage, 'add');
            sandbox.stub(getId, 'getId').returns(1);
            const expectedResult = {
               path: 'resources/Controls/Application.min.js',
               name: 'Application.min.js',
               id: 1,
               modules: new Set()
            };

            const result = instance.create(
               'resources/Controls/Application.min.js'
            );

            assert.deepEqual(result, expectedResult);
            sinon.assert.calledWithExactly(
               instance._storage.add,
               expectedResult
            );
         });
      });

      describe('query', function() {
         it('should process query with default parameters', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            const instance = new FileStorage();
            const item = {
               path: 'resources/Controls/Application.min.js',
               name: 'Application.min.js',
               id: 1,
               modules: new Set()
            };
            sandbox
               .stub(instance._storage, 'getItemsById')
               .withArgs([1])
               .returns([item]);
            sandbox
               .stub(applyWhere, 'default')
               .withArgs([item], {}, fileFilters.default)
               .returns([item]);
            sandbox
               .stub(applySort, 'default')
               .withArgs([item], {}, filesSort.default)
               .returns([item]);
            sandbox
               .stub(applyPaging, 'applyPaging')
               .withArgs([1], 0, 10)
               .returns([item]);

            const result = instance.query({
               keys: [1],
               limit: 10
            });

            assert.deepEqual(result, [item]);
            sinon.assert.calledOnce(applyWhere.default);
            sinon.assert.calledOnce(applySort.default);
            sinon.assert.calledOnce(applyPaging.applyPaging);
         });

         it('should process query with passed parameters', function() {
            sandbox.stub(getResourcesFromPerformance, 'init');
            const instance = new FileStorage();
            const item = {
               path: 'resources/Controls/Application.min.js',
               name: 'Application.min.js',
               id: 1,
               modules: new Set()
            };
            sandbox
               .stub(instance._storage, 'getItemsById')
               .withArgs([1])
               .returns([item]);
            sandbox
               .stub(applyWhere, 'default')
               .withArgs(
                  [item],
                  {
                     name: 'Application'
                  },
                  fileFilters.default
               )
               .returns([item]);
            sandbox
               .stub(applySort, 'default')
               .withArgs(
                  [item],
                  {
                     name: true
                  },
                  filesSort.default
               )
               .returns([item]);
            sandbox
               .stub(applyPaging, 'applyPaging')
               .withArgs([1], 5, 15)
               .returns([item]);

            const result = instance.query({
               keys: [1],
               where: {
                  name: 'Application'
               },
               offset: 5,
               limit: 15,
               sortBy: {
                  name: true
               }
            });

            assert.deepEqual(result, [item]);
            sinon.assert.calledOnce(applyWhere.default);
            sinon.assert.calledOnce(applySort.default);
            sinon.assert.calledOnce(applyPaging.applyPaging);
         });
      });
   });
});
