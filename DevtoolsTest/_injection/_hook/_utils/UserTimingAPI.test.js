define([
   'injection/_hook/_utils/UserTimingAPI',
   'DevtoolsTest/getJSDOM'
], function(UserTimingAPI, getJSDOM) {
   let sandbox;
   const { startSyncMark, endSyncMark, startMark, endMark } = UserTimingAPI;
   const needJSDOM = typeof window === 'undefined';

   function stubWasabyDevtoolsOptions(value) {
      window.wasabyDevtoolsOptions = value;
   }

   describe('injection/_hook/_utils/UserTimingAPI', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
            global.performance = dom.window.performance;
            performance.mark = () => {};
            performance.measure = () => {};
            performance.clearMarks = () => {};
            performance.clearMeasures = () => {};
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.window;
            delete global.performance;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('startSyncMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions();

            startSyncMark(1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            startSyncMark(1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should call performance.mark with the id of the root', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: true
            });

            startSyncMark(1);

            sinon.assert.calledOnce(performance.mark);
            sinon.assert.calledWithExactly(
               performance.mark,
               'Synchronization 1'
            );

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });
      });

      describe('endSyncMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'measure');
            stubWasabyDevtoolsOptions();

            endSyncMark(1);

            sinon.assert.notCalled(performance.measure);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'measure');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            endSyncMark(1);

            sinon.assert.notCalled(performance.measure);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should call performance.measure with the id of the root', function() {
            sandbox.stub(performance, 'measure');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: true
            });

            endSyncMark(1);

            sinon.assert.calledOnce(performance.measure);
            sinon.assert.calledWithExactly(
               performance.measure,
               'Synchronization',
               'Synchronization 1'
            );

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });
      });

      describe('startMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions();

            startMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'mark');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            startMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.mark);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         describe('should call performance.mark with the id and the name of the control and the right operation', function() {
            const operations = [
               ['lifecycle'],
               ['unmount', 0],
               ['mount', 1],
               ['reorder', 2],
               ['update', 3]
            ];
            operations.forEach(([operationName, operationCode]) => {
               it(operationName, function() {
                  sandbox.stub(performance, 'mark');
                  stubWasabyDevtoolsOptions({
                     useUserTimingAPI: true
                  });

                  startMark('Controls/Application', 1, operationCode);

                  sinon.assert.calledOnce(performance.mark);
                  sinon.assert.calledWithExactly(
                     performance.mark,
                     `Controls/Application (${operationName}) 1`
                  );

                  //cleanup
                  delete window.wasabyDevtoolsOptions;
               });
            });
         });
      });

      describe('endMark', function() {
         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is not set', function() {
            sandbox.stub(performance, 'measure');
            sandbox.stub(performance, 'clearMarks');
            sandbox.stub(performance, 'clearMeasures');
            stubWasabyDevtoolsOptions();

            endMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.measure);
            sinon.assert.notCalled(performance.clearMarks);
            sinon.assert.notCalled(performance.clearMeasures);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         it('should not do anything because wasabyDevtoolsOptions.useUserTimingAPI is false', function() {
            sandbox.stub(performance, 'measure');
            sandbox.stub(performance, 'clearMarks');
            sandbox.stub(performance, 'clearMeasures');
            stubWasabyDevtoolsOptions({
               useUserTimingAPI: false
            });

            endMark('Controls/Application', 1, 1);

            sinon.assert.notCalled(performance.measure);
            sinon.assert.notCalled(performance.clearMarks);
            sinon.assert.notCalled(performance.clearMeasures);

            //cleanup
            delete window.wasabyDevtoolsOptions;
         });

         describe('should measure time and cleanup marks and measures', function() {
            const operations = [
               ['lifecycle'],
               ['unmount', 0],
               ['mount', 1],
               ['reorder', 2],
               ['update', 3]
            ];
            operations.forEach(([operationName, operationCode]) => {
               it(operationName, function() {
                  sandbox.stub(performance, 'measure');
                  sandbox.stub(performance, 'clearMarks');
                  sandbox.stub(performance, 'clearMeasures');
                  stubWasabyDevtoolsOptions({
                     useUserTimingAPI: true
                  });

                  endMark('Controls/Application', 1, operationCode);

                  const caption = `Controls/Application (${operationName})`;
                  const label = `${caption} 1`;

                  sinon.assert.calledOnce(performance.measure);
                  sinon.assert.calledWithExactly(
                     performance.measure,
                     caption,
                     label
                  );

                  sinon.assert.calledOnce(performance.clearMarks);
                  sinon.assert.calledWithExactly(performance.clearMarks, label);

                  sinon.assert.calledOnce(performance.clearMeasures);
                  sinon.assert.calledWithExactly(
                     performance.clearMeasures,
                     caption
                  );

                  //cleanup
                  delete window.wasabyDevtoolsOptions;
               });
            });
         });
      });
   });
});
