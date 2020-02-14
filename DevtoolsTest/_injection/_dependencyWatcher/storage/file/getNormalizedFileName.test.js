define([
   'injection/_dependencyWatcher/storage/file/getNormalizedFileName'
], function(getNormalizedFileName) {
   let sandbox;
   getNormalizedFileName = getNormalizedFileName.default;

   describe('injection/_dependencyWatcher/storage/file/getNormalizedFileName', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should extract file name from a url', function() {
         assert.equal(
            getNormalizedFileName(
               'https://online.sbis.ru/resources/Types/display.min.js?x_module=19.726-277#randomHashParam=123'
            ),
            'display.min.js'
         );
      });
   });
});
