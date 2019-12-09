define([
   'DevtoolsTest/mockChrome',
   'Elements/_Details/Pane/Source',
   'Types/collection',
   'Types/source',
   'Types/entity'
], function(mockChrome, PaneSource, collectionLib, sourceLib, entityLib) {
   let sandbox;
   PaneSource = PaneSource.Source;

   describe('Elements/_Details/Pane/Source', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('constructor', function() {
         it('should correctly initialize state', function() {
            const options = {
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            };

            const instance = new PaneSource(options);

            assert.equal(instance._idProperty, 'key');
            assert.equal(instance._parentProperty, 'parent');
            assert.deepEqual(instance._data, [
               {
                  key: 0,
                  value: '123',
                  name: 'text',
                  parent: null,
                  hasChildren: null
               },
               {
                  key: 1,
                  value: [1, 2, 3],
                  name: 'items',
                  parent: null,
                  hasChildren: true
               }
            ]);
         });
      });

      describe('create', function() {
         it('should create new record using meta and resolve promise with it', async function() {
            const meta = {
               value: '123'
            };
            const recordStub = sandbox.stub(entityLib, 'Record');
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });

            const result = await instance.create(meta);

            assert.instanceOf(result, recordStub);
            assert.isTrue(
               recordStub.calledOnceWithExactly({
                  rawData: meta
               })
            );
            assert.isTrue(recordStub.calledWithNew());
         });
      });

      describe('read', function() {
         it('should find the item by key and resolve promise with it', async function() {
            const item = {
               key: 0,
               value: '123',
               name: 'text',
               parent: null
            };
            const recordStub = sandbox.stub(entityLib, 'Record');
            const instance = new PaneSource({
               data: [item],
               idProperty: 'key',
               parentProperty: 'parent'
            });

            const result = await instance.read(0);

            assert.instanceOf(result, recordStub);
            assert.isTrue(
               recordStub.calledOnceWithExactly({
                  rawData: {
                     ...item,
                     hasChildren: null
                  }
               })
            );
            assert.isTrue(recordStub.calledWithNew());
         });
      });

      describe('update', function() {
         it('should update one item', async function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const newValue = new entityLib.Record({
               rawData: {
                  key: 0,
                  value: '456',
                  name: 'text',
                  parent: null
               }
            });
            const stub = sandbox.stub(instance, '__updateItem');

            await instance.update(newValue);

            assert.isTrue(stub.calledOnceWithExactly(newValue));
         });

         it('should update multiple items', async function() {
            const instance = new PaneSource({
               data: [],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const newValue = new collectionLib.RecordSet({
               rawData: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  }
               ],
               keyProperty: 'key'
            });
            const stub = sandbox.stub(instance, '__updateItem');

            await instance.update(newValue);

            assert.isTrue(stub.calledTwice);
            assert.isTrue(stub.calledWithExactly(newValue.at(0)));
            assert.isTrue(stub.calledWithExactly(newValue.at(1)));
         });
      });

      describe('__updateItem', function() {
         it('item exists, so it should get updated', async function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });

            await instance.__updateItem(
               new entityLib.Record({
                  rawData: {
                     key: 0,
                     value: '456',
                     name: 'text',
                     parent: null
                  }
               })
            );

            assert.deepEqual(instance._data[0], {
               key: 0,
               value: '456',
               name: 'text',
               parent: null,
               hasChildren: null
            });
         });

         it('item does not exist, so it should get appended to data', async function() {
            const instance = new PaneSource({
               data: [],
               idProperty: 'key',
               parentProperty: 'parent'
            });

            await instance.__updateItem(
               new entityLib.Record({
                  rawData: {
                     key: 0,
                     value: '456',
                     name: 'text',
                     parent: null
                  }
               })
            );

            assert.deepEqual(instance._data[0], {
               key: 0,
               value: '456',
               name: 'text',
               parent: null,
               hasChildren: null
            });
         });
      });

      describe('destroy', function() {
         it('should delete one item', async function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const stub = sandbox.stub(instance, '__deleteItem');

            await instance.destroy(0);

            assert.isTrue(stub.calledOnceWithExactly(0));
         });

         it('should delete multiple items', async function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const stub = sandbox.stub(instance, '__deleteItem');
            const keys = [0, 1];

            await instance.destroy(keys);

            assert.isTrue(stub.calledTwice);
            assert.isTrue(stub.calledWithExactly(0));
            assert.isTrue(stub.calledWithExactly(1));
         });
      });

      describe('__deleteItem', function() {
         it('should delete item', async function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });

            await instance.__deleteItem(0);

            assert.deepEqual(instance._data, []);
         });
      });

      describe('query', function() {
         it('should return all items with stubbed values', async function() {
            const query = {
               getWhere: sandbox.stub().returns({})
            };
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  },
                  {
                     key: 2,
                     value: null,
                     name: 'nullValue',
                     parent: null
                  },
                  {
                     key: 3,
                     value: {},
                     name: 'emptyObject',
                     parent: null
                  },
                  {
                     key: 4,
                     value: {
                        key: 1,
                        anotherKey: 2
                     },
                     name: 'object',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const dataSetStub = sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            assert.isTrue(
               dataSetStub.calledOnceWithExactly({
                  rawData: {
                     data: [
                        {
                           key: 0,
                           value: '123',
                           name: 'text',
                           parent: null,
                           hasChildren: null
                        },
                        {
                           key: 1,
                           value: [],
                           name: 'items',
                           parent: null,
                           hasChildren: true
                        },
                        {
                           key: 2,
                           value: null,
                           name: 'nullValue',
                           parent: null,
                           hasChildren: null
                        },
                        {
                           key: 3,
                           value: {},
                           name: 'emptyObject',
                           parent: null,
                           hasChildren: null
                        },
                        {
                           key: 4,
                           value: {
                              0: null
                           },
                           name: 'object',
                           parent: null,
                           hasChildren: true
                        }
                     ],
                     meta: {
                        more: false
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               })
            );
            assert.isTrue(dataSetStub.calledWithNew());
            assert.instanceOf(result, dataSetStub);
         });

         it('should filter out items which does not include value from the filter in their name', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  name: 'items'
               })
            };
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  },
                  {
                     key: 2,
                     value: [4, 5, 6],
                     name: 'otherItems',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const dataSetStub = sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            assert.isTrue(
               dataSetStub.calledOnceWithExactly({
                  rawData: {
                     data: [
                        {
                           key: 1,
                           value: [],
                           name: 'items',
                           parent: null,
                           hasChildren: true
                        },
                        {
                           key: 2,
                           value: [],
                           name: 'otherItems',
                           parent: null,
                           hasChildren: true
                        }
                     ],
                     meta: {
                        more: false
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               })
            );
            assert.isTrue(dataSetStub.calledWithNew());
            assert.instanceOf(result, dataSetStub);
         });

         it('should return children of the item with the key 1', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  parent: 1
               })
            };
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const dataSetStub = sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            assert.isTrue(
               dataSetStub.calledOnceWithExactly({
                  rawData: {
                     data: [
                        {
                           key: '1---0',
                           parent: 1,
                           hasChildren: null,
                           name: '0',
                           value: 1
                        },
                        {
                           key: '1---1',
                           parent: 1,
                           hasChildren: null,
                           name: '1',
                           value: 2
                        },
                        {
                           key: '1---2',
                           parent: 1,
                           hasChildren: null,
                           name: '2',
                           value: 3
                        }
                     ],
                     meta: {
                        more: false
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               })
            );
            assert.isTrue(dataSetStub.calledWithNew());
            assert.instanceOf(result, dataSetStub);
         });

         it('should return all items because the root is in the filter', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  parent: [null]
               })
            };
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const dataSetStub = sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            assert.isTrue(
               dataSetStub.calledOnceWithExactly({
                  rawData: {
                     data: [
                        {
                           key: 0,
                           value: '123',
                           name: 'text',
                           parent: null,
                           hasChildren: null
                        },
                        {
                           key: 1,
                           value: [],
                           name: 'items',
                           parent: null,
                           hasChildren: true
                        }
                     ],
                     meta: {
                        more: false
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               })
            );
            assert.isTrue(dataSetStub.calledWithNew());
            assert.instanceOf(result, dataSetStub);
         });

         it('should children of every expanded item', async function() {
            const query = {
               getWhere: sandbox.stub().returns({
                  parent: [1, 2]
               })
            };
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  },
                  {
                     key: 2,
                     value: [4, 5],
                     name: 'otherItems',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const dataSetStub = sandbox.stub(sourceLib, 'DataSet');

            const result = await instance.query(query);

            assert.isTrue(
               dataSetStub.calledOnceWithExactly({
                  rawData: {
                     data: [
                        {
                           key: '1---0',
                           parent: 1,
                           hasChildren: null,
                           name: '0',
                           value: 1
                        },
                        {
                           key: '1---1',
                           parent: 1,
                           hasChildren: null,
                           name: '1',
                           value: 2
                        },
                        {
                           key: '1---2',
                           parent: 1,
                           hasChildren: null,
                           name: '2',
                           value: 3
                        },
                        {
                           key: '2---0',
                           parent: 2,
                           hasChildren: null,
                           name: '0',
                           value: 4
                        },
                        {
                           key: '2---1',
                           parent: 2,
                           hasChildren: null,
                           name: '1',
                           value: 5
                        }
                     ],
                     meta: {
                        more: false
                     }
                  },
                  itemsProperty: 'data',
                  metaProperty: 'meta'
               })
            );
            assert.isTrue(dataSetStub.calledWithNew());
            assert.instanceOf(result, dataSetStub);
         });
      });

      describe('__getImmediateChildren', function() {
         it('should throw error because the parent does not exist', function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });

            assert.throws(
               () => instance.__getImmediateChildren(1),
               'Trying to get contents of nonexistent item'
            );
         });

         it('should generate new items for the children and cache them in data', function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const children = [
               {
                  key: '1---0',
                  parent: 1,
                  hasChildren: null,
                  name: '0',
                  value: 1
               },
               {
                  key: '1---1',
                  parent: 1,
                  hasChildren: null,
                  name: '1',
                  value: 2
               },
               {
                  key: '1---2',
                  parent: 1,
                  hasChildren: null,
                  name: '2',
                  value: 3
               }
            ];

            assert.deepEqual(instance.__getImmediateChildren(1), children);
            assert.deepEqual(
               instance._data,
               [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null,
                     hasChildren: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null,
                     hasChildren: true
                  }
               ].concat(children)
            );
         });

         it('should use existing children', function() {
            const instance = new PaneSource({
               data: [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null
                  }
               ],
               idProperty: 'key',
               parentProperty: 'parent'
            });
            const children = [
               {
                  key: '1---0',
                  parent: 1,
                  hasChildren: null,
                  name: '0',
                  value: 1
               },
               {
                  key: '1---1',
                  parent: 1,
                  hasChildren: null,
                  name: '1',
                  value: 2
               },
               {
                  key: '1---2',
                  parent: 1,
                  hasChildren: null,
                  name: '2',
                  value: 3
               }
            ];
            instance._data = instance._data.concat(children);

            assert.deepEqual(instance.__getImmediateChildren(1), children);
            assert.deepEqual(
               instance._data,
               [
                  {
                     key: 0,
                     value: '123',
                     name: 'text',
                     parent: null,
                     hasChildren: null
                  },
                  {
                     key: 1,
                     value: [1, 2, 3],
                     name: 'items',
                     parent: null,
                     hasChildren: true
                  }
               ].concat(children)
            );
            assert.equal(instance._data[2], children[0]);
            assert.equal(instance._data[3], children[1]);
            assert.equal(instance._data[4], children[2]);
         });
      });
   });
});
