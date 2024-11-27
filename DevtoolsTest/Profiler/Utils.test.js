define([
   'DevtoolsTest/mockChrome',
   'Profiler/_utils/Utils',
   'Elements/elements',
   'Extension/Plugins/Elements/const'
], function(mockChrome, Utils, elementsLib, elementsConsts) {
   let sandbox;

   describe('Profiler/_utils/Utils', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('applyOperations', function() {
         const applyOperations = Utils.applyOperations;
         const OperationType = elementsConsts.OperationType;
         const ControlType = elementsConsts.ControlType;
         const initialElements = [
            {
               id: 0,
               name: 'Test',
               depth: 0,
               class: ''
            },
            {
               id: 1,
               name: 'Test2',
               depth: 0,
               class: ''
            }
         ];
         const firstOperation = [OperationType.DELETE, 0];
         const secondOperation = [
            OperationType.CREATE,
            2,
            'Test3',
            ControlType.TEMPLATE,
            1
         ];
         const operations = [firstOperation, secondOperation];
         const stub = sandbox.stub(elementsLib, 'applyOperation');
         stub.onFirstCall().callsFake((elements, operation) => {
            assert.deepEqual(elements, initialElements);
            assert.deepEqual(operation, firstOperation);
            elements.shift();
         });
         stub.onSecondCall().callsFake((elements, operation) => {
            assert.deepEqual(elements, [
               {
                  id: 1,
                  name: 'Test2',
                  depth: 0,
                  class: ''
               }
            ]);
            assert.deepEqual(operation, secondOperation);
            elements.push({
               id: 2,
               name: 'Test3',
               depth: 1,
               class: '',
               parentId: 1
            });
         });

         const result = applyOperations(initialElements, operations);

         assert.equal(stub.callCount, 2);
         assert.deepEqual(
            [
               {
                  id: 1,
                  name: 'Test2',
                  depth: 0,
                  class: ''
               },
               {
                  id: 2,
                  name: 'Test3',
                  depth: 1,
                  class: '',
                  parentId: 1
               }
            ],
            result
         );
      });

      it('convertProfilingData', function() {
         const convertProfilingData = Utils.convertProfilingData;
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
            ]
         ];
         const backendProfilingData = {
            initialIdToDuration,
            syncList
         };

         const frontendProfilingData = convertProfilingData(
            backendProfilingData
         );

         assert.instanceOf(frontendProfilingData.initialIdToDuration, Map);
         assert.deepEqual(
            Array.from(frontendProfilingData.initialIdToDuration.entries()),
            initialIdToDuration
         );
         assert.instanceOf(
            frontendProfilingData.synchronizationKeyToDescription,
            Map
         );
         const entries = Array.from(
            frontendProfilingData.synchronizationKeyToDescription.entries()
         );
         assert.equal(entries.length, 1);
         assert.equal(entries[0].length, 2);
         assert.equal(entries[0][0], 'test');
         assert.equal(entries[0][1].selfDuration, 10);
         assert.instanceOf(entries[0][1].changes, Map);
         assert.deepEqual(Array.from(entries[0][1].changes), changes);
      });

      it('getChanges', function() {
         const getChanges = Utils.getChanges;
         const changes = new Map([
            [
               1,
               {
                  selfDuration: 10,
                  updateReason: 'mounted'
               }
            ]
         ]);
         const profilingData = {
            initialIdToDuration: new Map([[1, 5]]),
            synchronizationKeyToDescription: new Map([
               [
                  'test',
                  {
                     selfDuration: 10,
                     changes
                  }
               ]
            ])
         };
         assert.deepEqual(getChanges(profilingData, 'test'), changes);
      });

      describe('getChangesDescription', function() {
         it('should return description', function() {
            const getChangesDescription = Utils.getChangesDescription;
            const controlChanges = {
               selfDuration: 10,
               updateReason: 'mounted'
            };
            const changes = new Map([[1, controlChanges]]);
            const profilingData = {
               initialIdToDuration: new Map([[1, 5]]),
               synchronizationKeyToDescription: new Map([
                  [
                     'test',
                     {
                        selfDuration: 10,
                        changes
                     }
                  ]
               ])
            };

            assert.deepEqual(
               getChangesDescription(profilingData, 'test', 1),
               controlChanges
            );
         });

         it('should return undefined', function() {
            const getChangesDescription = Utils.getChangesDescription;
            const controlChanges = {
               selfDuration: 10,
               updateReason: 'mounted'
            };
            const changes = new Map([[1, controlChanges]]);
            const profilingData = {
               initialIdToDuration: new Map([[1, 5]]),
               synchronizationKeyToDescription: new Map([
                  [
                     'test',
                     {
                        selfDuration: 10,
                        changes
                     }
                  ]
               ])
            };

            assert.isUndefined(
               getChangesDescription(profilingData, 'test', 123)
            );
         });
      });

      describe('getSelfDuration', function() {
         const getSelfDuration = Utils.getSelfDuration;

         it('should take duration from changes description', function() {
            const controlChanges = {
               selfDuration: 10,
               updateReason: 'mounted'
            };
            const changes = new Map([[1, controlChanges]]);
            const profilingData = {
               initialIdToDuration: new Map([[1, 5]]),
               synchronizationKeyToDescription: new Map([
                  [
                     'test',
                     {
                        selfDuration: 10,
                        changes
                     }
                  ]
               ])
            };

            assert.deepEqual(getSelfDuration(profilingData, 'test', 1), 10);
         });

         it('should take duration from initialIdToDuration', function() {
            const controlChanges = {
               selfDuration: 10,
               updateReason: 'mounted'
            };
            const changes = new Map([[2, controlChanges]]);
            const profilingData = {
               initialIdToDuration: new Map([[1, 5]]),
               synchronizationKeyToDescription: new Map([
                  [
                     'test',
                     {
                        selfDuration: 10,
                        changes
                     }
                  ]
               ])
            };

            assert.deepEqual(getSelfDuration(profilingData, 'test', 1), 5);
         });

         it('should take duration from previousSyncrhonization', function() {
            const controlChanges = {
               selfDuration: 10,
               updateReason: 'forceUpdated'
            };
            const changes = new Map([[1, controlChanges]]);
            const controlChangesFromPreviousSync = {
               selfDuration: 15,
               updateReason: 'mounted'
            };
            const changesFromPreviousSync = new Map([
               [2, controlChangesFromPreviousSync]
            ]);
            const profilingData = {
               initialIdToDuration: new Map([[1, 5]]),
               synchronizationKeyToDescription: new Map([
                  [
                     'test1',
                     {
                        selfDuration: 15,
                        changes: changesFromPreviousSync
                     }
                  ],
                  [
                     'test2',
                     {
                        selfDuration: 10,
                        changes
                     }
                  ]
               ])
            };

            assert.deepEqual(getSelfDuration(profilingData, 'test2', 2), 15);
         });
      });

      it('getBackgroundColorBasedOnTiming', function() {
         const getBackgroundColorBasedOnTiming =
            Utils.getBackgroundColorBasedOnTiming;
         assert.equal(getBackgroundColorBasedOnTiming(0.05), 0);
         assert.equal(getBackgroundColorBasedOnTiming(0.15), 1);
         assert.equal(getBackgroundColorBasedOnTiming(0.25), 2);
         assert.equal(getBackgroundColorBasedOnTiming(0.35), 3);
         assert.equal(getBackgroundColorBasedOnTiming(0.45), 4);
         assert.equal(getBackgroundColorBasedOnTiming(0.58), 5);
         assert.equal(getBackgroundColorBasedOnTiming(0.7), 6);
         assert.equal(getBackgroundColorBasedOnTiming(0.85), 7);
         assert.equal(getBackgroundColorBasedOnTiming(0.95), 8);
      });

      describe('getBackgroundClassBasedOnReason', function() {
         const getBackgroundClassBasedOnReason =
            Utils.getBackgroundClassBasedOnReason;
         it('should return color for mounted', function() {
            assert.equal(
               getBackgroundClassBasedOnReason('mounted'),
               'devtools-reason_background_mounted'
            );
         });
         it('should return color for forceUpdated', function() {
            assert.equal(
               getBackgroundClassBasedOnReason('forceUpdated'),
               'devtools-reason_background_forceUpdated'
            );
         });
         it('should return color for selfUpdated', function() {
            assert.equal(
               getBackgroundClassBasedOnReason('selfUpdated'),
               'devtools-reason_background_selfUpdated'
            );
         });
         it('should return color for parentUpdated', function() {
            assert.equal(
               getBackgroundClassBasedOnReason('parentUpdated'),
               'devtools-reason_background_parentUpdated'
            );
         });
         it('should return color for unchanged', function() {
            assert.equal(
               getBackgroundClassBasedOnReason('unchanged'),
               'devtools-reason_background_unchanged'
            );
         });
         it('should return color for destroyed', function() {
            assert.equal(
               getBackgroundClassBasedOnReason('destroyed'),
               'devtools-reason_background_destroyed'
            );
         });
         it('should return color for element with no changes in the subtree no matter what the updateReason is', function() {
            assert.equal(
               getBackgroundClassBasedOnReason('mounted', false),
               'devtools-reason_background_noChangesInSubtree'
            );
            assert.equal(
               getBackgroundClassBasedOnReason('forceUpdated', false),
               'devtools-reason_background_noChangesInSubtree'
            );
            assert.equal(
               getBackgroundClassBasedOnReason('selfUpdated', false),
               'devtools-reason_background_noChangesInSubtree'
            );
            assert.equal(
               getBackgroundClassBasedOnReason('parentUpdated', false),
               'devtools-reason_background_noChangesInSubtree'
            );
            assert.equal(
               getBackgroundClassBasedOnReason('unchanged', false),
               'devtools-reason_background_noChangesInSubtree'
            );
            assert.equal(
               getBackgroundClassBasedOnReason('destroyed', false),
               'devtools-reason_background_noChangesInSubtree'
            );
         });
      });

      describe('formatTime', function() {
         const formatTime = Utils.formatTime;
         it('should properly format time higher than a second', function() {
            assert.equal(formatTime(1100), '1.10s');
         });
         it('should properly format time less than a second', function() {
            assert.equal(formatTime(999), '999.00ms');
         });
         it('should properly format time equal to a second', function() {
            assert.equal(formatTime(1000), '1.00s');
         });
      });

      describe('getSynchronizationOverview', function() {
         const getSynchronizationOverview = Utils.getSynchronizationOverview;
         it('destroyedCount should be 0', function() {
            let id = 0;
            function getControlNode(updateReason) {
               return {
                  id: id++,
                  name: 'Test',
                  depth: 0,
                  class: '',
                  selfDuration: 0,
                  actualDuration: 0,
                  actualBaseDuration: 0,
                  updateReason
               };
            }
            const snapshot = [
               getControlNode('mounted'),
               getControlNode('selfUpdated'),
               getControlNode('parentUpdated'),
               getControlNode('unchanged'),
               getControlNode('forceUpdated'),
               // There should be no nodes with "destroyed" type in the real profile, so we're making sure that they're correctly ignored.
               getControlNode('destroyed')
            ];

            assert.deepEqual(getSynchronizationOverview(snapshot), {
               mountedCount: 1,
               selfUpdatedCount: 1,
               parentUpdatedCount: 1,
               unchangedCount: 1,
               forceUpdatedCount: 1,
               destroyedCount: 0
            });
         });

         it('destroyedCount should be 10', function() {
            let id = 0;
            function getControlNode(updateReason) {
               return {
                  id: id++,
                  name: 'Test',
                  depth: 0,
                  class: '',
                  selfDuration: 0,
                  actualDuration: 0,
                  actualBaseDuration: 0,
                  updateReason
               };
            }
            const snapshot = [
               getControlNode('mounted'),
               getControlNode('mounted'),
               getControlNode('selfUpdated'),
               getControlNode('selfUpdated'),
               getControlNode('selfUpdated'),
               getControlNode('parentUpdated'),
               getControlNode('parentUpdated'),
               getControlNode('unchanged'),
               getControlNode('forceUpdated'),
               // There should be no nodes with "destroyed" type in the real profile, so we're making sure that they're correctly ignored.
               getControlNode('destroyed')
            ];

            assert.deepEqual(getSynchronizationOverview(snapshot, 10), {
               mountedCount: 2,
               selfUpdatedCount: 3,
               parentUpdatedCount: 2,
               unchangedCount: 1,
               forceUpdatedCount: 1,
               destroyedCount: 10
            });
         });
      });
   });
});
