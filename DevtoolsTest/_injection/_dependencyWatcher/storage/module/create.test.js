define([
   'injection/_dependencyWatcher/storage/module/create',
   'injection/_dependencyWatcher/storage/getId',
   'injection/_dependencyWatcher/storage/module/isDeprecated',
   'Extension/Plugins/DependencyWatcher/const'
], function(create, getId, isDeprecated, dwConstants) {
   let sandbox;
   create = create.default;

   describe('injection/_dependencyWatcher/storage/module/create', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should initialize the root module', function() {
         sandbox.stub(getId, 'getId').returns(123);
         sandbox
            .stub(isDeprecated, 'default')
            .withArgs(dwConstants.GLOBAL_MODULE_NAME)
            .returns(true);

         const result = create(dwConstants.GLOBAL_MODULE_NAME, false);

         assert.deepEqual(result, {
            name: dwConstants.GLOBAL_MODULE_NAME,
            fileId: Number.MIN_SAFE_INTEGER,
            defined: true,
            initialized: true,
            id: 123,
            dependencies: {
               static: new Set(),
               dynamic: new Set()
            },
            dependent: {
               static: new Set(),
               dynamic: new Set()
            },
            isDeprecated: true
         });
      });

      it('should create module without initializing because its parent is not defined', function() {
         sandbox.stub(getId, 'getId').returns(123);
         sandbox
            .stub(isDeprecated, 'default')
            .withArgs('Controls/Application')
            .returns(true);

         const result = create('Controls/Application', false);

         assert.deepEqual(result, {
            name: 'Controls/Application',
            fileId: Number.MIN_SAFE_INTEGER,
            defined: false,
            initialized: false,
            id: 123,
            dependencies: {
               static: new Set(),
               dynamic: new Set()
            },
            dependent: {
               static: new Set(),
               dynamic: new Set()
            },
            isDeprecated: true
         });
      });

      it('should create module without initializing because module doesn\'t have correct plugin in its name', function() {
         sandbox.stub(getId, 'getId').returns(123);
         sandbox
            .stub(isDeprecated, 'default')
            .withArgs('Controls/Application')
            .returns(true);

         const result = create('Controls/Application', true);

         assert.deepEqual(result, {
            name: 'Controls/Application',
            fileId: Number.MIN_SAFE_INTEGER,
            defined: false,
            initialized: false,
            id: 123,
            dependencies: {
               static: new Set(),
               dynamic: new Set()
            },
            dependent: {
               static: new Set(),
               dynamic: new Set()
            },
            isDeprecated: true
         });
      });

      it('should create module and initialize it (json)', function() {
         sandbox.stub(getId, 'getId').returns(123);
         sandbox
            .stub(isDeprecated, 'default')
            .withArgs('json!Controls/Application')
            .returns(true);

         const result = create('json!Controls/Application', true);

         assert.deepEqual(result, {
            name: 'json!Controls/Application',
            fileId: Number.MIN_SAFE_INTEGER,
            defined: true,
            initialized: true,
            id: 123,
            dependencies: {
               static: new Set(),
               dynamic: new Set()
            },
            dependent: {
               static: new Set(),
               dynamic: new Set()
            },
            isDeprecated: true
         });
      });

      it('should create module and initialize it (css)', function() {
         sandbox.stub(getId, 'getId').returns(123);
         sandbox
            .stub(isDeprecated, 'default')
            .withArgs('css!Controls/Application')
            .returns(true);

         const result = create('css!Controls/Application', true);

         assert.deepEqual(result, {
            name: 'css!Controls/Application',
            fileId: Number.MIN_SAFE_INTEGER,
            defined: true,
            initialized: true,
            id: 123,
            dependencies: {
               static: new Set(),
               dynamic: new Set()
            },
            dependent: {
               static: new Set(),
               dynamic: new Set()
            },
            isDeprecated: true
         });
      });
   });
});
