define([
   'DevtoolsTest/mockChrome',
   'Profiler/_SynchronizationsList/SynchronizationsList',
   'Types/source'
], function(mockChrome, SynchronizationsList, sourceLib) {
   let sandbox;
   SynchronizationsList = SynchronizationsList.default;
   const Memory = sourceLib.Memory;

   beforeEach(function() {
      sandbox = sinon.createSandbox();
   });

   afterEach(function() {
      sandbox.restore();
   });

   describe('Profiler/_SynchronizationsList/SynchronizationsList', function() {
      describe('constructor', function() {
         it('should initialize source', function() {
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
                  selfDuration: 100,
                  barColor: '#d5e49e',
                  length: 33.33333333333333
               },
               {
                  id: '1',
                  selfDuration: 300,
                  barColor: '#efc457',
                  length: 100
               },
               {
                  id: '3',
                  selfDuration: 200,
                  barColor: '#e1d782',
                  length: 66.66666666666666
               }
            ]);
         });
      });
      describe('_beforeUpdate', function() {
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
         it('should update source if the filter was changed', function() {
            instance._beforeUpdate({
               filter: (synchronization) => synchronization.selfDuration > 100,
               synchronizations
            });

            assert.deepEqual(instance._source.data, [
               {
                  id: '1',
                  selfDuration: 300,
                  barColor: '#efc457',
                  length: 100
               },
               {
                  id: '3',
                  selfDuration: 200,
                  barColor: '#e1d782',
                  length: 66.66666666666666
               }
            ]);
         });
         it('should update source if synchronizations were changed', function() {
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
                  selfDuration: 100,
                  barColor: '#efc457',
                  length: 100
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
                  synchronizations
               })
            );
         });
      });

      describe('__markedKeyChanged', function() {
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
         it('should fire markedKeyChanged event', function() {
            const stub = sandbox.stub(instance, '_notify');

            instance.__markedKeyChanged({}, '1');

            assert.isTrue(
               stub.calledOnceWithExactly('markedKeyChanged', ['1'])
            );
         });
      });
   });
});
