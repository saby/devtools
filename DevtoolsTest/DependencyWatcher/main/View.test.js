define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_main/View',
   'DependencyWatcher/_main/ViewMode',
   'DependencyWatcher/data',
   'Extension/Plugins/DependencyWatcher/const',
   'i18n!DevtoolsTest',
   'Types/entity'
], function(mockChrome, View, ViewMode, dataLib, DWConst, rk, entityLib) {
   let sandbox;
   let instance;
   View = View.default;
   ViewMode = ViewMode.ViewMode;
   const Model = entityLib.Model;

   describe('DependencyWatcher/_main/View', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new View();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('__changeView', function() {
         it('should change source and update title and caption', function() {
            const fakeSource = {};
            const sourceStub = sandbox
               .stub(dataLib.source, 'Dependencies')
               .returns(fakeSource);

            instance.__changeView(ViewMode.dependency);

            assert.equal(instance._viewMode, ViewMode.dependency);
            assert.equal(instance._modeCaption, 'Dependency');
            assert.deepEqual(instance._modeTitle, rk('Зависимости модулей'));
            assert.isTrue(sourceStub.calledWithNew());
            assert.isTrue(
               sourceStub.calledOnceWithExactly(instance._sourceConfig)
            );
            assert.equal(instance._source, fakeSource);
         });

         it('should not update source because the mode has not changed', function() {
            const sourceStub = sandbox.stub(dataLib.source, 'Dependencies');

            instance.__changeView(ViewMode.dependent);

            assert.equal(instance._viewMode, ViewMode.dependent);
            assert.equal(instance._modeCaption, 'Dependent');
            assert.deepEqual(instance._modeTitle, rk('Зависимые модули'));
            assert.isTrue(sourceStub.notCalled);
         });
      });

      describe('_changeView', function() {
         it('should get an id of a mode from the model and call __changeView with it', function() {
            const changeViewStub = sandbox.stub(instance, '__changeView');

            instance._changeView(
               {},
               new Model({
                  rawData: {
                     id: ViewMode.dependency
                  },
                  idProperty: 'id'
               })
            );

            assert.isTrue(
               changeViewStub.calledOnceWithExactly(ViewMode.dependency)
            );
         });
      });

      describe('__onUpdate', function() {
         it('should reload the list', function() {
            instance._isRecording = true;
            instance._children = {
               moduleList: {
                  reload: sandbox.stub()
               }
            };

            instance.__onUpdate();

            assert.isTrue(
               instance._children.moduleList.reload.calledOnceWithExactly()
            );
         });

         it('should not reload the list', function() {
            instance._isRecording = false;
            instance._children = {
               moduleList: {
                  reload: sandbox.stub()
               }
            };

            instance.__onUpdate();

            assert.isTrue(instance._children.moduleList.reload.notCalled);
         });
      });

      describe('_beforeUnmount', function() {
         it('should destroy the channel', function() {
            const destructorStub = sandbox.stub(
               instance._channel,
               'destructor'
            );

            instance._beforeUnmount();

            assert.isTrue(destructorStub.calledOnceWithExactly());
         });
      });

      describe('_openSource', function() {
         it('should not call eval', async function() {
            sandbox
               .stub(instance._rpc, 'execute')
               .withArgs({
                  methodName: DWConst.RPCMethodNames.moduleOpenSource,
                  args: 1
               })
               .resolves(false);
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub()
               }
            });

            await instance._openSource({}, 1);

            assert.isTrue(chrome.devtools.inspectedWindow.eval.notCalled);
         });

         it('should call eval', async function() {
            sandbox
               .stub(instance._rpc, 'execute')
               .withArgs({
                  methodName: DWConst.RPCMethodNames.moduleOpenSource,
                  args: 1
               })
               .resolves(true);
            sandbox.stub(chrome, 'devtools').value({
               inspectedWindow: {
                  eval: sandbox.stub()
               }
            });

            await instance._openSource({}, 1);

            assert.isTrue(
               chrome.devtools.inspectedWindow.eval.calledOnceWithExactly(
                  'inspect(window.__WASABY_DEV_MODULE__)'
               )
            );
         });
      });

      describe('__toggleRecording', function() {
         it('should set _isRecording to true', function() {
            instance._isRecording = false;

            instance.__toggleRecording();

            assert.isTrue(instance._isRecording);
         });

         it('should set _isRecording to false', function() {
            instance._isRecording = true;

            instance.__toggleRecording();

            assert.isFalse(instance._isRecording);
         });
      });
   });
});
