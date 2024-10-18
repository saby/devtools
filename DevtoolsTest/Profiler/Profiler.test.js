define([
   'DevtoolsTest/mockChrome',
   'Profiler/_Profiler/Profiler',
   'Controls/popup',
   'File/ResourceGetter/fileSystem',
   'injection/const',
   'DevtoolsTest/getJSDOM'
], function (mockChrome, Profiler, popupLib, fileSystem, iConstants, getJSDOM) {
   let sandbox;
   Profiler = Profiler.default;
   const needJSDOM = typeof window === 'undefined';

   describe('Profiler/_Profiler/Profiler', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
            global.document = dom.window.document;
            global.URL = dom.window.URL;
            global.Blob = dom.window.Blob;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.window;
            delete global.document;
            delete global.URL;
            delete global.Blob;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('constructor', function () {
         it('should subscribe to all necessary events', function () {
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
         it('should call toggleDevtoolsOpened', function () {
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
         it('should dispatch getProfilingStatus event', function () {
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

      describe('_beforeUpdate', function () {
         it("should not call __setSelectedCommitId because the tab isn't selected", function () {
            const store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {}
            };
            const options = {
               store,
               selected: false
            };
            const instance = new Profiler(options);
            sandbox.stub(instance, '__setSelectedCommitId');

            instance._beforeUpdate(options);

            sinon.assert.notCalled(instance.__setSelectedCommitId);
         });

         it("should not call __setSelectedCommitId because the store doesn't have a selectedId", function () {
            const store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               getSelectedId() {}
            };
            const options = {
               store,
               selected: true
            };
            const instance = new Profiler(options);
            sandbox.stub(instance, '__setSelectedCommitId');

            instance._beforeUpdate(options);

            sinon.assert.notCalled(instance.__setSelectedCommitId);
         });

         it("should not call __setSelectedCommitId because there's no snapshot", function () {
            const store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               getSelectedId() {
                  return 1;
               }
            };
            const options = {
               store,
               selected: true
            };
            const instance = new Profiler(options);
            sandbox.stub(instance, '__setSelectedCommitId');

            instance._beforeUpdate(options);

            sinon.assert.notCalled(instance.__setSelectedCommitId);
         });

         it("should not call __setSelectedCommitId because the snapshot doesn't have an item with the id from the store", function () {
            const store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               getSelectedId() {
                  return 1;
               }
            };
            const options = {
               store,
               selected: true
            };
            const instance = new Profiler(options);
            instance._snapshot = [
               {
                  id: 0
               }
            ];
            sandbox.stub(instance, '__setSelectedCommitId');

            instance._beforeUpdate(options);

            sinon.assert.notCalled(instance.__setSelectedCommitId);
         });

         it('should call __setSelectedCommitId', function () {
            const store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               getSelectedId() {
                  return 1;
               }
            };
            const options = {
               store,
               selected: true
            };
            const instance = new Profiler(options);
            instance._snapshot = [
               {
                  id: 1
               }
            ];
            sandbox.stub(instance, '__setSelectedCommitId');

            instance._beforeUpdate(options);

            sinon.assert.calledWithExactly(instance.__setSelectedCommitId, 1);
         });
      });

      it('_masterFilter', function () {
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

      describe('__setProfilingData', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should correctly transform profiling data to a list of synchronizations', function () {
            const initialIdToDuration = [
               [1, 10],
               [2, 15]
            ];
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
            sandbox.stub(instance, '__setSynchronization');
            instance._changesBySynchronization = new Map([
               ['test', []],
               ['test2', []]
            ]);
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
            sinon.assert.calledWithExactly(
               instance.__setSynchronization,
               'test'
            );
         });

         it('should correctly transform empty profiling data to a list of synchronizations', function () {
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

      describe('__setSynchronization', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should correctly calculate snapshot of the synchronization', function () {
            const profilingData = {
               initialIdToDuration: new Map([
                  [1, 10],
                  [2, 15],
                  [5, 2],
                  [6, 3]
               ]),
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
                                 lifecycleDuration: 3,
                                 updateReason: 'forceUpdated'
                              }
                           ],
                           [
                              2,
                              {
                                 selfDuration: 7,
                                 lifecycleDuration: 4,
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
                                 lifecycleDuration: 1,
                                 updateReason: 'forceUpdated',
                                 domChanged: true,
                                 isVisible: true,
                                 unusedReceivedState: true,
                                 asyncControl: true
                              }
                           ],
                           [
                              2,
                              {
                                 selfDuration: 7,
                                 lifecycleDuration: 1.1,
                                 updateReason: 'parentUpdated',
                                 domChanged: false,
                                 isVisible: true
                              }
                           ],
                           [
                              3,
                              {
                                 selfDuration: 10,
                                 updateReason: 'mounted',
                                 domChanged: true,
                                 isVisible: false
                              }
                           ],
                           [
                              4,
                              {
                                 selfDuration: 15,
                                 updateReason: 'mounted',
                                 domChanged: true,
                                 isVisible: true
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
                  logicParentId: 1,
                  class: ''
               },
               {
                  id: 5,
                  name: '5',
                  depth: 2,
                  parentId: 2,
                  logicParentId: 1,
                  class: ''
               },
               {
                  id: 6,
                  name: '6',
                  depth: 2,
                  parentId: 2,
                  logicParentId: 2,
                  class: ''
               }
            ];
            const changesBySynchronization = new Map([
               [
                  'test',
                  [
                     [3, 1],
                     [3, 2]
                  ]
               ],
               [
                  'test2',
                  [
                     [3, 1],
                     [3, 2],
                     [1, 3, '3', 0, 1, 1],
                     [1, 4, '4', 0, 1, 1]
                  ]
               ]
            ]);
            instance._profilingData = profilingData;
            instance._synchronizations = synchronizations;
            instance._elementsSnapshot = elementsSnapshot;
            instance._changesBySynchronization = changesBySynchronization;
            sandbox.stub(instance, '__updateSelectedCommitChanges');
            sandbox.stub(instance, '__updateSearch');

            instance.__setSynchronization('test2');

            const expectedSnapshot = [
               {
                  id: 1,
                  name: '1',
                  depth: 0,
                  class: '',
                  updateReason: 'forceUpdated',
                  selfDuration: 5,
                  actualBaseDuration: 42,
                  actualDuration: 37,
                  lifecycleDuration: 1,
                  warnings: [
                     'unusedReceivedState',
                     'asyncControl',
                     'manualForceUpdate'
                  ],
                  hasChangesInSubtree: true
               },
               {
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  logicParentId: 1,
                  class: '',
                  updateReason: 'parentUpdated',
                  selfDuration: 7,
                  actualBaseDuration: 12,
                  actualDuration: 7,
                  lifecycleDuration: 1.1,
                  warnings: ['domUnchanged'],
                  hasChangesInSubtree: true
               },
               {
                  id: 5,
                  name: '5',
                  depth: 2,
                  parentId: 2,
                  logicParentId: 1,
                  class: '',
                  updateReason: 'unchanged',
                  selfDuration: 2,
                  actualBaseDuration: 2,
                  actualDuration: 0,
                  lifecycleDuration: 0,
                  warnings: undefined,
                  hasChangesInSubtree: false
               },
               {
                  id: 6,
                  name: '6',
                  depth: 2,
                  parentId: 2,
                  logicParentId: 2,
                  class: '',
                  updateReason: 'unchanged',
                  selfDuration: 3,
                  actualBaseDuration: 3,
                  actualDuration: 0,
                  lifecycleDuration: 0,
                  warnings: undefined,
                  hasChangesInSubtree: false
               },
               {
                  id: 3,
                  name: '3',
                  depth: 1,
                  parentId: 1,
                  logicParentId: 1,
                  class: 'devtools-Elements__node_template',
                  updateReason: 'mounted',
                  selfDuration: 10,
                  actualBaseDuration: 10,
                  actualDuration: 10,
                  lifecycleDuration: undefined,
                  warnings: ['invisible'],
                  hasChangesInSubtree: true
               },
               {
                  id: 4,
                  name: '4',
                  depth: 1,
                  parentId: 1,
                  logicParentId: 1,
                  class: 'devtools-Elements__node_template',
                  updateReason: 'mounted',
                  selfDuration: 15,
                  actualBaseDuration: 15,
                  actualDuration: 15,
                  lifecycleDuration: undefined,
                  warnings: undefined,
                  hasChangesInSubtree: true
               }
            ];
            assert.deepEqual(instance._snapshot, expectedSnapshot);
            assert.deepEqual(
               instance._snapshotBySynchronization.get('test2'),
               expectedSnapshot
            );
            assert.deepEqual(instance._synchronizationOverview, {
               mountedCount: 2,
               selfUpdatedCount: 0,
               parentUpdatedCount: 1,
               unchangedCount: 2,
               forceUpdatedCount: 1,
               destroyedCount: 0
            });
            sinon.assert.calledOnce(instance.__updateSelectedCommitChanges);
            sinon.assert.calledWithExactly(
               instance.__updateSelectedCommitChanges
            );
            sinon.assert.calledOnce(instance.__updateSearch);
            sinon.assert.calledWithExactly(instance.__updateSearch, '');
         });

         it('should take snapshot of the synchronization from the cache and not call __getElementsBySynchronization', function () {
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

      describe('__updateSelectedCommitChanges', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should set _selectedCommitChanges to undefined because there is no selected commit', function () {
            instance._selectedCommitId = undefined;
            instance._selectedCommitChanges = {
               updateReason: 'unchanged'
            };
            instance._logicParentId = 2;
            instance._logicParentName = 'Test';

            instance.__updateSelectedCommitChanges();

            assert.isUndefined(instance._selectedCommitChanges);
            assert.isUndefined(instance._logicParentId);
            assert.equal(instance._logicParentName, '');
         });

         it('should find the correct changesDescription', function () {
            const changesDescription = {
               updateReason: 'mounted',
               changedOptions: ['value', 'iconSize'],
               changedAttributes: ['class', 'style'],
               changedReactiveProps: ['_selectedKeys, _listViewModel'],
               warnings: undefined
            };
            instance._profilingData = {
               initialIdToDuration: new Map(),
               synchronizationKeyToDescription: new Map([
                  [
                     'test1',
                     {
                        selfDuration: 10,
                        changes: new Map([[2, changesDescription]])
                     }
                  ]
               ])
            };
            instance._selectedSynchronizationId = 'test1';
            instance._selectedCommitId = 2;
            instance._snapshot = [
               {
                  id: 0,
                  name: 'LogicParent'
               },
               {
                  id: 1,
                  name: 'Parent',
                  parentId: 0,
                  logicParentId: 0
               },
               {
                  id: 2,
                  name: 'Child',
                  parentId: 1,
                  logicParentId: 0
               }
            ];
            sandbox
               .stub(instance, '__getWarnings')
               .withArgs({
                  id: 2,
                  name: 'Child',
                  parentId: 1,
                  logicParentId: 0,
                  warnings: undefined
               })
               .returns(undefined);

            instance.__updateSelectedCommitChanges();

            assert.deepEqual(
               instance._selectedCommitChanges,
               changesDescription
            );
            assert.equal(instance._logicParentId, 0);
            assert.equal(instance._logicParentName, 'LogicParent');
         });

         it('should find the correct changesDescription and correct warnings', function () {
            const changesDescription = {
               updateReason: 'mounted',
               changedOptions: ['value', 'iconSize'],
               changedAttributes: ['class', 'style'],
               changedReactiveProps: undefined,
               warnings: ['domUnchanged']
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
            instance._snapshot = [
               {
                  id: 0,
                  name: 'LogicParent'
               },
               {
                  id: 1,
                  name: 'Parent',
                  parentId: 0,
                  logicParentId: 0
               }
            ];
            instance._selectedSynchronizationId = 'test1';
            instance._selectedCommitId = 1;
            sandbox
               .stub(instance, '__getWarnings')
               .withArgs({
                  id: 1,
                  name: 'Parent',
                  parentId: 0,
                  logicParentId: 0
               })
               .returns(['domUnchanged']);

            instance.__updateSelectedCommitChanges();

            assert.deepEqual(
               instance._selectedCommitChanges,
               changesDescription
            );
            assert.isUndefined(instance._logicParentId);
            assert.equal(instance._logicParentName, '');
         });

         it("should set update reason as unchanged because there're no changes for the selected commit", function () {
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
            instance._snapshot = [
               {
                  id: 0,
                  name: 'LogicParent'
               },
               {
                  id: 1,
                  name: 'Parent',
                  parentId: 0,
                  logicParentId: 0
               }
            ];

            instance.__updateSelectedCommitChanges();

            assert.deepEqual(instance._selectedCommitChanges, {
               updateReason: 'unchanged'
            });
            assert.isUndefined(instance._logicParentId);
            assert.equal(instance._logicParentName, '');
         });
      });

      describe('__getWarnings', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('should return undefined because there is no item', function () {
            assert.isUndefined(instance.__getWarnings());
         });

         it('should return undefined because selected commit does not contain warnings', function () {
            assert.isUndefined(
               instance.__getWarnings({
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: '',
                  warnings: undefined
               })
            );
         });

         it('should return warnings', function () {
            assert.deepEqual(
               instance.__getWarnings({
                  id: 2,
                  name: '2',
                  depth: 1,
                  parentId: 1,
                  class: '',
                  warnings: ['domUnchanged']
               }),
               [
                  {
                     caption: 'Needless synchronization',
                     template: 'Profiler/profiler:domUnchanged'
                  }
               ]
            );
         });
      });

      describe('_masterMarkedKeyChanged', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should set _selectedSynchronizationId and call __setSynchronization with that id', function () {
            sandbox.stub(instance, '__setSynchronization');
            instance._selectedSynchronizationId = undefined;
            instance._synchronizations = [
               {
                  id: 0
               },
               {
                  id: 1
               }
            ];
            const id = 1;

            instance._masterMarkedKeyChanged({}, id);

            sinon.assert.calledWithExactly(instance.__setSynchronization, id);
         });

         it('should not call __setSynchronization because synchronization with this id does not exist', function () {
            sandbox.stub(instance, '__setSynchronization');
            instance._selectedSynchronizationId = undefined;
            instance._synchronizations = [
               {
                  id: 0
               },
               {
                  id: 2
               }
            ];
            const id = 1;

            instance._masterMarkedKeyChanged({}, id);

            assert.isUndefined(instance._selectedSynchronizationId);
            sinon.assert.notCalled(instance.__setSynchronization);
         });
      });

      describe('_detailMarkedKeyChanged', function () {
         let instance;
         let store;
         beforeEach(function () {
            store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               setSelectedId() {}
            };
            instance = new Profiler({
               store
            });
            instance.saveOptions({
               store
            });
         });
         it('should call __setSelectedCommitId and calls __updateSelectedCommitChanges', function () {
            sandbox.stub(instance, '__updateSelectedCommitChanges');
            sandbox.stub(instance._options.store, 'setSelectedId');
            instance._selectedCommitId = undefined;
            const id = 1;

            instance._detailMarkedKeyChanged({}, id);

            assert.equal(instance._selectedCommitId, id);
            sinon.assert.calledWithExactly(
               instance.__updateSelectedCommitChanges
            );
            sinon.assert.calledWithExactly(
               instance._options.store.setSelectedId,
               id
            );
         });
      });

      describe('_logicParentHoverChanged', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('should set instance._logicParentHovered to the passed state', function () {
            instance._logicParentHovered = false;

            instance._logicParentHoverChanged({}, false);
            assert.isFalse(instance._logicParentHovered);

            instance._logicParentHoverChanged({}, true);
            assert.isTrue(instance._logicParentHovered);

            instance._logicParentHoverChanged({}, false);
            assert.isFalse(instance._logicParentHovered);
         });
      });

      describe('__getElementsBySynchronization', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should throw error', function () {
            assert.throws(
               () => instance.__getElementsBySynchronization('1'),
               "Synchronization with id 1 didn't happen during this profiling session."
            );
         });
         it('should take result from the cache', function () {
            const result = {};
            instance._elementsBySynchronization.set('test', result);

            instance.__getElementsBySynchronization('test');

            assert.equal(
               instance._elementsBySynchronization.get('test'),
               result
            );
         });
         it('should add item', function () {
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
                  logicParentId: 1,
                  class: ''
               }
            ];
            const changesBySynchronization = new Map([
               [
                  'test',
                  [
                     [3, 2],
                     [1, 3, '3', 0, 2, 2]
                  ]
               ]
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
                  logicParentId: 1,
                  class: ''
               },
               {
                  id: 3,
                  name: '3',
                  parentId: 2,
                  logicParentId: 2,
                  class: 'devtools-Elements__node_template',
                  depth: 2
               }
            ]);
            assert.isFalse(instance._changesBySynchronization.has('test'));
            assert.equal(
               instance._destroyedCountBySynchronization.get('test'),
               0
            );
         });
         it('should use cached elements from the previous synchronization', function () {
            const changesBySynchronization = new Map([
               ['test2', [[1, 4, '4', 0, 3, 2]]]
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
                  logicParentId: 1,
                  class: ''
               },
               {
                  id: 3,
                  name: '3',
                  parentId: 2,
                  logicParentId: 2,
                  class: 'devtools-Elements__node_template',
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
                  logicParentId: 1,
                  class: ''
               },
               {
                  id: 3,
                  name: '3',
                  parentId: 2,
                  logicParentId: 2,
                  class: 'devtools-Elements__node_template',
                  depth: 2
               },
               {
                  id: 4,
                  name: '4',
                  parentId: 3,
                  logicParentId: 2,
                  class: 'devtools-Elements__node_template',
                  depth: 3
               }
            ]);
            assert.isFalse(instance._changesBySynchronization.has('test2'));
            assert.equal(
               instance._destroyedCountBySynchronization.get('test2'),
               0
            );
         });
         it('should correctly calculate the amount of deleted items', function () {
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
               [
                  'test',
                  [
                     [0, 2],
                     [0, 3]
                  ]
               ]
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

      describe('__onOperation', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should not change _currentOperations', function () {
            const operations = [];
            instance._isProfiling = false;
            instance._currentOperations = operations;

            instance.__onOperation([3, 2]);

            assert.equal(instance._currentOperations.length, 0);
            assert.equal(instance._currentOperations, operations);
         });
         it('should add operation to currentOperations', function () {
            const operation = [3, 2];
            instance._isProfiling = true;
            instance._currentOperations = [];

            instance.__onOperation(operation);

            assert.equal(instance._currentOperations.length, 1);
            assert.equal(instance._currentOperations[0], operation);
         });
      });

      describe('__onEndSynchronization', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });
         it('should not change _currentOperations and _changesBySynchronization', function () {
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
         it('should add _currentOperations to _changesBySynchronization and reset them', function () {
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

      describe('_toggleProfiling', function () {
         let instance;
         const options = {
            store: {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {}
            }
         };
         beforeEach(function () {
            instance = new Profiler(options);
         });
         it('should fire toggleProfiling event with true as an argument', function () {
            instance.saveOptions(options);
            const stub = sandbox.stub(instance._options.store, 'dispatch');
            instance._isProfiling = false;

            instance._toggleProfiling();

            assert.isTrue(stub.calledOnceWithExactly('toggleProfiling', true));
         });
         it('should fire toggleProfiling event with false as an argument', function () {
            instance.saveOptions(options);
            const stub = sandbox.stub(instance._options.store, 'dispatch');
            instance._isProfiling = true;

            instance._toggleProfiling();

            assert.isTrue(stub.calledOnceWithExactly('toggleProfiling', false));
         });
      });

      describe('__onProfilingStatusChanged', function () {
         let instance;
         const options = {
            store: {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {}
            }
         };
         beforeEach(function () {
            instance = new Profiler(options);
         });
         it('should set isProfiling to true and clear everything', function () {
            sandbox.stub(instance, 'resetState');
            instance._isProfiling = false;

            instance.__onProfilingStatusChanged(true);

            assert.isTrue(instance._isProfiling);
            sinon.assert.calledWithExactly(instance.resetState);
         });

         it('should fire getProfilingData event when profiling ends', function () {
            instance.saveOptions(options);
            instance._isProfiling = true;
            sandbox.stub(instance._options.store, 'dispatch');

            instance.__onProfilingStatusChanged(false);

            assert.isFalse(instance._isProfiling);
            sinon.assert.calledWith(
               instance._options.store.dispatch,
               'getProfilingData'
            );
         });

         it('should not change _isProfiling and state', function () {
            instance._isProfiling = true;
            Object.seal(instance);

            assert.doesNotThrow(() =>
               instance.__onProfilingStatusChanged(true)
            );
            assert.isTrue(instance._isProfiling);
         });
      });

      describe('_reloadAndProfile', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('reloads window and sets __WASABY_START_PROFILING to true', function () {
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  reload: sandbox.stub()
               }
            });

            instance._reloadAndProfile();
            assert.isTrue(
               chrome.devtools.inspectedWindow.reload.calledOnceWithExactly({
                  injectedScript: 'this.__WASABY_START_PROFILING = true'
               })
            );
         });
      });

      describe('_onSearchValueChanged', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('calls __updateSearch with the second argument', function () {
            const stub = sandbox.stub(instance, '__updateSearch');

            instance._onSearchValueChanged({}, 'test');

            assert.isTrue(stub.calledOnceWithExactly('test'));
         });
      });

      describe('__updateSearch', function () {
         let instance;
         let store;
         beforeEach(function () {
            store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               setSelectedId() {}
            };
            instance = new Profiler({
               store
            });
            instance.saveOptions({
               store
            });
         });

         it('should not change _selectedCommitId and __updateSelectedCommitChanges', function () {
            instance._selectedCommitId = 1;
            instance._lastFoundItemIndex = 1;
            instance._searchTotal = 1;
            sandbox.stub(instance._searchController, 'updateSearch').returns({
               index: 0,
               total: 0
            });
            sandbox.stub(instance, '__updateSelectedCommitChanges');

            instance.__updateSearch(123);

            sinon.assert.notCalled(instance.__updateSelectedCommitChanges);
            assert.equal(instance._selectedCommitId, 1);
            assert.equal(instance._lastFoundItemIndex, 0);
            assert.equal(instance._searchTotal, 0);
         });

         it('should update everything related to search and selected commit changes', function () {
            instance._selectedCommitId = 1;
            sandbox.stub(instance._searchController, 'updateSearch').returns({
               id: 2,
               index: 1,
               total: 2
            });
            sandbox.stub(instance, '__updateSelectedCommitChanges');
            sandbox.stub(instance._options.store, 'setSelectedId');

            instance.__updateSearch(123);

            sinon.assert.calledWithExactly(
               instance.__updateSelectedCommitChanges
            );
            sinon.assert.calledWithExactly(
               instance._options.store.setSelectedId,
               2
            );
            assert.equal(instance._selectedCommitId, 2);
            assert.equal(instance._lastFoundItemIndex, 1);
            assert.equal(instance._searchTotal, 2);
         });
      });

      describe('_onSearchKeydown', function () {
         let instance;
         let store;
         beforeEach(function () {
            store = {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               setSelectedId() {}
            };
            instance = new Profiler({
               store
            });
            instance.saveOptions({
               store
            });
         });

         it('should not change state', function () {
            Object.seal(instance);

            assert.doesNotThrow(() =>
               instance._onSearchKeydown({
                  nativeEvent: {
                     key: 'Escape'
                  }
               })
            );
         });

         it('should not change _selectedCommitId', function () {
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

            instance._onSearchKeydown({
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

         it('should update everything related to search and selected commit changes', function () {
            sandbox
               .stub(instance._searchController, 'getNextItemId')
               .withArgs('123', false)
               .returns({
                  id: 2,
                  index: 1,
                  total: 2
               });
            sandbox.stub(instance, '__updateSelectedCommitChanges');
            instance._searchValue = '123';
            instance._selectedCommitId = 1;
            instance._lastFoundItemIndex = 1;
            instance._searchTotal = 1;

            instance._onSearchKeydown({
               nativeEvent: {
                  key: 'Enter',
                  shiftKey: false
               }
            });

            assert.equal(instance._selectedCommitId, 2);
            sinon.assert.calledWithExactly(
               instance.__updateSelectedCommitChanges
            );
            assert.equal(instance._lastFoundItemIndex, 1);
            assert.equal(instance._searchTotal, 2);
         });
      });

      describe('_exportToJSON', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('should stringify url', function () {
            const fakeA = {
               click: sandbox.stub()
            };
            const createElementStub = sandbox.stub(document, 'createElement');
            createElementStub.withArgs('a').returns(fakeA);
            const expectedBlob = {
               size: 833,
               type: 'application/json'
            };
            sandbox
               .stub(iConstants.GLOBAL, 'Blob')
               .withArgs(
                  [
                     '{"syncList":[["0",{"selfDuration":483.46999334171414,"changes":[[1,{"updateReason":"selfUpdated","selfDuration":1.509999856352806,"domChanged":false,"isVisible":true,"unusedReceivedState":false}]]}],["1",{"selfDuration":45.900002121925354,"changes":[[1,{"updateReason":"destroyed","selfDuration":1.509999856352806,"domChanged":false,"isVisible":true,"unusedReceivedState":false}]]}]],"snapshotBySynchronization":[["0",[{"id":0,"name":"UI/Base:Document","class":"Elements__node_control","depth":0,"selfDuration":2.754999790340662,"updateReason":"unchanged","actualBaseDuration":1297.724994365126,"actualDuration":481.6599925979972,"hasChangesInSubtree":true},{"id":1,"name":"OnlineSbisRu/Index","parentId":0,"class":"Elements__node_control","depth":1,"selfDuration":1.509999856352806,"updateReason":"selfUpdated","actualBaseDuration":1294.9699945747852,"actualDuration":481.6599925979972,"hasChangesInSubtree":true}]],["1",[{"id":0,"name":"UI/Base:Document","class":"Elements__node_control","depth":0,"selfDuration":2.754999790340662,"updateReason":"unchanged","actualBaseDuration":1131.8599968217313,"actualDuration":0,"hasChangesInSubtree":true}]]],"destroyedCountBySynchronization":[["0",0],["1",1]]}'
                  ],
                  {
                     type: 'application/json'
                  }
               )
               .returns(expectedBlob);
            const expectedURL =
               'blob:http://localhost/97b7314d-2889-474d-ad2a-a9421bf25aa8';
            if (typeof window.URL.createObjectURL === 'undefined') {
               window.URL.createObjectURL = () => {};
            }
            sandbox
               .stub(URL, 'createObjectURL')
               .withArgs(expectedBlob)
               .returns(expectedURL);
            instance._synchronizations = [
               {
                  id: '0'
               },
               {
                  id: '1'
               }
            ];
            const synchronizationKeyToDescription = new Map();
            synchronizationKeyToDescription.set('0', {
               selfDuration: 483.46999334171414,
               changes: new Map([
                  [
                     1,
                     {
                        updateReason: 'selfUpdated',
                        selfDuration: 1.509999856352806,
                        domChanged: false,
                        isVisible: true,
                        unusedReceivedState: false
                     }
                  ]
               ])
            });
            synchronizationKeyToDescription.set('1', {
               selfDuration: 45.900002121925354,
               changes: new Map([
                  [
                     1,
                     {
                        updateReason: 'destroyed',
                        selfDuration: 1.509999856352806,
                        domChanged: false,
                        isVisible: true,
                        unusedReceivedState: false
                     }
                  ]
               ])
            });
            instance._profilingData = {
               synchronizationKeyToDescription,
               initialIdToDuration: new Map()
            };
            const snapshotBySynchronization = new Map();
            snapshotBySynchronization.set('0', [
               {
                  id: 0,
                  name: 'UI/Base:Document',
                  class: 'Elements__node_control',
                  depth: 0,
                  selfDuration: 2.754999790340662,
                  updateReason: 'unchanged',
                  actualBaseDuration: 1297.724994365126,
                  actualDuration: 481.6599925979972,
                  hasChangesInSubtree: true
               },
               {
                  id: 1,
                  name: 'OnlineSbisRu/Index',
                  parentId: 0,
                  class: 'Elements__node_control',
                  depth: 1,
                  selfDuration: 1.509999856352806,
                  updateReason: 'selfUpdated',
                  actualBaseDuration: 1294.9699945747852,
                  actualDuration: 481.6599925979972,
                  hasChangesInSubtree: true
               }
            ]);
            snapshotBySynchronization.set('1', [
               {
                  id: 0,
                  name: 'UI/Base:Document',
                  class: 'Elements__node_control',
                  depth: 0,
                  selfDuration: 2.754999790340662,
                  updateReason: 'unchanged',
                  actualBaseDuration: 1131.8599968217313,
                  actualDuration: 0,
                  hasChangesInSubtree: true
               }
            ]);
            instance._snapshotBySynchronization = snapshotBySynchronization;
            const destroyedCountBySynchronization = new Map();
            destroyedCountBySynchronization.set('0', 0);
            destroyedCountBySynchronization.set('1', 1);
            instance._destroyedCountBySynchronization = destroyedCountBySynchronization;
            const clock = sinon.useFakeTimers();
            const expectedDate = new Date()
               .toISOString()
               .replace(/[-Z:.]/g, '')
               .slice(0, -3);
            // setup end

            instance._exportToJSON();

            assert.equal(fakeA.href, expectedURL);
            assert.equal(fakeA.download, `WasabyProfile-${expectedDate}.json`);
            sinon.assert.calledOnce(fakeA.click);

            // cleanup
            clock.restore();
            createElementStub.restore();
         });
      });

      describe('_importFromJSON', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('should not reset state when no files were chosen', async function () {
            const fakeGetter = {
               getFiles: sandbox.stub().resolves()
            };
            sandbox.stub(fileSystem, 'Getter').returns(fakeGetter);
            sandbox.stub(instance, 'resetState');
            // setup end

            await instance._importFromJSON();

            sinon.assert.calledWithNew(fileSystem.Getter);
            sinon.assert.calledWithExactly(fileSystem.Getter, {
               multiSelect: false,
               extensions: ['json']
            });
            sinon.assert.notCalled(instance.resetState);
         });

         it('should show error message and not reset state when wrong files were selected', async function () {
            const fakeGetter = {
               getFiles: sandbox.stub().resolves([
                  {
                     message: 'test message'
                  }
               ])
            };
            sandbox.stub(fileSystem, 'Getter').returns(fakeGetter);
            sandbox.stub(instance, 'resetState');
            sandbox.stub(popupLib.Confirmation, 'openPopup');
            // setup end

            await instance._importFromJSON();

            sinon.assert.calledWithNew(fileSystem.Getter);
            sinon.assert.calledWithExactly(fileSystem.Getter, {
               multiSelect: false,
               extensions: ['json']
            });
            sinon.assert.calledWithExactly(popupLib.Confirmation.openPopup, {
               type: 'ok',
               style: 'danger',
               details: 'Incorrect profile format.'
            });
            sinon.assert.notCalled(instance.resetState);
         });

         describe('should show error message and not reset state when an incorrect profile was passed', function () {
            const incorrectProfiles = [
               {
                  syncList: []
               },
               {
                  snapshotBySynchronization: []
               },
               {
                  destroyedCountBySynchronization: []
               },
               {
                  syncList: [],
                  snapshotBySynchronization: []
               },
               {
                  syncList: [],
                  destroyedCountBySynchronization: []
               },
               {
                  snapshotBySynchronization: [],
                  destroyedCountBySynchronization: []
               }
            ];

            incorrectProfiles.forEach((profile, index) => {
               it(`incorrect profile index: ${index}`, async function () {
                  const fakeGetter = {
                     getFiles: sandbox.stub().resolves([
                        {
                           getData: sandbox
                              .stub()
                              .returns(JSON.stringify(profile))
                        }
                     ])
                  };
                  sandbox.stub(fileSystem, 'Getter').returns(fakeGetter);
                  sandbox.stub(instance, 'resetState');
                  sandbox.stub(popupLib.Confirmation, 'openPopup');
                  // setup end

                  await instance._importFromJSON();

                  sinon.assert.calledWithNew(fileSystem.Getter);
                  sinon.assert.calledWithExactly(fileSystem.Getter, {
                     multiSelect: false,
                     extensions: ['json']
                  });
                  sinon.assert.calledWithExactly(
                     popupLib.Confirmation.openPopup,
                     {
                        type: 'ok',
                        style: 'danger',
                        details: 'Incorrect profile format.'
                     }
                  );
                  sinon.assert.notCalled(instance.resetState);
               });
            });
         });

         it('should show error message and not reset state when an error occurs during profile parsing', async function () {
            const fakeGetter = {
               getFiles: sandbox.stub().resolves([
                  {
                     getData: sandbox.stub().returns({})
                  }
               ])
            };
            sandbox.stub(fileSystem, 'Getter').returns(fakeGetter);
            sandbox.stub(instance, 'resetState');
            sandbox.stub(popupLib.Confirmation, 'openPopup');
            // setup end

            await instance._importFromJSON();

            sinon.assert.calledWithNew(fileSystem.Getter);
            sinon.assert.calledWithExactly(fileSystem.Getter, {
               multiSelect: false,
               extensions: ['json']
            });
            sinon.assert.calledWithExactly(popupLib.Confirmation.openPopup, {
               type: 'ok',
               style: 'danger',
               details: 'Incorrect profile format.'
            });
            sinon.assert.notCalled(instance.resetState);
         });

         it('should apply imported profile', async function () {
            const fakeGetter = {
               getFiles: sandbox.stub().resolves([
                  {
                     getData: sandbox
                        .stub()
                        .returns(
                           '{"syncList":[["0",{"selfDuration":483.46999334171414,"changes":[[1,{"updateReason":"selfUpdated","selfDuration":1.509999856352806,"domChanged":false,"isVisible":true,"unusedReceivedState":false}]]}],["1",{"selfDuration":45.900002121925354,"changes":[[1,{"updateReason":"destroyed","selfDuration":1.509999856352806,"domChanged":false,"isVisible":true,"unusedReceivedState":false}]]}]],"snapshotBySynchronization":[["0",[{"id":0,"name":"UI/Base:Document","class":"Elements__node_control","depth":0,"selfDuration":2.754999790340662,"updateReason":"unchanged","actualBaseDuration":1297.724994365126,"actualDuration":481.6599925979972,"hasChangesInSubtree":true},{"id":1,"name":"OnlineSbisRu/Index","parentId":0,"class":"Elements__node_control","depth":1,"selfDuration":1.509999856352806,"updateReason":"selfUpdated","actualBaseDuration":1294.9699945747852,"actualDuration":481.6599925979972,"hasChangesInSubtree":true}]],["1",[{"id":0,"name":"UI/Base:Document","class":"Elements__node_control","depth":0,"selfDuration":2.754999790340662,"updateReason":"unchanged","actualBaseDuration":1131.8599968217313,"actualDuration":0,"hasChangesInSubtree":true}]]],"destroyedCountBySynchronization":[["0",0],["1",1]]}'
                        )
                  }
               ])
            };
            sandbox.stub(fileSystem, 'Getter').returns(fakeGetter);
            sandbox.stub(instance, 'resetState');
            sandbox.stub(popupLib.Confirmation, 'openPopup');
            // setup end

            await instance._importFromJSON();

            sinon.assert.calledWithNew(fileSystem.Getter);
            sinon.assert.calledWithExactly(fileSystem.Getter, {
               multiSelect: false,
               extensions: ['json']
            });
            sinon.assert.notCalled(popupLib.Confirmation.openPopup);
            sinon.assert.calledOnce(instance.resetState);
            assert.deepEqual(
               instance._snapshotBySynchronization,
               new Map([
                  [
                     '0',
                     [
                        {
                           id: 0,
                           name: 'UI/Base:Document',
                           class: 'Elements__node_control',
                           depth: 0,
                           selfDuration: 2.754999790340662,
                           updateReason: 'unchanged',
                           actualBaseDuration: 1297.724994365126,
                           actualDuration: 481.6599925979972,
                           hasChangesInSubtree: true
                        },
                        {
                           id: 1,
                           name: 'OnlineSbisRu/Index',
                           parentId: 0,
                           class: 'Elements__node_control',
                           depth: 1,
                           selfDuration: 1.509999856352806,
                           updateReason: 'selfUpdated',
                           actualBaseDuration: 1294.9699945747852,
                           actualDuration: 481.6599925979972,
                           hasChangesInSubtree: true
                        }
                     ]
                  ],
                  [
                     '1',
                     [
                        {
                           id: 0,
                           name: 'UI/Base:Document',
                           class: 'Elements__node_control',
                           depth: 0,
                           selfDuration: 2.754999790340662,
                           updateReason: 'unchanged',
                           actualBaseDuration: 1131.8599968217313,
                           actualDuration: 0,
                           hasChangesInSubtree: true
                        }
                     ]
                  ]
               ])
            );
            assert.deepEqual(
               instance._destroyedCountBySynchronization,
               new Map([
                  ['0', 0],
                  ['1', 1]
               ])
            );
            assert.isTrue(instance._didProfile);
            assert.deepEqual(instance._profilingData, {
               initialIdToDuration: new Map(),
               synchronizationKeyToDescription: new Map([
                  [
                     '0',
                     {
                        selfDuration: 483.46999334171414,
                        changes: new Map([
                           [
                              1,
                              {
                                 updateReason: 'selfUpdated',
                                 selfDuration: 1.509999856352806,
                                 domChanged: false,
                                 isVisible: true,
                                 unusedReceivedState: false
                              }
                           ]
                        ])
                     }
                  ],
                  [
                     '1',
                     {
                        selfDuration: 45.900002121925354,
                        changes: new Map([
                           [
                              1,
                              {
                                 updateReason: 'destroyed',
                                 selfDuration: 1.509999856352806,
                                 domChanged: false,
                                 isVisible: true,
                                 unusedReceivedState: false
                              }
                           ]
                        ])
                     }
                  ]
               ])
            });
            assert.deepEqual(instance._synchronizations, [
               {
                  id: '0',
                  selfDuration: 483.46999334171414
               },
               {
                  id: '1',
                  selfDuration: 45.900002121925354
               }
            ]);
            assert.equal(instance._selectedSynchronizationId, '0');
            assert.deepEqual(instance._synchronizationOverview, {
               mountedCount: 0,
               selfUpdatedCount: 1,
               parentUpdatedCount: 0,
               unchangedCount: 1,
               forceUpdatedCount: 0,
               destroyedCount: 0
            });
            assert.deepEqual(instance._snapshot, [
               {
                  id: 0,
                  name: 'UI/Base:Document',
                  class: 'Elements__node_control',
                  depth: 0,
                  selfDuration: 2.754999790340662,
                  updateReason: 'unchanged',
                  actualBaseDuration: 1297.724994365126,
                  actualDuration: 481.6599925979972,
                  hasChangesInSubtree: true
               },
               {
                  id: 1,
                  name: 'OnlineSbisRu/Index',
                  parentId: 0,
                  class: 'Elements__node_control',
                  depth: 1,
                  selfDuration: 1.509999856352806,
                  updateReason: 'selfUpdated',
                  actualBaseDuration: 1294.9699945747852,
                  actualDuration: 481.6599925979972,
                  hasChangesInSubtree: true
               }
            ]);
         });
      });

      describe('_onFileDrop', function () {
         let instance;
         beforeEach(function () {
            instance = new Profiler({
               store: {
                  addListener() {},
                  toggleDevtoolsOpened() {},
                  dispatch() {}
               }
            });
         });

         it('should show error message and not reset state when wrong files were selected', async function () {
            sandbox.stub(instance, 'resetState');
            sandbox.stub(popupLib.Confirmation, 'openPopup');
            // setup end

            await instance._onFileDrop({}, [
               {
                  message: 'test message'
               }
            ]);

            sinon.assert.calledWithExactly(popupLib.Confirmation.openPopup, {
               type: 'ok',
               style: 'danger',
               details: 'Incorrect profile format.'
            });
            sinon.assert.notCalled(instance.resetState);
         });

         describe('should show error message and not reset state when an incorrect profile was passed', function () {
            const incorrectProfiles = [
               {
                  syncList: []
               },
               {
                  snapshotBySynchronization: []
               },
               {
                  destroyedCountBySynchronization: []
               },
               {
                  syncList: [],
                  snapshotBySynchronization: []
               },
               {
                  syncList: [],
                  destroyedCountBySynchronization: []
               },
               {
                  snapshotBySynchronization: [],
                  destroyedCountBySynchronization: []
               }
            ];

            incorrectProfiles.forEach((profile, index) => {
               it(`incorrect profile index: ${index}`, async function () {
                  sandbox.stub(instance, 'resetState');
                  sandbox.stub(popupLib.Confirmation, 'openPopup');
                  // setup end

                  await instance._onFileDrop({}, [
                     {
                        getData: sandbox.stub().returns(JSON.stringify(profile))
                     }
                  ]);

                  sinon.assert.calledWithExactly(
                     popupLib.Confirmation.openPopup,
                     {
                        type: 'ok',
                        style: 'danger',
                        details: 'Incorrect profile format.'
                     }
                  );
                  sinon.assert.notCalled(instance.resetState);
               });
            });
         });

         it('should show error message and not reset state when an error occurs during profile parsing', async function () {
            sandbox.stub(instance, 'resetState');
            sandbox.stub(popupLib.Confirmation, 'openPopup');
            // setup end

            await instance._onFileDrop({}, [
               {
                  getData: sandbox.stub().returns({})
               }
            ]);

            sinon.assert.calledWithExactly(popupLib.Confirmation.openPopup, {
               type: 'ok',
               style: 'danger',
               details: 'Incorrect profile format.'
            });
            sinon.assert.notCalled(instance.resetState);
         });

         it('should apply imported profile', async function () {
            sandbox.stub(instance, 'resetState');
            sandbox.stub(popupLib.Confirmation, 'openPopup');
            // setup end

            await instance._onFileDrop({}, [
               {
                  getData: sandbox
                     .stub()
                     .returns(
                        '{"syncList":[["0",{"selfDuration":483.46999334171414,"changes":[[1,{"updateReason":"selfUpdated","selfDuration":1.509999856352806,"domChanged":false,"isVisible":true,"unusedReceivedState":false}]]}],["1",{"selfDuration":45.900002121925354,"changes":[[1,{"updateReason":"destroyed","selfDuration":1.509999856352806,"domChanged":false,"isVisible":true,"unusedReceivedState":false}]]}]],"snapshotBySynchronization":[["0",[{"id":0,"name":"UI/Base:Document","class":"Elements__node_control","depth":0,"selfDuration":2.754999790340662,"updateReason":"unchanged","actualBaseDuration":1297.724994365126,"actualDuration":481.6599925979972,"hasChangesInSubtree":true},{"id":1,"name":"OnlineSbisRu/Index","parentId":0,"class":"Elements__node_control","depth":1,"selfDuration":1.509999856352806,"updateReason":"selfUpdated","actualBaseDuration":1294.9699945747852,"actualDuration":481.6599925979972,"hasChangesInSubtree":true}]],["1",[{"id":0,"name":"UI/Base:Document","class":"Elements__node_control","depth":0,"selfDuration":2.754999790340662,"updateReason":"unchanged","actualBaseDuration":1131.8599968217313,"actualDuration":0,"hasChangesInSubtree":true}]]],"destroyedCountBySynchronization":[["0",0],["1",1]]}'
                     )
               }
            ]);

            sinon.assert.notCalled(popupLib.Confirmation.openPopup);
            sinon.assert.calledOnce(instance.resetState);
            assert.deepEqual(
               instance._snapshotBySynchronization,
               new Map([
                  [
                     '0',
                     [
                        {
                           id: 0,
                           name: 'UI/Base:Document',
                           class: 'Elements__node_control',
                           depth: 0,
                           selfDuration: 2.754999790340662,
                           updateReason: 'unchanged',
                           actualBaseDuration: 1297.724994365126,
                           actualDuration: 481.6599925979972,
                           hasChangesInSubtree: true
                        },
                        {
                           id: 1,
                           name: 'OnlineSbisRu/Index',
                           parentId: 0,
                           class: 'Elements__node_control',
                           depth: 1,
                           selfDuration: 1.509999856352806,
                           updateReason: 'selfUpdated',
                           actualBaseDuration: 1294.9699945747852,
                           actualDuration: 481.6599925979972,
                           hasChangesInSubtree: true
                        }
                     ]
                  ],
                  [
                     '1',
                     [
                        {
                           id: 0,
                           name: 'UI/Base:Document',
                           class: 'Elements__node_control',
                           depth: 0,
                           selfDuration: 2.754999790340662,
                           updateReason: 'unchanged',
                           actualBaseDuration: 1131.8599968217313,
                           actualDuration: 0,
                           hasChangesInSubtree: true
                        }
                     ]
                  ]
               ])
            );
            assert.deepEqual(
               instance._destroyedCountBySynchronization,
               new Map([
                  ['0', 0],
                  ['1', 1]
               ])
            );
            assert.isTrue(instance._didProfile);
            assert.deepEqual(instance._profilingData, {
               initialIdToDuration: new Map(),
               synchronizationKeyToDescription: new Map([
                  [
                     '0',
                     {
                        selfDuration: 483.46999334171414,
                        changes: new Map([
                           [
                              1,
                              {
                                 updateReason: 'selfUpdated',
                                 selfDuration: 1.509999856352806,
                                 domChanged: false,
                                 isVisible: true,
                                 unusedReceivedState: false
                              }
                           ]
                        ])
                     }
                  ],
                  [
                     '1',
                     {
                        selfDuration: 45.900002121925354,
                        changes: new Map([
                           [
                              1,
                              {
                                 updateReason: 'destroyed',
                                 selfDuration: 1.509999856352806,
                                 domChanged: false,
                                 isVisible: true,
                                 unusedReceivedState: false
                              }
                           ]
                        ])
                     }
                  ]
               ])
            });
            assert.deepEqual(instance._synchronizations, [
               {
                  id: '0',
                  selfDuration: 483.46999334171414
               },
               {
                  id: '1',
                  selfDuration: 45.900002121925354
               }
            ]);
            assert.equal(instance._selectedSynchronizationId, '0');
            assert.deepEqual(instance._synchronizationOverview, {
               mountedCount: 0,
               selfUpdatedCount: 1,
               parentUpdatedCount: 0,
               unchangedCount: 1,
               forceUpdatedCount: 0,
               destroyedCount: 0
            });
            assert.deepEqual(instance._snapshot, [
               {
                  id: 0,
                  name: 'UI/Base:Document',
                  class: 'Elements__node_control',
                  depth: 0,
                  selfDuration: 2.754999790340662,
                  updateReason: 'unchanged',
                  actualBaseDuration: 1297.724994365126,
                  actualDuration: 481.6599925979972,
                  hasChangesInSubtree: true
               },
               {
                  id: 1,
                  name: 'OnlineSbisRu/Index',
                  parentId: 0,
                  class: 'Elements__node_control',
                  depth: 1,
                  selfDuration: 1.509999856352806,
                  updateReason: 'selfUpdated',
                  actualBaseDuration: 1294.9699945747852,
                  actualDuration: 481.6599925979972,
                  hasChangesInSubtree: true
               }
            ]);
         });
      });

      describe('__resetState', function () {
         let instance;
         const options = {
            store: {
               addListener() {},
               toggleDevtoolsOpened() {},
               dispatch() {},
               getSelectedId() {},
               setSelectedId() {}
            }
         };
         beforeEach(function () {
            instance = new Profiler(options);
         });
         it('should clear everything without resetting selectedId on the store because the id is not the same', function () {
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
            sandbox.stub(instance._options.store, 'getSelectedId').returns(2);
            sandbox.stub(instance._options.store, 'setSelectedId');

            // заполняем состояние любыми данными, чтобы можно было точно убедиться, что оно очистилось
            instance._changesBySynchronization.set('1', {});
            instance._elementsBySynchronization.set('1', {});
            instance._snapshotBySynchronization.set('1', {});
            const operations = [];
            instance._currentOperations = operations;
            instance._synchronizations = {};
            instance._snapshot = {};
            instance._selectedCommitChanges = {};
            instance._selectedCommitId = 1;
            instance._selectedSynchronizationId = {};
            instance._elementsSnapshot = [];

            instance.__onProfilingStatusChanged(true);

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
            sinon.assert.notCalled(instance._options.store.setSelectedId);
         });

         it('should clear everything and reset selectedId on the store because the id is the same', function () {
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
            sandbox.stub(instance._options.store, 'getSelectedId').returns(1);
            sandbox.stub(instance._options.store, 'setSelectedId');

            // заполняем состояние любыми данными, чтобы можно было точно убедиться, что оно очистилось
            instance._changesBySynchronization.set('1', {});
            instance._elementsBySynchronization.set('1', {});
            instance._snapshotBySynchronization.set('1', {});
            const operations = [];
            instance._currentOperations = operations;
            instance._synchronizations = {};
            instance._snapshot = {};
            instance._selectedCommitChanges = {};
            instance._selectedCommitId = 1;
            instance._selectedSynchronizationId = {};
            instance._elementsSnapshot = [];

            instance.__onProfilingStatusChanged(true);

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
            sinon.assert.calledWithExactly(
               instance._options.store.setSelectedId
            );
         });
      });
   });
});
