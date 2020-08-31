define([
   'injection/_dependencyWatcher/storage/file/getResourcesFromPerformance',
   'DevtoolsTest/getJSDOM'
], function(getResourcesFromPerformance, getJSDOM) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_dependencyWatcher/storage/file/getResourcesFromPerformance', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
            global.performance = dom.window.performance;
            global.performance.getEntriesByType = () => {};
            global.performance.clearResourceTimings = () => {};
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

      it('should format performance entries and return them', function() {
         sandbox.stub(window.performance, 'addEventListener');
         sandbox.stub(window.performance, 'clearResourceTimings');

         getResourcesFromPerformance.init();

         sinon.assert.calledOnce(window.performance.addEventListener);
         assert.equal(
            window.performance.addEventListener.firstCall.args[0],
            'resourcetimingbufferfull'
         );
         assert.instanceOf(
            window.performance.addEventListener.firstCall.args[1],
            Function
         );

         sandbox
            .stub(window.performance, 'getEntriesByType')
            .withArgs('resource')
            .returns([
               {
                  name: '/cdn/resourceFromCdn.js'
               },
               {
                  name: '/resources/normalResource.css'
               },
               {
                  name: 'notAResource.js'
               }
            ]);

         assert.deepEqual(getResourcesFromPerformance.default(), [
            '/cdn/resourceFromCdn.js',
            '/resources/normalResource.css'
         ]);

         sinon.assert.calledOnce(window.performance.clearResourceTimings);
      });
   });
});
