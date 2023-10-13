define([
   'injection/_dependencyWatcher/define/proxy',
   'injection/_dependencyWatcher/define/getProxyModules',
   'injection/_dependencyWatcher/define/replaceDependency',
   'injection/const'
], function(proxyDefine, getProxyModules, replaceDependency, iConstants) {
   let sandbox;
   proxyDefine = proxyDefine.proxyDefine;

   describe('injection/_dependencyWatcher/define/proxy', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('should call target and return', function() {
         it('without arguments', function() {
            const clock = sinon.useFakeTimers();
            const expectedResult = {};
            const fakeDefine = sandbox
               .stub()
               .withArgs()
               .returns(expectedResult);
            const storage = {
               define: sandbox.stub(),
               initModule: sandbox.stub()
            };
            const proxyRequire = sandbox.stub();
            const proxyModules = {
               require: sandbox.stub().returns(proxyRequire)
            };
            sandbox
               .stub(getProxyModules, 'getProxyModules')
               .withArgs(storage)
               .returns(proxyModules);

            const defineProxy = proxyDefine(fakeDefine, storage);

            const result = defineProxy();

            assert.equal(result, expectedResult);

            clock.tick(0);

            sinon.assert.notCalled(storage.define);
            sinon.assert.notCalled(storage.initModule);

            // cleanup
            clock.restore();
         });

         it('with empty array as argument', function() {
            const clock = sinon.useFakeTimers();
            const expectedResult = {};
            const fakeDefine = sandbox
               .stub()
               .withArgs([])
               .returns(expectedResult);
            const storage = {
               define: sandbox.stub(),
               initModule: sandbox.stub()
            };
            const proxyRequire = sandbox.stub();
            const proxyModules = {
               require: sandbox.stub().returns(proxyRequire)
            };
            sandbox
               .stub(getProxyModules, 'getProxyModules')
               .withArgs(storage)
               .returns(proxyModules);

            const defineProxy = proxyDefine(fakeDefine, storage);

            const result = defineProxy([]);

            assert.equal(result, expectedResult);

            clock.tick(0);

            sinon.assert.notCalled(storage.define);
            sinon.assert.notCalled(storage.initModule);

            // cleanup
            clock.restore();
         });

         it('with one argument', function() {
            const clock = sinon.useFakeTimers();
            const expectedResult = {};
            const fakeDefine = sandbox
               .stub()
               .withArgs('Controls/Application')
               .returns(expectedResult);
            const storage = {
               define: sandbox.stub(),
               initModule: sandbox.stub()
            };
            const proxyRequire = sandbox.stub();
            const proxyModules = {
               require: sandbox.stub().returns(proxyRequire)
            };
            sandbox
               .stub(getProxyModules, 'getProxyModules')
               .withArgs(storage)
               .returns(proxyModules);

            const defineProxy = proxyDefine(fakeDefine, storage);

            const result = defineProxy('Controls/Application');

            assert.equal(result, expectedResult);

            clock.tick(0);

            sinon.assert.notCalled(storage.define);
            sinon.assert.notCalled(storage.initModule);

            // cleanup
            clock.restore();
         });

         it('with empty name', function() {
            const clock = sinon.useFakeTimers();
            const expectedResult = {};
            const callback = () => {};
            const fakeDefine = sandbox
               .stub()
               .withArgs('', callback)
               .returns(expectedResult);
            const storage = {
               define: sandbox.stub(),
               initModule: sandbox.stub()
            };
            const proxyRequire = sandbox.stub();
            const proxyModules = {
               require: sandbox.stub().returns(proxyRequire)
            };
            sandbox
               .stub(getProxyModules, 'getProxyModules')
               .withArgs(storage)
               .returns(proxyModules);

            const defineProxy = proxyDefine(fakeDefine, storage);

            const result = defineProxy('', callback);

            assert.equal(result, expectedResult);

            clock.tick(0);

            sinon.assert.notCalled(storage.define);
            sinon.assert.notCalled(storage.initModule);

            // cleanup
            clock.restore();
         });

         it('without name (only dependencies and callback)', function() {
            const clock = sinon.useFakeTimers();
            const expectedResult = {};
            const callback = () => {};
            const fakeDefine = sandbox
               .stub()
               .withArgs(['wml!Controls/Application'], callback)
               .returns(expectedResult);
            const storage = {
               define: sandbox.stub(),
               initModule: sandbox.stub()
            };
            const proxyRequire = sandbox.stub();
            const proxyModules = {
               require: sandbox.stub().returns(proxyRequire)
            };
            sandbox
               .stub(getProxyModules, 'getProxyModules')
               .withArgs(storage)
               .returns(proxyModules);

            const defineProxy = proxyDefine(fakeDefine, storage);

            const result = defineProxy(['wml!Controls/Application'], callback);

            assert.equal(result, expectedResult);

            clock.tick(0);

            sinon.assert.notCalled(storage.define);
            sinon.assert.notCalled(storage.initModule);

            // cleanup
            clock.restore();
         });
      });

      describe('when module is an object should define module without initializing it', function() {
         it('module without dependencies', function() {
            const clock = sinon.useFakeTimers();
            const module = {};
            const expectedResult = {};
            const fakeDefine = sandbox
               .stub()
               .withArgs('objectModule', module)
               .returns(expectedResult);
            const storage = {
               define: sandbox.stub(),
               initModule: sandbox.stub()
            };
            const proxyRequire = sandbox.stub();
            const proxyModules = {
               require: sandbox.stub().returns(proxyRequire)
            };
            sandbox
               .stub(getProxyModules, 'getProxyModules')
               .withArgs(storage)
               .returns(proxyModules);

            const defineProxy = proxyDefine(fakeDefine, storage);

            const result = defineProxy('objectModule', module);

            assert.equal(result, expectedResult);
            sinon.assert.notCalled(storage.define);
            sinon.assert.notCalled(storage.initModule);

            clock.tick(0);

            sinon.assert.calledWithExactly(
               storage.define,
               'objectModule',
               [],
               module
            );
            sinon.assert.notCalled(storage.initModule);

            // cleanup
            clock.restore();
         });

         it('module with dependencies', function() {
            const clock = sinon.useFakeTimers();
            const module = {};
            const expectedResult = {};
            const fakeDefine = sandbox
               .stub()
               .withArgs('objectModule', ['dependency'], module)
               .returns(expectedResult);
            const storage = {
               define: sandbox.stub(),
               initModule: sandbox.stub()
            };
            const proxyRequire = sandbox.stub();
            const proxyModules = {
               require: sandbox.stub().returns(proxyRequire)
            };
            sandbox
               .stub(getProxyModules, 'getProxyModules')
               .withArgs(storage)
               .returns(proxyModules);

            const defineProxy = proxyDefine(fakeDefine, storage);

            const result = defineProxy('objectModule', ['dependency'], module);

            assert.equal(result, expectedResult);
            sinon.assert.notCalled(storage.define);
            sinon.assert.notCalled(storage.initModule);

            clock.tick(0);

            sinon.assert.calledWithExactly(
               storage.define,
               'objectModule',
               ['dependency'],
               module
            );
            sinon.assert.notCalled(storage.initModule);

            // cleanup
            clock.restore();
         });
      });

      it('should replace dependencies', function() {
         const clock = sinon.useFakeTimers();
         const module = sandbox.stub();
         const expectedResult = {};
         const fakeRequire = () => {};
         const template = () => {};
         const fakeDefine = sandbox
            .stub()
            .callsArgWith(2, fakeRequire, template)
            .returns(expectedResult);
         const storage = {
            define: sandbox.stub(),
            initModule: sandbox.stub()
         };
         const proxyRequire = sandbox.stub();
         const proxyModules = {
            require: sandbox.stub().returns(proxyRequire)
         };
         sandbox
            .stub(getProxyModules, 'getProxyModules')
            .withArgs(storage)
            .returns(proxyModules);
         sandbox
            .stub(replaceDependency, 'replaceDependencies')
            .withArgs({
               proxyModules,
               dependencies: ['require', 'wml!Controls/Application'],
               moduleName: 'Controls/Application',
               args: [fakeRequire, template]
            })
            .returns([proxyRequire, template]);

         const defineProxy = proxyDefine(fakeDefine, storage);

         const result = defineProxy(
            'Controls/Application',
            ['require', 'wml!Controls/Application'],
            module
         );

         assert.equal(result, expectedResult);
         sinon.assert.notCalled(storage.define);
         sinon.assert.notCalled(storage.initModule);
         sinon.assert.calledOn(module, iConstants.GLOBAL);
         sinon.assert.calledWithExactly(module, proxyRequire, template);

         clock.tick(0);

         sinon.assert.calledWithExactly(
            storage.define,
            'Controls/Application',
            ['require', 'wml!Controls/Application'],
            module
         );
         sinon.assert.calledWithExactly(
            storage.initModule,
            'Controls/Application'
         );

         // cleanup
         clock.restore();
      });

      it('should not replace dependencies', function() {
         const clock = sinon.useFakeTimers();
         const module = sandbox.stub();
         const expectedResult = {};
         const template = () => {};
         const fakeDefine = sandbox
            .stub()
            .callsArgWith(3, template)
            .returns(expectedResult);
         const storage = {
            define: sandbox.stub(),
            initModule: sandbox.stub()
         };
         const proxyRequire = sandbox.stub();
         const proxyModules = {
            require: sandbox.stub().returns(proxyRequire)
         };
         sandbox
            .stub(getProxyModules, 'getProxyModules')
            .withArgs(storage)
            .returns(proxyModules);
         sandbox
            .stub(replaceDependency, 'replaceDependencies')
            .withArgs({
               proxyModules,
               dependencies: ['wml!Controls/Application'],
               moduleName: 'Controls/Application',
               args: [template]
            })
            .returns([template]);

         const defineProxy = proxyDefine(fakeDefine, storage);

         const result = defineProxy(
            'Controls/Application',
            ['wml!Controls/Application'],
            module
         );

         assert.equal(result, expectedResult);
         sinon.assert.notCalled(storage.define);
         sinon.assert.notCalled(storage.initModule);
         sinon.assert.calledOn(module, iConstants.GLOBAL);
         sinon.assert.calledWithExactly(module, template);

         clock.tick(0);

         sinon.assert.calledWithExactly(
            storage.define,
            'Controls/Application',
            ['wml!Controls/Application'],
            module
         );
         sinon.assert.calledWithExactly(
            storage.initModule,
            'Controls/Application'
         );

         // cleanup
         clock.restore();
      });
   });
});
