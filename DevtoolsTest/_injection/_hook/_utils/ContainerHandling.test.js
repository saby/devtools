define([
   'injection/_hook/_utils/ContainerHandling',
   'DevtoolsTest/getJSDOM'
], function(ContainerHandling, getJSDOM) {
   describe('injection/_hook/_utils/ContainerHandling', function() {
      let sandbox;
      const needJSDOM = typeof window === 'undefined';

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

      function createNestedContainer(depth) {
         const result = document.createElement('div');

         let currentElement = result;
         for (let i = 0; i < depth; i++) {
            const parent = document.createElement('div');
            parent.appendChild(currentElement);
            currentElement = parent;
         }

         return result;
      }

      describe('getRef', function() {
         let idToContainers;
         let idToParentId;
         let domToIds;

         beforeEach(function() {
            idToContainers = new Map();
            idToParentId = new Map();
            domToIds = new WeakMap();
         });

         it('should create a new ref which will link container to the id when called', function() {
            const ref = ContainerHandling.getRef(
               idToContainers,
               idToParentId,
               domToIds,
               0
            );

            assert.deepEqual(idToContainers, new Map());
            assert.isUndefined(domToIds.get(document.body));

            ref(document.body);

            assert.deepEqual(idToContainers, new Map([[0, [document.body]]]));
            assert.deepEqual(domToIds.get(document.body), [0]);
         });

         it('should create a new ref which will link container to the id when called and also call childRef', function() {
            const childRef = sandbox.stub();
            const ref = ContainerHandling.getRef(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               childRef
            );

            assert.deepEqual(idToContainers, new Map());
            assert.isUndefined(domToIds.get(document.body));
            sinon.assert.notCalled(childRef);

            ref(document.body);

            assert.deepEqual(idToContainers, new Map([[0, [document.body]]]));
            assert.deepEqual(domToIds.get(document.body), [0]);
            sinon.assert.calledWithExactly(childRef, document.body);
         });

         it('should return childRef if it was created by devtools', function() {
            const childRef = ContainerHandling.getRef(
               idToContainers,
               idToParentId,
               domToIds,
               0
            );

            const ref = ContainerHandling.getRef(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               childRef
            );

            assert.equal(ref, childRef);
         });
      });

      describe('updateContainer', function() {
         let idToContainers;
         let idToParentId;
         let domToIds;

         beforeEach(function() {
            idToContainers = new Map();
            idToParentId = new Map();
            domToIds = new WeakMap();
         });

         it('should not do anything because the newContainer and the oldContainer are the same', function() {
            const container = document.createElement('div');

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               container,
               container
            );

            assert.deepEqual(idToContainers, new Map());
            assert.isUndefined(domToIds.get(container));
         });

         it("should not do anything because the container doesn't exist", function() {
            const container = document.createElement('div');

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               null
            );

            assert.deepEqual(idToContainers, new Map());
            assert.isUndefined(domToIds.get(container));
         });

         it('should add a new container', function() {
            const container = document.createElement('div');

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               container
            );

            assert.deepEqual(idToContainers, new Map([[0, [container]]]));
            assert.deepEqual(domToIds.get(container), [0]);
         });

         it('should not add the same container twice, even if the oldContainer is not passed', function() {
            const container = document.createElement('span');
            idToContainers.set(0, [container]);
            domToIds.set(container, [0]);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               container
            );

            assert.deepEqual(idToContainers, new Map([[0, [container]]]));
            assert.deepEqual(domToIds.get(container), [0]);
         });

         it('should add a new container and remove the old one', function() {
            const oldContainer = document.createElement('span');
            const newContainer = document.createElement('div');
            idToContainers.set(0, [oldContainer]);
            domToIds.set(oldContainer, [0]);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               newContainer,
               oldContainer
            );

            assert.deepEqual(idToContainers, new Map([[0, [newContainer]]]));
            assert.isUndefined(domToIds.get(oldContainer));
            assert.deepEqual(domToIds.get(newContainer), [0]);
         });

         it('should add a new container to the existing list of containers, because they have the same parentElement', function() {
            const oldContainer = document.createElement('span');
            const newContainer = document.createElement('div');
            idToContainers.set(0, [oldContainer]);
            domToIds.set(oldContainer, [0]);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               newContainer
            );

            assert.deepEqual(
               idToContainers,
               new Map([[0, [oldContainer, newContainer]]])
            );
            assert.deepEqual(domToIds.get(oldContainer), [0]);
            assert.deepEqual(domToIds.get(newContainer), [0]);
         });

         it('should add a new container and delete the old ones, because they have a higher depth', function() {
            const oldContainer = createNestedContainer(3);
            const anotherOldContainer = createNestedContainer(3);
            const newContainer = createNestedContainer(2);
            idToContainers.set(0, [oldContainer, anotherOldContainer]);
            domToIds.set(oldContainer, [0]);
            domToIds.set(anotherOldContainer, [0]);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               newContainer
            );

            assert.deepEqual(idToContainers, new Map([[0, [newContainer]]]));
            assert.isUndefined(domToIds.get(oldContainer));
            assert.isUndefined(domToIds.get(anotherOldContainer));
            assert.deepEqual(domToIds.get(newContainer), [0]);
         });

         it('should add a new container to the existing list of containers, because they have the same depth', function() {
            const oldContainer = createNestedContainer(2);
            const anotherOldContainer = createNestedContainer(2);
            const newContainer = createNestedContainer(2);
            idToContainers.set(0, [oldContainer, anotherOldContainer]);
            domToIds.set(oldContainer, [0]);
            domToIds.set(anotherOldContainer, [0]);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               newContainer
            );

            assert.deepEqual(
               idToContainers,
               new Map([[0, [oldContainer, anotherOldContainer, newContainer]]])
            );
            assert.deepEqual(domToIds.get(oldContainer), [0]);
            assert.deepEqual(domToIds.get(anotherOldContainer), [0]);
            assert.deepEqual(domToIds.get(newContainer), [0]);
         });

         it('should NOT add a new container to the existing list of containers, because it has a higher depth', function() {
            const oldContainer = createNestedContainer(2);
            const anotherOldContainer = createNestedContainer(2);
            const newContainer = createNestedContainer(3);
            idToContainers.set(0, [oldContainer, anotherOldContainer]);
            domToIds.set(oldContainer, [0]);
            domToIds.set(anotherOldContainer, [0]);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               0,
               newContainer
            );

            assert.deepEqual(
               idToContainers,
               new Map([[0, [oldContainer, anotherOldContainer]]])
            );
            assert.deepEqual(domToIds.get(oldContainer), [0]);
            assert.deepEqual(domToIds.get(anotherOldContainer), [0]);
            assert.isUndefined(domToIds.get(newContainer));
         });

         it('should add a new container to the element and its parent', function() {
            const container = document.createElement('div');
            idToParentId.set(1, 0);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               1,
               container
            );

            assert.deepEqual(
               idToContainers,
               new Map([
                  [0, [container]],
                  [1, [container]]
               ])
            );
            assert.deepEqual(domToIds.get(container), [0, 1]);
         });

         it('should remove a container from the element and its parent', function() {
            const container = document.createElement('div');
            idToParentId.set(1, 0);
            idToContainers.set(0, [container]);
            idToContainers.set(1, [container]);
            domToIds.set(container, [0, 1]);

            ContainerHandling.updateContainer(
               idToContainers,
               idToParentId,
               domToIds,
               1,
               null,
               container
            );

            assert.deepEqual(idToContainers, new Map());
            assert.isUndefined(domToIds.get(container));
         });
      });
   });
});
