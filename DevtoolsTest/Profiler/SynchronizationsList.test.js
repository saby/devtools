define([
   'DevtoolsTest/mockChrome',
   'Profiler/_SynchronizationsList/SynchronizationsList',
   'Types/source',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function (
   mockChrome,
   SynchronizationsList,
   sourceLib,
   entityLib,
   optionTypesMocks
) {
   let sandbox;
   SynchronizationsList = SynchronizationsList.default;
   const Memory = sourceLib.Memory;

   describe('Profiler/_SynchronizationsList/SynchronizationsList', function () {
      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('constructor', function () {
         it('should initialize source', function () {
            const instance = new SynchronizationsList({
               synchronizations: [
                  {
                     id: '0',
                     selfDuration: 100
                  },
                  {
                     id: '1',
                     selfDuration: 300
                  },
                  {
                     id: '2',
                     selfDuration: 0
                  },
                  {
                     id: '3',
                     selfDuration: 200
                  }
               ],
               filter: (synchronization) => synchronization.selfDuration !== 0
            });

            assert.instanceOf(instance._source, Memory);
            assert.deepEqual(instance._source.data, [
               {
                  id: '0',
                  bars: [
                     {
                        color: 'devtools-Profiler__duration_3',
                        length: 33.33333333333333,
                        name: 'selfDuration',
                        value: 100
                     }
                  ],
                  selfDuration: 100
               },
               {
                  id: '1',
                  bars: [
                     {
                        color: 'devtools-Profiler__duration_8',
                        length: 100,
                        name: 'selfDuration',
                        value: 300
                     }
                  ],
                  selfDuration: 300
               },
               {
                  id: '3',
                  bars: [
                     {
                        color: 'devtools-Profiler__duration_5',
                        length: 66.66666666666666,
                        name: 'selfDuration',
                        value: 200
                     }
                  ],
                  selfDuration: 200
               }
            ]);
         });
      });
      describe('_beforeUpdate', function () {
         let instance;
         const synchronizations = [
            {
               id: '0',
               selfDuration: 100
            },
            {
               id: '1',
               selfDuration: 300
            },
            {
               id: '2',
               selfDuration: 0
            },
            {
               id: '3',
               selfDuration: 200
            }
         ];
         const filter = (synchronization) => synchronization.selfDuration !== 0;
         beforeEach(() => {
            const options = {
               synchronizations,
               filter
            };
            instance = new SynchronizationsList(options);
            instance.saveOptions(options);
         });
         it('should update source if the filter was changed', function () {
            instance._beforeUpdate({
               filter: (synchronization) => synchronization.selfDuration > 100,
               synchronizations
            });

            assert.deepEqual(instance._source.data, [
               {
                  id: '1',
                  bars: [
                     {
                        color: 'devtools-Profiler__duration_8',
                        length: 100,
                        name: 'selfDuration',
                        value: 300
                     }
                  ],
                  selfDuration: 300
               },
               {
                  id: '3',
                  bars: [
                     {
                        color: 'devtools-Profiler__duration_5',
                        length: 66.66666666666666,
                        name: 'selfDuration',
                        value: 200
                     }
                  ],
                  selfDuration: 200
               }
            ]);
         });
         it('should update source if synchronizations were changed', function () {
            instance._beforeUpdate({
               filter,
               synchronizations: [
                  {
                     id: '0',
                     selfDuration: 100
                  }
               ]
            });

            assert.deepEqual(instance._source.data, [
               {
                  id: '0',
                  bars: [
                     {
                        color: 'devtools-Profiler__duration_8',
                        length: 100,
                        name: 'selfDuration',
                        value: 100
                     }
                  ],
                  selfDuration: 100
               }
            ]);
         });
         it('should not touch source if nothing changed', function () {
            Object.defineProperty(instance, '_source', {
               writable: false
            });

            assert.doesNotThrow(() =>
               instance._beforeUpdate({
                  filter,
                  synchronizations
               })
            );
         });
      });

      describe('__markedKeyChanged', function () {
         let instance;
         beforeEach(() => {
            instance = new SynchronizationsList({
               synchronizations: [
                  {
                     id: '0',
                     selfDuration: 100
                  },
                  {
                     id: '1',
                     selfDuration: 300
                  },
                  {
                     id: '2',
                     selfDuration: 0
                  },
                  {
                     id: '3',
                     selfDuration: 200
                  }
               ],
               filter: (synchronization) => synchronization.selfDuration !== 0
            });
         });
         it('should fire markedKeyChanged event', function () {
            const stub = sandbox.stub(instance, '_notify');

            instance.__markedKeyChanged({}, '1');

            assert.isTrue(
               stub.calledOnceWithExactly('markedKeyChanged', ['1'])
            );
         });
      });

      describe('getOptionTypes', function () {
         it('should call entity:Descriptor with correct values', function () {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = SynchronizationsList.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'synchronizations',
               'markedKey',
               'filter',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'synchronizations', {
               required: true,
               args: [Array]
            });
            testOption(optionTypes, 'markedKey', {
               required: true,
               args: [String]
            });
            testOption(optionTypes, 'filter', {
               required: true,
               args: [Function]
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
