define([
   'injection/DependencyWatcher',
   'injection/_dependencyWatcher/storage/Module',
   'injection/_dependencyWatcher/Require',
   'injection/_dependencyWatcher/Define',
   'injection/_dependencyWatcher/registerRPCMethods',
   'Extension/Event/RPC',
   'injection/const'
], function(
   DependencyWatcher,
   ModuleStorage,
   Require,
   Define,
   registerRPCMethods,
   RPC,
   injectionConstants
) {
   let sandbox;
   DependencyWatcher = DependencyWatcher.DependencyWatcher;

   describe('injection/DependencyWatcher', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('getName', function() {
         assert.equal(DependencyWatcher.getName(), 'dependency-watcher');
      });

      describe('constructor', function() {
         it('should not touch existing require and define on global object because this is definitely not a wasaby page (require is configurable)', function() {
            const fakeGlobal = {};
            const existingRequireDescriptor = {
               value: undefined,
               writable: false,
               enumerable: true,
               configurable: true
            };
            Object.defineProperty(
               fakeGlobal,
               'require',
               existingRequireDescriptor
            );
            sandbox.stub(injectionConstants, 'GLOBAL').value(fakeGlobal);

            const channel = {};
            const requireLogger = {};
            const logger = {
               create: sandbox
                  .stub()
                  .withArgs('require')
                  .returns(requireLogger)
            };
            const fakeRequire = {
               getDescriptor: sandbox.stub()
            };
            sandbox.stub(Require, 'Require').returns(fakeRequire);
            const fakeDefine = {
               getDescriptor: sandbox.stub()
            };
            sandbox.stub(Define, 'Define').returns(fakeDefine);
            sandbox.stub(registerRPCMethods, 'default');
            const fakeRPC = {};
            sandbox
               .stub(RPC, 'RPC')
               .withArgs({
                  channel
               })
               .returns(fakeRPC);
            // setup end

            const instance = new DependencyWatcher({
               channel,
               logger
            });

            assert.equal(instance._channel, channel);
            assert.equal(instance._logger, logger);
            assert.instanceOf(instance._storage, ModuleStorage.ModuleStorage);
            sinon.assert.calledWithNew(Require.Require);
            sinon.assert.calledWithExactly(Require.Require, {
               moduleStorage: instance._storage,
               logger: requireLogger
            });
            sinon.assert.calledWithNew(Define.Define);
            sinon.assert.calledWithExactly(Define.Define, {
               moduleStorage: instance._storage
            });
            sinon.assert.calledWithExactly(registerRPCMethods.default, {
               rpc: fakeRPC,
               require: fakeRequire,
               logger,
               moduleStorage: instance._storage
            });
            assert.deepEqual(
               Object.getOwnPropertyDescriptor(fakeGlobal, 'require'),
               existingRequireDescriptor
            );
            assert.isFalse(Object.hasOwnProperty(fakeGlobal, 'define'));
         });

         it('should define proxies for require and define on global object', function() {
            const fakeGlobal = {};
            sandbox.stub(injectionConstants, 'GLOBAL').value(fakeGlobal);

            const channel = {};
            const requireLogger = {};
            const logger = {
               create: sandbox
                  .stub()
                  .withArgs('require')
                  .returns(requireLogger)
            };
            const requireDescriptor = {
               set: () => {},
               get: () => {},
               configurable: true,
               enumerable: true
            };
            const fakeRequire = {
               getDescriptor: sandbox.stub().returns(requireDescriptor)
            };
            sandbox.stub(Require, 'Require').returns(fakeRequire);
            const defineDescriptor = {
               set: () => {},
               get: () => {},
               configurable: true,
               enumerable: true
            };
            const fakeDefine = {
               getDescriptor: sandbox.stub().returns(defineDescriptor)
            };
            sandbox.stub(Define, 'Define').returns(fakeDefine);
            sandbox.stub(registerRPCMethods, 'default');
            const fakeRPC = {};
            sandbox
               .stub(RPC, 'RPC')
               .withArgs({
                  channel
               })
               .returns(fakeRPC);
            // setup end

            const instance = new DependencyWatcher({
               channel,
               logger
            });

            assert.equal(instance._channel, channel);
            assert.equal(instance._logger, logger);
            assert.instanceOf(instance._storage, ModuleStorage.ModuleStorage);
            sinon.assert.calledWithNew(Require.Require);
            sinon.assert.calledWithExactly(Require.Require, {
               moduleStorage: instance._storage,
               logger: requireLogger
            });
            sinon.assert.calledWithNew(Define.Define);
            sinon.assert.calledWithExactly(Define.Define, {
               moduleStorage: instance._storage
            });
            sinon.assert.calledWithExactly(registerRPCMethods.default, {
               rpc: fakeRPC,
               require: fakeRequire,
               logger,
               moduleStorage: instance._storage
            });
            assert.deepEqual(
               Object.getOwnPropertyDescriptor(fakeGlobal, 'require'),
               requireDescriptor
            );
            assert.deepEqual(
               Object.getOwnPropertyDescriptor(fakeGlobal, 'define'),
               defineDescriptor
            );
         });

         it('should overwrite existing require and define with proxies', function() {
            const fakeGlobal = {};
            const existingRequireDescriptor = {
               value: undefined,
               writable: true,
               enumerable: true,
               configurable: false
            };
            Object.defineProperty(
               fakeGlobal,
               'require',
               existingRequireDescriptor
            );
            sandbox.stub(injectionConstants, 'GLOBAL').value(fakeGlobal);

            const channel = {};
            const requireLogger = {};
            const logger = {
               create: sandbox
                  .stub()
                  .withArgs('require')
                  .returns(requireLogger)
            };
            const proxyRequire = sandbox.stub();
            const requireDescriptor = {
               set: () => {},
               get: () => proxyRequire,
               configurable: true,
               enumerable: true
            };
            const fakeRequire = {
               getDescriptor: sandbox.stub().returns(requireDescriptor)
            };
            sandbox.stub(Require, 'Require').returns(fakeRequire);
            const defineDescriptor = {
               set: () => {},
               get: () => {},
               configurable: true,
               enumerable: true
            };
            const fakeDefine = {
               getDescriptor: sandbox.stub().returns(defineDescriptor)
            };
            sandbox.stub(Define, 'Define').returns(fakeDefine);
            sandbox.stub(registerRPCMethods, 'default');
            const fakeRPC = {};
            sandbox
               .stub(RPC, 'RPC')
               .withArgs({
                  channel
               })
               .returns(fakeRPC);
            // setup end

            const instance = new DependencyWatcher({
               channel,
               logger
            });

            assert.equal(instance._channel, channel);
            assert.equal(instance._logger, logger);
            assert.instanceOf(instance._storage, ModuleStorage.ModuleStorage);
            sinon.assert.calledWithNew(Require.Require);
            sinon.assert.calledWithExactly(Require.Require, {
               moduleStorage: instance._storage,
               logger: requireLogger
            });
            sinon.assert.calledWithNew(Define.Define);
            sinon.assert.calledWithExactly(Define.Define, {
               moduleStorage: instance._storage
            });
            sinon.assert.calledWithExactly(registerRPCMethods.default, {
               rpc: fakeRPC,
               require: fakeRequire,
               logger,
               moduleStorage: instance._storage
            });
            assert.equal(fakeGlobal.require, proxyRequire);
            assert.deepEqual(
               Object.getOwnPropertyDescriptor(fakeGlobal, 'define'),
               defineDescriptor
            );
         });

         it('should log warning because some modules are already defined', function() {
            const fakeGlobal = {};
            sandbox.stub(injectionConstants, 'GLOBAL').value(fakeGlobal);

            const channel = {};
            const requireLogger = {};
            const logger = {
               create: sandbox
                  .stub()
                  .withArgs('require')
                  .returns(requireLogger),
               warn: sandbox.stub()
            };
            const requireDescriptor = {
               set: () => {},
               get: () => {
                  return {
                     s: {
                        contexts: {
                           _: {
                              defined: {
                                 'Controls/Application': {},
                                 'Types/entity': {}
                              }
                           }
                        }
                     }
                  };
               },
               configurable: true,
               enumerable: true
            };
            const fakeRequire = {
               getDescriptor: sandbox.stub().returns(requireDescriptor)
            };
            sandbox.stub(Require, 'Require').returns(fakeRequire);
            const defineDescriptor = {
               set: () => {},
               get: () => {},
               configurable: true,
               enumerable: true
            };
            const fakeDefine = {
               getDescriptor: sandbox.stub().returns(defineDescriptor)
            };
            sandbox.stub(Define, 'Define').returns(fakeDefine);
            sandbox.stub(registerRPCMethods, 'default');
            const fakeRPC = {};
            sandbox
               .stub(RPC, 'RPC')
               .withArgs({
                  channel
               })
               .returns(fakeRPC);
            // setup end

            const instance = new DependencyWatcher({
               channel,
               logger
            });

            assert.equal(instance._channel, channel);
            assert.equal(instance._logger, logger);
            assert.instanceOf(instance._storage, ModuleStorage.ModuleStorage);
            sinon.assert.calledWithNew(Require.Require);
            sinon.assert.calledWithExactly(Require.Require, {
               moduleStorage: instance._storage,
               logger: requireLogger
            });
            sinon.assert.calledWithNew(Define.Define);
            sinon.assert.calledWithExactly(Define.Define, {
               moduleStorage: instance._storage
            });
            sinon.assert.calledWithExactly(registerRPCMethods.default, {
               rpc: fakeRPC,
               require: fakeRequire,
               logger,
               moduleStorage: instance._storage
            });
            assert.deepEqual(
               Object.getOwnPropertyDescriptor(fakeGlobal, 'require'),
               requireDescriptor
            );
            assert.deepEqual(
               Object.getOwnPropertyDescriptor(fakeGlobal, 'define'),
               defineDescriptor
            );
            sinon.assert.calledWithExactly(
               logger.warn,
               'Не удалось вовремя переопределить require, возможны проблемы с модулями: Controls/Application,Types/entity'
            );
         });
      });
   });
});
