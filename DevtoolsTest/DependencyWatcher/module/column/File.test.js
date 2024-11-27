define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_module/column/File',
   'Types/entity'
], function(mockChrome, File, entityLib) {
   let sandbox;
   let instance;
   File = File.default;
   const Model = entityLib.Model;

   describe('DependencyWatcher/_module/column/File', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new File();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('__openResource', function() {
         it('should directly open non-js file', function() {
            const event = {
               stopPropagation: sandbox.stub()
            };
            const path = 'https://example.com/testPath.css';
            const item = new Model({
               rawData: {
                  id: 0,
                  itemId: 0,
                  path
               },
               keyProperty: 'id'
            });
            sandbox.stub(chrome.devtools.panels, 'openResource');

            instance.__openResource(event, item);

            assert.isTrue(event.stopPropagation.calledOnceWithExactly());
            assert.isTrue(
               chrome.devtools.panels.openResource.calledOnceWithExactly(
                  path,
                  1
               )
            );
         });

         it('should fire openSource event', function() {
            const event = {
               stopPropagation: sandbox.stub()
            };
            const item = new Model({
               rawData: {
                  id: 0,
                  itemId: 0,
                  path: 'https://example.com/testPath.js'
               },
               keyProperty: 'id'
            });
            const notifyStub = sandbox.stub(instance, '_notify');

            instance.__openResource(event, item);

            assert.isTrue(
               notifyStub.calledOnceWithExactly('openSource', [0], {
                  bubbling: true
               })
            );
         });
      });
   });
});
