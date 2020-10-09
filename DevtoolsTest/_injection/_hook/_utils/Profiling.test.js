define([
   'injection/_hook/_utils/Profiling',
   'Extension/Plugins/Elements/const'
], function (ProfilingUtils, elementsConst) {
   const { getSyncList } = ProfilingUtils;
   const { OperationType } = elementsConst;

   describe('injection/_hook/_utils/Profiling', function () {
      describe('getSyncList', function () {
         it('should transform backend representation of synchronizations to a serializable representation (no Maps, no Sets, no functions, etc.)', function () {
            const changedNodesBySynchronization = new Map();
            const firstChanges = new Map();
            firstChanges.set(0, {
               node: {
                  selfDuration: 10,
                  lifecycleDuration: 5,
                  domChanged: true,
                  isVisible: true,
                  unusedReceivedState: false,
                  changedReactiveProps: ['value']
               },
               operation: OperationType.UPDATE
            });
            firstChanges.set(1, {
               node: {
                  parentId: 0,
                  selfDuration: 5,
                  lifecycleDuration: 3,
                  options: {
                     value: 12,
                     anotherValue: 34
                  },
                  changedOptions: {
                     value: 56,
                     anotherValue: 78
                  },
                  attributes: {
                     'attr:class': 'expanded'
                  },
                  changedAttributes: {
                     'attr:class': 'collapsed'
                  },
                  changedReactiveProps: ['selectedKeys'],
                  domChanged: true,
                  isVisible: true,
                  unusedReceivedState: false
               },
               operation: OperationType.UPDATE
            });
            firstChanges.set(2, {
               node: {
                  parentId: 1,
                  selfDuration: 2,
                  lifecycleDuration: 1,
                  domChanged: false,
                  isVisible: false,
                  unusedReceivedState: false
               },
               operation: OperationType.UPDATE
            });
            firstChanges.set(3, {
               node: {
                  parentId: 1,
                  selfDuration: 4,
                  lifecycleDuration: 2,
                  domChanged: true,
                  isVisible: false,
                  unusedReceivedState: false
               },
               operation: OperationType.DELETE
            });
            changedNodesBySynchronization.set('0', firstChanges);
            const secondChanges = new Map();
            secondChanges.set(4, {
               node: {
                  selfDuration: 9,
                  lifecycleDuration: 5,
                  domChanged: true,
                  isVisible: true,
                  unusedReceivedState: true,
                  asyncControl: true
               },
               operation: OperationType.CREATE
            });
            changedNodesBySynchronization.set('1', secondChanges);

            const result = getSyncList(changedNodesBySynchronization);

            assert.deepEqual(result, [
               [
                  '0',
                  {
                     selfDuration: 21,
                     changes: [
                        [
                           0,
                           {
                              selfDuration: 10,
                              lifecycleDuration: 5,
                              updateReason: 'forceUpdated',
                              domChanged: true,
                              isVisible: true,
                              unusedReceivedState: false,
                              changedOptions: undefined,
                              changedAttributes: undefined,
                              changedReactiveProps: [
                                 {
                                    name: 'value'
                                 }
                              ],
                              asyncControl: false
                           }
                        ],
                        [
                           1,
                           {
                              selfDuration: 5,
                              lifecycleDuration: 3,
                              updateReason: 'selfUpdated',
                              domChanged: true,
                              isVisible: true,
                              unusedReceivedState: false,
                              changedOptions: ['value', 'anotherValue'],
                              changedAttributes: ['class'],
                              changedReactiveProps: [
                                 {
                                    name: 'selectedKeys'
                                 }
                              ],
                              asyncControl: false
                           }
                        ],
                        [
                           2,
                           {
                              selfDuration: 2,
                              lifecycleDuration: 1,
                              updateReason: 'parentUpdated',
                              domChanged: false,
                              isVisible: false,
                              unusedReceivedState: false,
                              changedOptions: undefined,
                              changedAttributes: undefined,
                              changedReactiveProps: undefined,
                              asyncControl: false
                           }
                        ],
                        [
                           3,
                           {
                              selfDuration: 4,
                              lifecycleDuration: 2,
                              updateReason: 'destroyed',
                              domChanged: true,
                              isVisible: false,
                              unusedReceivedState: false,
                              changedOptions: undefined,
                              changedAttributes: undefined,
                              changedReactiveProps: undefined,
                              asyncControl: false
                           }
                        ]
                     ]
                  }
               ],
               [
                  '1',
                  {
                     selfDuration: 9,
                     changes: [
                        [
                           4,
                           {
                              selfDuration: 9,
                              lifecycleDuration: 5,
                              updateReason: 'mounted',
                              domChanged: true,
                              isVisible: true,
                              unusedReceivedState: true,
                              changedOptions: undefined,
                              changedAttributes: undefined,
                              changedReactiveProps: undefined,
                              asyncControl: true
                           }
                        ]
                     ]
                  }
               ]
            ]);
         });
      });
   });
});
