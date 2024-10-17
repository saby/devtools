define([
   'injection/_dependencyWatcher/storage/Module',
   'injection/_dependencyWatcher/storage/Storage',
   'injection/_dependencyWatcher/storage/module/create',
   'DevtoolsTest/getJSDOM'
], function(ModuleStorage, Storage, create, getJSDOM) {
   let sandbox;
   ModuleStorage = ModuleStorage.ModuleStorage;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_dependencyWatcher/storage/Module', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.window = dom.window;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.window;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should create storage with correct index', function() {
            sandbox.stub(Storage, 'Storage');
            const onUpdateHandler = sandbox.stub();

            const instance = new ModuleStorage(onUpdateHandler);

            sinon.assert.calledWithExactly(Storage.Storage, 'name');
            assert.instanceOf(instance._storage, Storage.Storage);
            assert.equal(instance._onUpdate, onUpdateHandler);
            assert.isFalse(instance._wasRead);
         });
      });

      describe('define', function() {
         it('should create a new module and modules for its dependencies', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            sandbox.stub(instance._storage, 'add');
            const parentModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false
            };
            const childModule = {
               name: 'wml!Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false
            };
            const createStub = sandbox.stub(create, 'default');
            createStub
               .withArgs('Controls/Application', false)
               .returns(parentModule);
            createStub
               .withArgs('wml!Controls/Application', true)
               .returns(childModule);
            const expectedChildModule = {
               name: 'wml!Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false
            };
            const expectedParentModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: true,
               initialized: true,
               id: 1,
               dependencies: {
                  static: new Set([expectedChildModule]),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {
                  value: 123
               }
            };
            expectedChildModule.dependent.static.add(expectedParentModule);
            // setup end

            instance.define(
               'Controls/Application',
               ['require', 'wml!Controls/Application'],
               {
                  value: 123
               }
            );

            sinon.assert.calledWithExactly(instance._storage.add, parentModule);
            sinon.assert.calledWithExactly(instance._storage.add, childModule);
            assert.deepEqual(parentModule, expectedParentModule);
         });

         it('should create a new module without initializing it', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            sandbox.stub(instance._storage, 'add');
            const parentModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false
            };
            sandbox
               .stub(create, 'default')
               .withArgs('Controls/Application', false)
               .returns(parentModule);
            const moduleData = () => {};
            const expectedModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: true,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: moduleData
            };
            // setup end

            instance.define('Controls/Application', ['require'], moduleData);

            sinon.assert.calledWithExactly(instance._storage.add, parentModule);
            assert.deepEqual(parentModule, expectedModule);
         });
      });

      describe('initModule', function() {
         it('should initialize module without marking it as updated', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            const existingModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: true,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            sandbox
               .stub(instance._storage, 'getItemByIndex')
               .withArgs('Controls/Application')
               .returns(existingModule);
            // setup end

            instance.initModule('Controls/Application');

            assert.deepEqual(existingModule, {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: true,
               initialized: true,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(instance._updates, new Set());
            sinon.assert.notCalled(onUpdateHandler);
         });

         it('should initialize module and mark it as updated', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            instance._wasRead = true;
            const existingModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: true,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            sandbox
               .stub(instance._storage, 'getItemByIndex')
               .withArgs('Controls/Application')
               .returns(existingModule);
            // setup end

            instance.initModule('Controls/Application');

            assert.deepEqual(existingModule, {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: true,
               initialized: true,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(instance._updates, new Set([1]));
            sinon.assert.calledWithExactly(onUpdateHandler, 1);
         });
      });

      describe('require', function() {
         it('should wrap dependencies in array and add dynamic dependencies to the module', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            const existingParentModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            const existingChildModule = {
               name: 'OnlinePage/Template',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            const getItemByIndexStub = sandbox.stub(
               instance._storage,
               'getItemByIndex'
            );
            getItemByIndexStub
               .withArgs('Controls/Application')
               .returns(existingParentModule);
            getItemByIndexStub
               .withArgs('OnlinePage/Template')
               .returns(existingChildModule);
            // setup end

            instance.require('Controls/Application', 'OnlinePage/Template');

            assert.deepEqual(existingParentModule, {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set([existingChildModule])
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(existingChildModule, {
               name: 'OnlinePage/Template',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set([existingParentModule])
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(instance._updates, new Set());
            sinon.assert.notCalled(onUpdateHandler);
         });

         it('should add dynamic dependencies to the module', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            const existingParentModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            const existingChildModule = {
               name: 'OnlinePage/Template',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            const getItemByIndexStub = sandbox.stub(
               instance._storage,
               'getItemByIndex'
            );
            getItemByIndexStub
               .withArgs('Controls/Application')
               .returns(existingParentModule);
            getItemByIndexStub
               .withArgs('OnlinePage/Template')
               .returns(existingChildModule);
            // setup end

            instance.require('Controls/Application', ['OnlinePage/Template']);

            assert.deepEqual(existingParentModule, {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set([existingChildModule])
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(existingChildModule, {
               name: 'OnlinePage/Template',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set([existingParentModule])
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(instance._updates, new Set());
            sinon.assert.notCalled(onUpdateHandler);
         });

         it('should add dynamic dependencies to the module and mark it as updated', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            instance._wasRead = true;
            const existingParentModule = {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            const existingChildModule = {
               name: 'OnlinePage/Template',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            };
            const getItemByIndexStub = sandbox.stub(
               instance._storage,
               'getItemByIndex'
            );
            getItemByIndexStub
               .withArgs('Controls/Application')
               .returns(existingParentModule);
            getItemByIndexStub
               .withArgs('OnlinePage/Template')
               .returns(existingChildModule);
            // setup end

            instance.require('Controls/Application', 'OnlinePage/Template');

            assert.deepEqual(existingParentModule, {
               name: 'Controls/Application',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 1,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set([existingChildModule])
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set()
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(existingChildModule, {
               name: 'OnlinePage/Template',
               fileId: Number.MIN_SAFE_INTEGER,
               defined: false,
               initialized: false,
               id: 2,
               dependencies: {
                  static: new Set(),
                  dynamic: new Set()
               },
               dependent: {
                  static: new Set(),
                  dynamic: new Set([existingParentModule])
               },
               isDeprecated: false,
               data: {}
            });
            assert.deepEqual(instance._updates, new Set([1, 2]));
            sinon.assert.calledWithExactly(onUpdateHandler, 1);
         });
      });

      describe('getItems', function() {
         it('should take items from storage', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            sandbox
               .stub(instance._storage, 'getItemsById')
               .withArgs([1])
               .returns([
                  {
                     name: 'Controls/Application',
                     fileId: Number.MIN_SAFE_INTEGER,
                     defined: true,
                     initialized: false,
                     id: 1,
                     dependencies: {
                        static: new Set(),
                        dynamic: new Set()
                     },
                     dependent: {
                        static: new Set(),
                        dynamic: new Set()
                     },
                     isDeprecated: false,
                     data: {}
                  }
               ]);

            const result = instance.getItems([1]);

            assert.isTrue(instance._wasRead);
            assert.deepEqual(result, [
               {
                  name: 'Controls/Application',
                  fileId: Number.MIN_SAFE_INTEGER,
                  defined: true,
                  initialized: false,
                  id: 1,
                  dependencies: {
                     static: new Set(),
                     dynamic: new Set()
                  },
                  dependent: {
                     static: new Set(),
                     dynamic: new Set()
                  },
                  isDeprecated: false,
                  data: {}
               }
            ]);
         });
      });

      describe('openSource', function() {
         it('should save module.data on __WASABY_DEV_MODULE__', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            const moduleData = Object.freeze({
               value: 123
            });
            sandbox
               .stub(instance._storage, 'getItemById')
               .withArgs(1)
               .returns({
                  name: 'Controls/Application',
                  fileId: Number.MIN_SAFE_INTEGER,
                  defined: true,
                  initialized: false,
                  id: 1,
                  dependencies: {
                     static: new Set(),
                     dynamic: new Set()
                  },
                  dependent: {
                     static: new Set(),
                     dynamic: new Set()
                  },
                  isDeprecated: false,
                  data: moduleData
               });

            const result = instance.openSource(1);

            assert.equal(window.__WASABY_DEV_MODULE__, moduleData);
            assert.isTrue(result);

            // cleanup
            delete window.__WASABY_DEV_MODULE__;
         });
      });

      describe('hasUpdates', function() {
         it('should calculate state for each key and remove every these keys from updates', function() {
            const onUpdateHandler = sandbox.stub();
            const instance = new ModuleStorage(onUpdateHandler);
            instance._updates.add(1);
            instance._updates.add(3);
            instance._updates.add(4);

            const result = instance.hasUpdates([1, 2, 3]);

            assert.deepEqual(result, [true, false, true]);
            assert.deepEqual(instance._updates, new Set([4]));
         });
      });
   });
});
