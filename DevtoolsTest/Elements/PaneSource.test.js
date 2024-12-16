define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Pane/Source',
   'Types/collection',
   'Types/source',
   'Types/entity',
   'Elements/_utils/hydrate'
], function(
   mockChrome,
   PaneSource,
   collectionLib,
   sourceLib,
   entityLib,
   hydrateLib
) {
   let sandbox;
   PaneSource = PaneSource.Source;
   INSPECTED_ITEM_META = hydrateLib.INSPECTED_ITEM_META;

   describe('Elements/_Details/Pane/Source', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should correctly initialize state', function() {
            const store = {};
            const options = {
               data: {
                  text: '123',
                  items: [1, 2, 3],
                  nullValue: null,
                  emptyObject: {},
                  emptyArray: [],
                  object: {
                     key: 1,
                     anotherKey: 2,
                     dehydratedEmptyArr: {
                        [INSPECTED_ITEM_META.type]: 'array',
                        [INSPECTED_ITEM_META.caption]: 'Array[0]',
                        [INSPECTED_ITEM_META.expandable]: false
                     },
                     dehydratedObj: {
                        [INSPECTED_ITEM_META.type]: 'object',
                        [INSPECTED_ITEM_META.caption]: 'Object',
                        [INSPECTED_ITEM_META.expandable]: true
                     }
                  },
                  undef: undefined
               },
               root: 'Options',
               controlId: 0,
               store
            };

            const instance = new PaneSource(options);

            assert.deepEqual(instance._data, [
               {
                  key: 'text',
                  caption: '123',
                  name: 'text',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:StringTemplate'
               },
               {
                  key: 'items',
                  caption: 'Array[3]',
                  name: 'items',
                  parent: null,
                  hasChildren: true,
                  template: 'Elements/elements:ObjectTemplate'
               },
               {
                  key: '0---items',
                  caption: '1',
                  name: '0',
                  parent: 'items',
                  hasChildren: null,
                  template: 'Elements/elements:NumberTemplate'
               },
               {
                  key: '1---items',
                  caption: '2',
                  name: '1',
                  parent: 'items',
                  hasChildren: null,
                  template: 'Elements/elements:NumberTemplate'
               },
               {
                  key: '2---items',
                  caption: '3',
                  name: '2',
                  parent: 'items',
                  hasChildren: null,
                  template: 'Elements/elements:NumberTemplate'
               },
               {
                  key: 'nullValue',
                  caption: 'null',
                  name: 'nullValue',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:ObjectTemplate'
               },
               {
                  key: 'emptyObject',
                  caption: 'Empty object',
                  name: 'emptyObject',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:ObjectTemplate'
               },
               {
                  key: 'emptyArray',
                  caption: 'Array[0]',
                  name: 'emptyArray',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:ObjectTemplate'
               },
               {
                  key: 'object',
                  caption: 'Object',
                  name: 'object',
                  parent: null,
                  hasChildren: true,
                  template: 'Elements/elements:ObjectTemplate'
               },
               {
                  key: 'key---object',
                  caption: '1',
                  name: 'key',
                  parent: 'object',
                  hasChildren: null,
                  template: 'Elements/elements:NumberTemplate'
               },
               {
                  key: 'anotherKey---object',
                  caption: '2',
                  name: 'anotherKey',
                  parent: 'object',
                  hasChildren: null,
                  template: 'Elements/elements:NumberTemplate'
               },
               {
                  key: 'dehydratedEmptyArr---object',
                  caption: 'Array[0]',
                  name: 'dehydratedEmptyArr',
                  parent: 'object',
                  hasChildren: null,
                  template: 'Elements/elements:ObjectTemplate'
               },
               {
                  key: 'dehydratedObj---object',
                  caption: 'Object',
                  name: 'dehydratedObj',
                  parent: 'object',
                  hasChildren: true,
                  template: 'Elements/elements:ObjectTemplate'
               },
               {
                  key: 'undef',
                  caption: 'undefined',
                  name: 'undef',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:UndefinedTemplate'
               }
            ]);
            assert.strictEqual(instance._store, store);
            assert.equal(instance._controlId, 0);
            assert.equal(instance._root, 'options');
         });
      });

      describe('create', function() {
         it('should create new record using meta and resolve promise with it', async function() {
            const meta = {
               value: '123'
            };
            sandbox.stub(entityLib, 'Record');
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  }
               ],
               root: 'Options'
            });

            const result = await instance.create(meta);

            assert.instanceOf(result, entityLib.Record);
            sinon.assert.calledWithExactly(entityLib.Record, {
               rawData: meta
            });
            sinon.assert.calledWithNew(entityLib.Record);
         });
      });

      describe('read', function() {
         it('should find the item by key and resolve promise with it', async function() {
            sandbox.stub(entityLib, 'Record');
            const instance = new PaneSource({
               data: {
                  text: '123'
               },
               root: 'Options'
            });

            const result = await instance.read('text');

            assert.instanceOf(result, entityLib.Record);
            sinon.assert.calledWithExactly(entityLib.Record, {
               rawData: {
                  key: 'text',
                  caption: '123',
                  name: 'text',
                  parent: null,
                  hasChildren: null,
                  template: 'Elements/elements:StringTemplate'
               }
            });
            sinon.assert.calledWithNew(entityLib.Record);
         });
      });

      describe('update', function() {
         it('should transform record and update one item', async function() {
            const instance = new PaneSource({
               data: {
                  text: '123'
               },
               root: 'Options'
            });
            sandbox.stub(instance, '__updateItem');

            await instance.update(
               new entityLib.Record({
                  rawData: {
                     key: 'text',
                     value: '456',
                     name: 'text',
                     parent: null,
                     hasChildren: null,
                     template: 'Elements/elements:StringTemplate'
                  }
               })
            );

            sinon.assert.calledWithExactly(instance.__updateItem, {
               key: 'text',
               value: '456',
               name: 'text',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });
         });

         it('should transform recordSet and update multiple items', async function() {
            const instance = new PaneSource({
               data: {},
               root: 'Options'
            });
            sandbox.stub(instance, '__updateItem');

            await instance.update(
               new collectionLib.RecordSet({
                  rawData: [
                     {
                        key: 'text',
                        caption: '123',
                        name: 'text',
                        parent: null,
                        hasChildren: null,
                        template: 'Elements/elements:StringTemplate'
                     },
                     {
                        key: 'text2',
                        caption: '456',
                        name: 'text2',
                        parent: null,
                        hasChildren: null,
                        template: 'Elements/elements:StringTemplate'
                     }
                  ],
                  keyProperty: 'key'
               })
            );

            sinon.assert.calledTwice(instance.__updateItem);
            sinon.assert.calledWithExactly(instance.__updateItem, {
               key: 'text',
               caption: '123',
               name: 'text',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });
            sinon.assert.calledWithExactly(instance.__updateItem, {
               key: 'text2',
               caption: '456',
               name: 'text2',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });
         });

         it('should transform object and update one item', async function() {
            const instance = new PaneSource({
               data: {
                  text: '123'
               },
               root: 'Options'
            });
            sandbox.stub(instance, '__updateItem');

            await instance.update({
               text: '456'
            });

            sinon.assert.calledWithExactly(instance.__updateItem, {
               key: 'text',
               caption: '456',
               name: 'text',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });
         });
      });

      describe('__updateItem', function() {
         it('item exists, so it should get updated', async function() {
            const instance = new PaneSource({
               data: {
                  text: '123'
               },
               root: 'Options'
            });

            await instance.__updateItem({
               key: 'text',
               value: '456',
               name: 'text',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });

            assert.deepEqual(instance._data[0], {
               key: 'text',
               value: '456',
               name: 'text',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });
            assert.equal(instance._data.length, 1);
         });

         it('item does not exist, so it should get appended to data', async function() {
            const instance = new PaneSource({
               data: {},
               root: 'Options'
            });

            await instance.__updateItem({
               key: 'text',
               value: '456',
               name: 'text',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });

            assert.deepEqual(instance._data[0], {
               key: 'text',
               value: '456',
               name: 'text',
               parent: null,
               hasChildren: null,
               template: 'Elements/elements:StringTemplate'
            });
         });
      });

      describe('destroy', function() {
         it('should delete one item', async function() {
            const instance = new PaneSource({
               data: {
                  text: '123'
               },
               root: 'Options'
            });
            sandbox.stub(instance, '__deleteItem');

            await instance.destroy('text');

            sinon.assert.calledWithExactly(instance.__deleteItem, 'text');
         });

         it('should delete multiple items', async function() {
            const instance = new PaneSource({
               data: {
                  text: '123',
                  items: [1, 2, 3]
               },
               root: 'Options'
            });
            sandbox.stub(instance, '__deleteItem');

            await instance.destroy(['text', 'items']);

            sinon.assert.calledTwice(instance.__deleteItem);
            sinon.assert.calledWithExactly(instance.__deleteItem, 'text');
            sinon.assert.calledWithExactly(instance.__deleteItem, 'items');
         });
      });

      describe('__deleteItem', function() {
         it('should delete the item with the passed key', async function() {
            const instance = new PaneSource({
               data: {
                  text: 123
               },
               root: 'Options'
            });

            await instance.__deleteItem('text');

            assert.deepEqual(instance._data, []);
         });
      });

      describe('query', function() {
         it('should return all items on the root level', async function() {
            const query = {
               getWhere: sandbox.stub().returns({})
            };
            const instance = new PaneSource({
               data: {
                  text: '123',
                  items: [1, 2, 3],
                  nullValue: null,
                  emptyObject: {},
                  object: {
                     key: 1,
                     anotherKey: 2
                  }
               },
               root: 'Options'
            });
            sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            sinon.assert.calledWithExactly(sourceLib.DataSet, {
               rawData: {
                  data: [
                     {
                        key: 'text',
                        caption: '123',
                        name: 'text',
                        parent: null,
                        hasChildren: null,
                        template: 'Elements/elements:StringTemplate'
                     },
                     {
                        key: 'items',
                        caption: 'Array[3]',
                        name: 'items',
                        parent: null,
                        hasChildren: true,
                        template: 'Elements/elements:ObjectTemplate'
                     },
                     {
                        key: 'nullValue',
                        caption: 'null',
                        name: 'nullValue',
                        parent: null,
                        hasChildren: null,
                        template: 'Elements/elements:ObjectTemplate'
                     },
                     {
                        key: 'emptyObject',
                        caption: 'Empty object',
                        name: 'emptyObject',
                        parent: null,
                        hasChildren: null,
                        template: 'Elements/elements:ObjectTemplate'
                     },
                     {
                        key: 'object',
                        caption: 'Object',
                        name: 'object',
                        parent: null,
                        hasChildren: true,
                        template: 'Elements/elements:ObjectTemplate'
                     }
                  ],
                  meta: {
                     more: false
                  }
               },
               itemsProperty: 'data',
               metaProperty: 'meta'
            });
            sinon.assert.calledWithNew(sourceLib.DataSet);
            assert.instanceOf(result, sourceLib.DataSet);
         });

         it('should filter out items which does not include value from the filter in their name', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  name: 'items'
               })
            };
            const instance = new PaneSource({
               data: {
                  text: '123',
                  items: [1, 2, 3],
                  otherItems: [4, 5, 6, 7]
               },
               root: 'Options'
            });
            sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            sinon.assert.calledWithExactly(sourceLib.DataSet, {
               rawData: {
                  data: [
                     {
                        key: 'items',
                        caption: 'Array[3]',
                        name: 'items',
                        parent: null,
                        hasChildren: true,
                        template: 'Elements/elements:ObjectTemplate'
                     },
                     {
                        key: 'otherItems',
                        caption: 'Array[4]',
                        name: 'otherItems',
                        parent: null,
                        hasChildren: true,
                        template: 'Elements/elements:ObjectTemplate'
                     }
                  ],
                  meta: {
                     more: false
                  }
               },
               itemsProperty: 'data',
               metaProperty: 'meta'
            });
            sinon.assert.calledWithNew(sourceLib.DataSet);
            assert.instanceOf(result, sourceLib.DataSet);
         });

         it('should return children of the item with the key "items"', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  parent: 'items'
               })
            };
            const instance = new PaneSource({
               data: {
                  text: '123',
                  items: [1, 2, 3]
               },
               root: 'Options'
            });
            sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            sinon.assert.calledWithExactly(sourceLib.DataSet, {
               rawData: {
                  data: [
                     {
                        key: '0---items',
                        caption: '1',
                        name: '0',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     },
                     {
                        key: '1---items',
                        caption: '2',
                        name: '1',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     },
                     {
                        key: '2---items',
                        caption: '3',
                        name: '2',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     }
                  ],
                  meta: {
                     more: false
                  }
               },
               itemsProperty: 'data',
               metaProperty: 'meta'
            });
            sinon.assert.calledWithNew(sourceLib.DataSet);
            assert.instanceOf(result, sourceLib.DataSet);
         });

         it('should return all items on the root level because the root is in the filter', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  parent: [null]
               })
            };
            const instance = new PaneSource({
               data: {
                  text: '123',
                  items: [1, 2, 3]
               },
               root: 'Options'
            });
            sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            sinon.assert.calledWithExactly(sourceLib.DataSet, {
               rawData: {
                  data: [
                     {
                        key: 'text',
                        caption: '123',
                        name: 'text',
                        parent: null,
                        hasChildren: null,
                        template: 'Elements/elements:StringTemplate'
                     },
                     {
                        key: 'items',
                        caption: 'Array[3]',
                        name: 'items',
                        parent: null,
                        hasChildren: true,
                        template: 'Elements/elements:ObjectTemplate'
                     }
                  ],
                  meta: {
                     more: false
                  }
               },
               itemsProperty: 'data',
               metaProperty: 'meta'
            });
            sinon.assert.calledWithNew(sourceLib.DataSet);
            assert.instanceOf(result, sourceLib.DataSet);
         });

         it('should return children of every expanded item', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  parent: ['items', 'otherItems']
               })
            };
            const instance = new PaneSource({
               data: {
                  text: '123',
                  items: [1, 2, 3],
                  otherItems: [4, 5]
               },
               root: 'Options'
            });
            sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            sinon.assert.calledWithExactly(sourceLib.DataSet, {
               rawData: {
                  data: [
                     {
                        key: '0---items',
                        caption: '1',
                        name: '0',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     },
                     {
                        key: '1---items',
                        caption: '2',
                        name: '1',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     },
                     {
                        key: '2---items',
                        caption: '3',
                        name: '2',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     },
                     {
                        key: '0---otherItems',
                        caption: '4',
                        name: '0',
                        parent: 'otherItems',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     },
                     {
                        key: '1---otherItems',
                        caption: '5',
                        name: '1',
                        parent: 'otherItems',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     }
                  ],
                  meta: {
                     more: false
                  }
               },
               itemsProperty: 'data',
               metaProperty: 'meta'
            });
            sinon.assert.calledWithNew(sourceLib.DataSet);
            assert.instanceOf(result, sourceLib.DataSet);
         });

         it('should load and return children of the item with the key "items"', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  parent: 'items'
               })
            };
            let listener;
            const instance = new PaneSource({
               data: {
                  text: '123',
                  items: {
                     [INSPECTED_ITEM_META.type]: 'array',
                     [INSPECTED_ITEM_META.caption]: 'Array[3]',
                     [INSPECTED_ITEM_META.expandable]: true
                  }
               },
               root: 'Options',
               controlId: 0,
               store: {
                  addListener: sandbox
                     .stub()
                     .withArgs('inspectedElement')
                     .callsFake((eventName, handler) => {
                        listener = handler;
                     }),
                  dispatch: sandbox
                     .stub()
                     .withArgs('inspectElement', {
                        id: 0,
                        path: ['options', 'items']
                     })
                     .callsFake(() => {
                        listener({
                           id: 0,
                           type: 'path',
                           path: ['options', 'items'],
                           value: {
                              cleaned: [['options', 'items', 2]],
                              data: {
                                 0: 1,
                                 1: {
                                    test: '123'
                                 },
                                 2: {
                                    type: 'object',
                                    caption: 'Empty object',
                                    expandable: false
                                 }
                              }
                           }
                        });
                     }),
                  removeListener: sandbox.stub()
               }
            });
            sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            sinon.assert.calledWithExactly(sourceLib.DataSet, {
               rawData: {
                  data: [
                     {
                        key: '0---items',
                        caption: '1',
                        name: '0',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:NumberTemplate'
                     },
                     {
                        key: '1---items',
                        caption: 'Object',
                        name: '1',
                        parent: 'items',
                        hasChildren: true,
                        template: 'Elements/elements:ObjectTemplate'
                     },
                     {
                        key: 'test---1---items',
                        caption: '123',
                        name: 'test',
                        parent: '1---items',
                        hasChildren: null,
                        template: 'Elements/elements:StringTemplate'
                     },
                     {
                        key: '2---items',
                        caption: 'Empty object',
                        name: '2',
                        parent: 'items',
                        hasChildren: null,
                        template: 'Elements/elements:ObjectTemplate'
                     }
                  ],
                  meta: {
                     more: false
                  }
               },
               itemsProperty: 'data',
               metaProperty: 'meta'
            });
            sinon.assert.calledWithNew(sourceLib.DataSet);
            assert.instanceOf(result, sourceLib.DataSet);
            sinon.assert.calledWithExactly(
               instance._store.removeListener,
               'inspectedElement',
               listener
            );
         });
      });
   });
});
