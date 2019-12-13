define(['DevtoolsTest/mockChrome', 'Profiler/_Profiler/Profiler'], function(
   mockChrome,
   Profiler
) {
   let sandbox;
   Profiler = Profiler.default;

   describe('Profiler/_Profiler/Profiler', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should subscribe to all necessary events', function() {
            const listeners = new Map();
            const store = {
               addListener(key, value) {
                  listeners.set(key, value);
               },
               toggleDevtoolsOpened() {},
               dispatch() {}
            };
            new Profiler({
               store
            });

            assert.isTrue(listeners.has('profilingData'));
            assert.isTrue(listeners.has('operation'));
            assert.isTrue(listeners.has('endSynchronization'));
            assert.isTrue(listeners.has('profilingStatus'));
         });
         it('should call toggleDevtoolsOpened', function() {
            const store = {
               addListener() {},
               dispatch() {},
               toggleDevtoolsOpened() {}
            };
            const stub = sandbox.stub(store, 'toggleDevtoolsOpened');
            new Profiler({
               store
            });

            assert.isTrue(stub.calledOnceWithExactly(true));
         });
         it('should dispatch getProfilingStatus event', function() {
            const store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {}
            };
            const stub = sandbox.stub(store, 'dispatch');
            new Profiler({
               store
            });

            assert.isTrue(stub.calledOnceWithExactly('getProfilingStatus'));
         });
      });

      it('_masterFilter', function() {
         const instance = new Profiler({
            store: {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {}
            }
         });

         assert.isTrue(
            instance._masterFilter({
               selfDuration: 10
            })
         );
         assert.isFalse(
            instance._masterFilter({
               selfDuration: 0
            })
         );
      });

      describe('__setProfilingData', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should correctly transform profiling data to a list of synchronizations', function() {
            const initialIdToDuration = [[1, 10], [2, 15]];
            const changes = [
               [
                  1,
                  {
                     selfDuration: 5,
                     updateReason: 'forceUpdated'
                  }
               ],
               [
                  2,
                  {
                     selfDuration: 7,
                     updateReason: 'parentUpdated'
                  }
               ]
            ];
            const syncList = [
               [
                  'test',
                  {
                     selfDuration: 10,
                     changes
                  }
               ],
               [
                  'test2',
                  {
                     selfDuration: 15,
                     changes
                  }
               ]
            ];
            const backendProfilingData = {
               initialIdToDuration,
               syncList
            };
            const stub = sandbox.stub(instance, '__setSynchronization');
            instance._didProfile = false;

            instance.__setProfilingData(backendProfilingData);

            assert.isTrue(instance._didProfile);
            assert.deepEqual(instance._synchronizations, [
               {
                  id: 'test',
                  selfDuration: 10
               },
               {
                  id: 'test2',
                  selfDuration: 15
               }
            ]);
            assert.equal(instance._selectedSynchronizationId, 'test');
            assert.isTrue(stub.calledOnceWithExactly('test'));
         });

         it('should correctly transform empty profiling data to a list of synchronizations', function() {
            const backendProfilingData = {
               initialIdToDuration: [],
               syncList: []
            };
            const stub = sandbox.stub(instance, '__setSynchronization');
            instance._didProfile = false;

            instance.__setProfilingData(backendProfilingData);

            assert.isTrue(instance._didProfile);
            assert.deepEqual(instance._profilingData, {
               initialIdToDuration: new Map(),
               synchronizationKeyToDescription: new Map()
            });
            assert.deepEqual(instance._synchronizations, []);
            assert.isTrue(stub.notCalled);
         });
      });

      describe('__setSynchronization', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should correctly calculate snapshot of the synchronization', function() {
            const profilingData = {
               initialIdToDuration: new Map([[1, 10], [2, 15]]),
               synchronizationKeyToDescription: new Map([
                  [
                     'test',
                     {
                        selfDuration: 10,
                        changes: new Map([
                           [
                              1,
                              {
                                 selfDuration: 5,
                                 updateReason: 'forceUpdated'
                              }
                           ],
                           [
                              2,
                              {
                                 selfDuration: 7,
                                 updateReason: 'parentUpdated'
                              }
                           ]
                        ])
                     }
                  ],
                  [
                     'test2',
                     {
                        selfDuration: 15,
                        changes: new Map([
                           [
                              1,
                              {
                                 selfDuration: 5,
                                 updateReason: 'forceUpdated'
                              }
                           ],
                           [
                              2,
                              {
                                 selfDuration: 7,
                                 updateReason: 'parentUpdated'
                              }
                           ]
                        ])
                     }
                  ]
               ])
            };
            const synchronizations = [
               {
                  id: 'test',
                  selfDuration: 10
               },
               {
                  id: 'test2',
                  selfDuration: 15
               }
            ];
            const elementsSnapshot = [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: ''
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: ''
               }
            ];
            const changesBySynchronization = new Map([
               ['test', [[3, 1], [3, 2]]],
               ['test2', [[3, 1], [3, 2]]]
            ]);
            instance._profilingData = profilingData;
            instance._synchronizations = synchronizations;
            instance._elementsSnapshot = elementsSnapshot;
            instance._changesBySynchronization = changesBySynchronization;
            const updateSelectedCommitChangesStub = sandbox.stub(
               instance,
               '__updateSelectedCommitChanges'
            );
            const updateSearchStub = sandbox.stub(instance, '__updateSearch');

            instance.__setSynchronization('test2');

            const expectedSnapshot = [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: '',
                  updateReason: 'forceUpdated',
                  selfDuration: 5,
                  actualBaseDuration: 12,
                  actualDuration: 12
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: '',
                  updateReason: 'parentUpdated',
                  selfDuration: 7,
                  actualBaseDuration: 7,
                  actualDuration: 7
               }
            ];
            assert.deepEqual(instance._snapshot, expectedSnapshot);
            assert.deepEqual(
               instance._snapshotBySynchronization.get('test2'),
               expectedSnapshot
            );
            assert.deepEqual(instance._synchronizationOverview, {
               mountedCount: 0,
               selfUpdatedCount: 0,
               parentUpdatedCount: 1,
               unchangedCount: 0,
               forceUpdatedCount: 1,
               destroyedCount: 0
            });
            assert.isTrue(
               updateSelectedCommitChangesStub.calledOnceWithExactly()
            );
            assert.isTrue(updateSearchStub.calledOnceWithExactly(''));
         });

         it('should take snapshot of the synchronization from the cache and not call __getElementsBySynchronization', function() {
            const expectedSnapshot = [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: '',
                  updateReason: 'forceUpdated',
                  selfDuration: 5,
                  actualBaseDuration: 12,
                  actualDuration: 12
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: '',
                  updateReason: 'parentUpdated',
                  selfDuration: 7,
                  actualBaseDuration: 7,
                  actualDuration: 7
               }
            ];
            instance._snapshotBySynchronization.set('test2', expectedSnapshot);
            const updateSelectedCommitChangesStub = sandbox.stub(
               instance,
               '__updateSelectedCommitChanges'
            );
            const updateSearchStub = sandbox.stub(instance, '__updateSearch');
            const getElementsBySynchronizationStub = sandbox.stub(
               instance,
               '__getElementsBySynchronization'
            );

            instance.__setSynchronization('test2');

            assert.deepEqual(instance._snapshot, expectedSnapshot);
            assert.deepEqual(
               instance._snapshotBySynchronization.get('test2'),
               expectedSnapshot
            );
            assert.deepEqual(instance._synchronizationOverview, {
               mountedCount: 0,
               selfUpdatedCount: 0,
               parentUpdatedCount: 1,
               unchangedCount: 0,
               forceUpdatedCount: 1,
               destroyedCount: 0
            });
            assert.isTrue(
               updateSelectedCommitChangesStub.calledOnceWithExactly()
            );
            assert.isTrue(updateSearchStub.calledOnceWithExactly(''));
            assert.isTrue(getElementsBySynchronizationStub.notCalled);
         });
      });

      describe('__updateSelectedCommitChanges', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should set _selectedCommitChanges to undefined because there is no selected commit', function() {
            instance._selectedCommitId = undefined;
            instance._selectedCommitChanges = {
               updateReason: 'unchanged'
            };

            instance.__updateSelectedCommitChanges();

            assert.isUndefined(instance._selectedCommitChanges);
         });

         it('should find the correct changesDescription', function() {
            const changesDescription = {
               updateReason: 'mounted',
               changedOptions: ['value', 'iconSize'],
               changedAttributes: ['class', 'style']
            };
            instance._profilingData = {
               initialIdToDuration: new Map(),
               synchronizationKeyToDescription: new Map([
                  [
                     'test1',
                     {
                        selfDuration: 10,
                        changes: new Map([[1, changesDescription]])
                     }
                  ]
               ])
            };
            instance._selectedSynchronizationId = 'test1';
            instance._selectedCommitId = 1;

            instance.__updateSelectedCommitChanges();

            assert.deepEqual(
               instance._selectedCommitChanges,
               changesDescription
            );
         });

         it("should set update reason as unchanged because there're no changes for the selected commit", function() {
            instance._profilingData = {
               initialIdToDuration: new Map(),
               synchronizationKeyToDescription: new Map([
                  [
                     'test1',
                     {
                        selfDuration: 10,
                        changes: new Map()
                     }
                  ]
               ])
            };
            instance._selectedSynchronizationId = 'test1';
            instance._selectedCommitId = 1;

            instance.__updateSelectedCommitChanges();

            assert.deepEqual(instance._selectedCommitChanges, {
               updateReason: 'unchanged'
            });
         });
      });

      describe('__masterMarkedKeyChanged', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should set _selectedSynchronizationId and call __setSynchronization with that id', function() {
            const stub = sandbox.stub(instance, '__setSynchronization');
            instance._selectedSynchronizationId = undefined;
            const id = 1;

            instance.__masterMarkedKeyChanged({}, id);

            assert.equal(instance._selectedSynchronizationId, id);
            assert.isTrue(stub.calledOnceWithExactly(id));
         });
      });

      describe('__detailMarkedKeyChanged', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should set _selectedCommitId and calls __updateSelectedCommitChanges', function() {
            const stub = sandbox.stub(
               instance,
               '__updateSelectedCommitChanges'
            );
            instance._selectedCommitId = undefined;
            const id = 1;

            instance.__detailMarkedKeyChanged({}, id);

            assert.equal(instance._selectedCommitId, id);
            assert.isTrue(stub.calledOnceWithExactly());
         });
      });

      describe('__getElementsBySynchronization', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should throw error', function() {
            assert.throws(
               () => instance.__getElementsBySynchronization('1'),
               "Synchronization with id 1 didn't happen during this profiling session."
            );
         });
         it('should take result from the cache', function() {
            const result = {};
            instance._elementsBySynchronization.set('test', result);

            instance.__getElementsBySynchronization('test');

            assert.equal(
               instance._elementsBySynchronization.get('test'),
               result
            );
         });
         it('should add item', function() {
            const elementsSnapshot = [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: ''
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: ''
               }
            ];
            const changesBySynchronization = new Map([
               ['test', [[3, 2], [1, 3, '3', 0, 2]]]
            ]);
            instance._elementsSnapshot = elementsSnapshot;
            instance._changesBySynchronization = changesBySynchronization;

            instance.__getElementsBySynchronization('test');

            assert.deepEqual(instance._elementsBySynchronization.get('test'), [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: ''
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: ''
               },
               {
                  id: 3,
                  name: '3',
                  parentId: 2,
                  class: 'Elements__node_template',
                  depth: 2
               }
            ]);
            assert.isFalse(instance._changesBySynchronization.has('test'));
            assert.equal(
               instance._destroyedCountBySynchronization.get('test'),
               0
            );
         });
         it('should use cached elements from the previous synchronization', function() {
            const changesBySynchronization = new Map([
               ['test2', [[1, 4, '4', 0, 3]]]
            ]);
            instance._elementsSnapshot = [];
            instance._changesBySynchronization = changesBySynchronization;
            instance._elementsBySynchronization.set('test', [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: ''
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: ''
               },
               {
                  id: 3,
                  name: '3',
                  parentId: 2,
                  class: 'Elements__node_template',
                  depth: 2
               }
            ]);

            instance.__getElementsBySynchronization('test2');

            assert.deepEqual(instance._elementsBySynchronization.get('test2'), [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: ''
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: ''
               },
               {
                  id: 3,
                  name: '3',
                  parentId: 2,
                  class: 'Elements__node_template',
                  depth: 2
               },
               {
                  id: 4,
                  name: '4',
                  parentId: 3,
                  class: 'Elements__node_template',
                  depth: 3
               }
            ]);
            assert.isFalse(instance._changesBySynchronization.has('test2'));
            assert.equal(
               instance._destroyedCountBySynchronization.get('test2'),
               0
            );
         });
         it('should correctly calculate the amount of deleted items', function() {
            const elementsSnapshot = [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: ''
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: ''
               },
               {
                  id: 3,
                  name: '3',
                  depth: 1,
                  parentId: 1,
                  class: ''
               }
            ];
            const changesBySynchronization = new Map([
               ['test', [[0, 2], [0, 3]]]
            ]);
            instance._elementsSnapshot = elementsSnapshot;
            instance._changesBySynchronization = changesBySynchronization;

            instance.__getElementsBySynchronization('test');

            assert.deepEqual(instance._elementsBySynchronization.get('test'), [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: ''
               }
            ]);
            assert.isFalse(instance._changesBySynchronization.has('test'));
            assert.equal(
               instance._destroyedCountBySynchronization.get('test'),
               2
            );
         });
      });

      describe('__onOperation', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should not change _currentOperations', function() {
            const operations = [];
            instance._isProfiling = false;
            instance._currentOperations = operations;

            instance.__onOperation([3, 2]);

            assert.equal(instance._currentOperations.length, 0);
            assert.equal(instance._currentOperations, operations);
         });
         it('should add operation to currentOperations', function() {
            const operation = [3, 2];
            instance._isProfiling = true;
            instance._currentOperations = [];

            instance.__onOperation(operation);

            assert.equal(instance._currentOperations.length, 1);
            assert.equal(instance._currentOperations[0], operation);
         });
      });

      describe('__onEndSynchronization', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should not change _currentOperations and _changesBySynchronization', function() {
            const operations = [];
            instance._isProfiling = false;
            instance._currentOperations = operations;
            const stub = sandbox.stub(
               instance._changesBySynchronization,
               'set'
            );

            instance.__onEndSynchronization('1');

            assert.equal(instance._currentOperations, operations);
            assert.isTrue(stub.notCalled);
         });
         it('should add _currentOperations to _changesBySynchronization and reset them', function() {
            const operations = [[3, 2]];
            instance._isProfiling = true;
            instance._currentOperations = operations;

            instance.__onEndSynchronization('1');

            assert.notEqual(instance._currentOperations, operations);
            assert.equal(instance._currentOperations.length, 0);
            assert.equal(
               instance._changesBySynchronization.get('1'),
               operations
            );
         });
      });

      describe('__toggleProfiling', function() {
         let instance;
         const options = {
            store: {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {}
            }
         };
         beforeEach(function() {
            instance = new Profiler(options);
         });
         it('should fire toggleProfiling event with true as an argument', function() {
            instance.saveOptions(options);
            const stub = sandbox.stub(instance._options.store, 'dispatch');
            instance._isProfiling = false;

            instance.__toggleProfiling();

            assert.isTrue(stub.calledOnceWithExactly('toggleProfiling', true));
         });
         it('should fire toggleProfiling event with false as an argument', function() {
            instance.saveOptions(options);
            const stub = sandbox.stub(instance._options.store, 'dispatch');
            instance._isProfiling = true;

            instance.__toggleProfiling();

            assert.isTrue(stub.calledOnceWithExactly('toggleProfiling', false));
         });
      });

      describe('__onProfilingStatusChanged', function() {
         let instance;
         const options = {
            store: {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {}
            }
         };
         beforeEach(function() {
            instance = new Profiler(options);
         });
         it('should set isProfiling to true and clear everything', function() {
            const elements = [
               {
                  id: 0,
                  name: '0',
                  depth: 0,
                  class: ''
               }
            ];
            instance.saveOptions({
               store: {
                  ...options.store,
                  getElements() {
                     return elements;
                  }
               }
            });
            instance._isProfiling = false;
            // заполняем состояние любыми данными, чтобы можно было точно убедиться, что оно очистилось
            instance._changesBySynchronization.set('1', {});
            instance._elementsBySynchronization.set('1', {});
            instance._snapshotBySynchronization.set('1', {});
            const operations = [];
            instance._currentOperations = operations;
            instance._synchronizations = {};
            instance._snapshot = {};
            instance._selectedCommitChanges = {};
            instance._selectedCommitId = {};
            instance._selectedSynchronizationId = {};
            instance._elementsSnapshot = [];

            instance.__onProfilingStatusChanged(true);

            assert.isTrue(instance._isProfiling);
            assert.equal(instance._changesBySynchronization.size, 0);
            assert.equal(instance._elementsBySynchronization.size, 0);
            assert.equal(instance._snapshotBySynchronization.size, 0);
            assert.notEqual(instance._currentOperations, operations);
            assert.equal(instance._currentOperations.length, 0);
            assert.isUndefined(instance._synchronizations);
            assert.isUndefined(instance._snapshot);
            assert.isUndefined(instance._selectedCommitChanges);
            assert.isUndefined(instance._selectedCommitId);
            assert.equal(instance._selectedSynchronizationId, '');
            assert.deepEqual(instance._elementsSnapshot, elements);
         });

         it('should fire getSynchronizationsList and getProfilingData events', function() {
            instance.saveOptions(options);
            instance._isProfiling = true;
            const stub = sandbox.stub(instance._options.store, 'dispatch');

            instance.__onProfilingStatusChanged(false);

            assert.isFalse(instance._isProfiling);
            assert.isTrue(stub.calledWith('getSynchronizationsList'));
            assert.isTrue(stub.calledWith('getProfilingData'));
         });

         it('should not change _isProfiling and state', function() {
            instance._isProfiling = true;
            Object.seal(instance);

            assert.doesNotThrow(() =>
               instance.__onProfilingStatusChanged(true)
            );
            assert.isTrue(instance._isProfiling);
         });
      });

      describe('__reloadAndProfile', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('reloads window and sets __WASABY_START_PROFILING to true', function() {
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  reload: sandbox.stub()
               }
            });

            instance.__reloadAndProfile();
            assert.isTrue(
               chrome.devtools.inspectedWindow.reload.calledOnceWithExactly({
                  injectedScript: 'this.__WASABY_START_PROFILING = true'
               })
            );
         });
      });

      describe('__onSearchValueChanged', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('calls __updateSearch with the second argument', function() {
            const stub = sandbox.stub(instance, '__updateSearch');

            instance.__onSearchValueChanged({}, 'test');

            assert.isTrue(stub.calledOnceWithExactly('test'));
         });
      });

      describe('__updateSearch', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('should not change _selectedCommitId and __updateSelectedCommitChanges', function() {
            instance._selectedCommitId = 1;
            instance._lastFoundItemIndex = 1;
            instance._searchTotal = 1;
            sandbox.stub(instance._searchController, 'updateSearch').returns({
               index: 0,
               total: 0
            });
            const updateSelectedCommitChangesStub = sandbox.stub(
               instance,
               '__updateSelectedCommitChanges'
            );

            instance.__updateSearch(123);

            assert.isTrue(updateSelectedCommitChangesStub.notCalled);
            assert.equal(instance._selectedCommitId, 1);
            assert.equal(instance._lastFoundItemIndex, 0);
            assert.equal(instance._searchTotal, 0);
         });

         it('should update everything related to search and selected commit changes', function() {
            instance._selectedCommitId = 1;
            sandbox.stub(instance._searchController, 'updateSearch').returns({
               id: 2,
               index: 1,
               total: 2
            });
            const updateSelectedCommitChangesStub = sandbox.stub(
               instance,
               '__updateSelectedCommitChanges'
            );

            instance.__updateSearch(123);

            assert.isTrue(
               updateSelectedCommitChangesStub.calledOnceWithExactly()
            );
            assert.equal(instance._selectedCommitId, 2);
            assert.equal(instance._lastFoundItemIndex, 1);
            assert.equal(instance._searchTotal, 2);
         });
      });

      describe('__onSearchKeydown', function() {
         let instance;
         beforeEach(function() {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('should not change state', function() {
            Object.seal(instance);

            assert.doesNotThrow(() =>
               instance.__onSearchKeydown({
                  nativeEvent: {
                     key: 'Escape'
                  }
               })
            );
         });

         it('should not change _selectedCommitId', function() {
            const getNextItemIdStub = sandbox
               .stub(instance._searchController, 'getNextItemId')
               .returns({
                  index: 0,
                  total: 0
               });
            const updateSelectedCommitChangesStub = sandbox.stub(
               instance,
               '__updateSelectedCommitChanges'
            );
            instance._searchValue = '123';
            instance._selectedCommitId = 1;
            instance._lastFoundItemIndex = 1;
            instance._searchTotal = 1;

            instance.__onSearchKeydown({
               nativeEvent: {
                  key: 'Enter',
                  shiftKey: false
               }
            });

            assert.isTrue(
               getNextItemIdStub.calledOnceWithExactly('123', false)
            );
            assert.equal(instance._selectedCommitId, 1);
            assert.isTrue(updateSelectedCommitChangesStub.notCalled);
            assert.equal(instance._lastFoundItemIndex, 0);
            assert.equal(instance._searchTotal, 0);
         });

         it('should update everything related to search and selected commit changes', function() {
            const getNextItemIdStub = sandbox
               .stub(instance._searchController, 'getNextItemId')
               .returns({
                  id: 2,
                  index: 1,
                  total: 2
               });
            const updateSelectedCommitChangesStub = sandbox.stub(
               instance,
               '__updateSelectedCommitChanges'
            );
            instance._searchValue = '123';
            instance._selectedCommitId = 1;
            instance._lastFoundItemIndex = 1;
            instance._searchTotal = 1;

            instance.__onSearchKeydown({
               nativeEvent: {
                  key: 'Enter',
                  shiftKey: false
               }
            });

            assert.isTrue(
               getNextItemIdStub.calledOnceWithExactly('123', false)
            );
            assert.equal(instance._selectedCommitId, 2);
            assert.isTrue(
               updateSelectedCommitChangesStub.calledOnceWithExactly()
            );
            assert.equal(instance._lastFoundItemIndex, 1);
            assert.equal(instance._searchTotal, 2);
         });
      });
   });
});
