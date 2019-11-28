define([
   'DevtoolsTest/mockChrome',
   'Profiler/_RankedView/RankedView',
   'Types/source',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, RankedView, sourceLib, entityLib, optionTypesMocks) {
   let sandbox;
   RankedView = RankedView.default;
   const Memory = sourceLib.Memory;
   const Model = entityLib.Model;
   beforeEach(function() {
      sandbox = sinon.createSandbox();
   });

   afterEach(function() {
      sandbox.restore();
   });

   describe('Profiler/_RankedView/RankedView', function() {
      describe('constructor', function() {
         it('should initialize source', function() {
            const instance = new RankedView({
               snapshot: [
                  {
                     id: '0',
                     selfDuration: 100,
                     updateReason: 'mounted'
                  },
                  {
                     id: '1',
                     selfDuration: 300,
                     updateReason: 'mounted'
                  },
                  {
                     id: '2',
                     selfDuration: 0,
                     updateReason: 'selfUpdated'
                  },
                  {
                     id: '3',
                     selfDuration: 200,
                     updateReason: 'parentUpdated'
                  }
               ],
               filter: {
                  minDuration: 10,
                  name: '',
                  displayReasons: [
                     'mounted',
                     'selfUpdated',
                     'parentUpdated',
                     'forceUpdated'
                  ]
               }
            });

            assert.instanceOf(instance._source, Memory);
            assert.deepEqual(instance._source.data, [
               {
                  id: '0',
                  selfDuration: 100,
                  barColor: '#d5e49e',
                  length: 33.33333333333333,
                  updateReason: 'mounted'
               },
               {
                  id: '1',
                  selfDuration: 300,
                  barColor: '#efc457',
                  length: 100,
                  updateReason: 'mounted'
               },
               {
                  id: '3',
                  selfDuration: 200,
                  barColor: '#e1d782',
                  length: 66.66666666666666,
                  updateReason: 'parentUpdated'
               }
            ]);
         });
      });

      describe('_beforeUpdate', function() {
         let instance;
         const snapshot = [
            {
               id: '0',
               selfDuration: 100,
               updateReason: 'mounted'
            },
            {
               id: '1',
               selfDuration: 300,
               updateReason: 'mounted'
            },
            {
               id: '2',
               selfDuration: 0,
               updateReason: 'selfUpdated'
            },
            {
               id: '3',
               selfDuration: 200,
               updateReason: 'parentUpdated'
            }
         ];
         const filter = {
            minDuration: 10,
            name: '',
            displayReasons: [
               'mounted',
               'selfUpdated',
               'parentUpdated',
               'forceUpdated'
            ]
         };
         beforeEach(() => {
            const options = {
               snapshot,
               filter
            };
            instance = new RankedView(options);
            instance.saveOptions(options);
         });
         it('should update source if the filter was changed', function() {
            instance._beforeUpdate({
               filter: {
                  ...filter,
                  minDuration: 150
               },
               snapshot
            });

            assert.deepEqual(instance._source.data, [
               {
                  id: '1',
                  selfDuration: 300,
                  barColor: '#efc457',
                  length: 100,
                  updateReason: 'mounted'
               },
               {
                  id: '3',
                  selfDuration: 200,
                  barColor: '#e1d782',
                  length: 66.66666666666666,
                  updateReason: 'parentUpdated'
               }
            ]);
         });
         it('should update source if synchronizations were changed', function() {
            instance._beforeUpdate({
               filter,
               snapshot: [
                  {
                     id: '0',
                     selfDuration: 150,
                     updateReason: 'mounted'
                  }
               ]
            });

            assert.deepEqual(instance._source.data, [
               {
                  id: '0',
                  selfDuration: 150,
                  barColor: '#efc457',
                  length: 100,
                  updateReason: 'mounted'
               }
            ]);
         });
         it('should not touch source if nothing changed', function() {
            Object.defineProperty(instance, '_source', {
               writable: false
            });

            assert.doesNotThrow(() =>
               instance._beforeUpdate({
                  filter,
                  snapshot
               })
            );
         });
      });

      describe('__markedKeyChanged', function() {
         let instance;
         beforeEach(() => {
            instance = new RankedView({
               snapshot: [
                  {
                     id: '0',
                     selfDuration: 100,
                     updateReason: 'mounted'
                  },
                  {
                     id: '1',
                     selfDuration: 300,
                     updateReason: 'mounted'
                  },
                  {
                     id: '2',
                     selfDuration: 0,
                     updateReason: 'selfUpdated'
                  },
                  {
                     id: '3',
                     selfDuration: 200,
                     updateReason: 'parentUpdated'
                  }
               ],
               filter: {
                  minDuration: 10,
                  name: '',
                  displayReasons: [
                     'mounted',
                     'selfUpdated',
                     'parentUpdated',
                     'forceUpdated'
                  ]
               }
            });
         });
         it('should fire markedKeyChanged event', function() {
            const stub = sandbox.stub(instance, '_notify');

            instance.__markedKeyChanged({}, '1');

            assert.isTrue(
               stub.calledOnceWithExactly('markedKeyChanged', ['1'])
            );
         });
      });

      it('_groupingCallback', function() {
         const instance = new RankedView({
            snapshot: [
               {
                  id: '0',
                  selfDuration: 100,
                  updateReason: 'mounted'
               },
               {
                  id: '1',
                  selfDuration: 300,
                  updateReason: 'mounted'
               },
               {
                  id: '2',
                  selfDuration: 0,
                  updateReason: 'selfUpdated'
               },
               {
                  id: '3',
                  selfDuration: 200,
                  updateReason: 'parentUpdated'
               }
            ],
            filter: {
               minDuration: 10,
               name: '',
               displayReasons: [
                  'mounted',
                  'selfUpdated',
                  'parentUpdated',
                  'forceUpdated'
               ]
            }
         });
         const item = new Model();

         item.set('updateReason', 'mounted');
         assert.equal(instance._groupingCallback(item), 'mounted');
         item.set('updateReason', 'selfUpdated');
         assert.equal(instance._groupingCallback(item), 'selfUpdated');
         item.set('updateReason', 'parentUpdated');
         assert.equal(instance._groupingCallback(item), 'parentUpdated');
         item.set('updateReason', 'forceUpdated');
         assert.equal(instance._groupingCallback(item), 'forceUpdated');
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = RankedView.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'snapshot',
               'markedKey',
               'filter',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'snapshot', {
               required: true,
               args: [Array]
            });
            testOption(optionTypes, 'markedKey', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'filter', {
               required: true,
               args: [Object]
            });
            testOption(optionTypes, 'readOnly', {
               args: [Boolean]
            });
            testOption(optionTypes, 'theme', {
               args: [String]
            });
         });
      });
   });
});
