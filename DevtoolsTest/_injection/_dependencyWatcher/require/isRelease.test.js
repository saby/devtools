define([
   'injection/_dependencyWatcher/require/isRelease',
   'DevtoolsTest/getJSDOM'
], function(isRelease, getJSDOM) {
   let sandbox;
   isRelease = isRelease.isRelease;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_dependencyWatcher/require/isRelease', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.document;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should return correct value', function() {
         sandbox.stub(document, 'cookie').value('');
         assert.isFalse(isRelease('debug'));
         assert.isTrue(isRelease('release'));

         sandbox.stub(document, 'cookie').value('s3debug=false');
         assert.isFalse(isRelease('debug'));
         assert.isTrue(isRelease('release'));

         sandbox.stub(document, 'cookie').value('s3debug=true');
         assert.isFalse(isRelease('debug'));
         assert.isFalse(isRelease('release'));

         sandbox.stub(document, 'cookie').value('s3debug=Controls');
         assert.isFalse(isRelease('debug'));
         assert.isFalse(isRelease('release'));
      });
   });
});
