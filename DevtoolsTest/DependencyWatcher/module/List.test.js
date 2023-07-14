define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_module/List',
   'Types/entity'
], function(mockChrome, List, entityLib) {
   let sandbox;
   let instance;
   List = List.default;
   const Model = entityLib.Model;

   describe('DependencyWatcher/_module/List', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new List({
            fileSource: {}
         });
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('reload', function() {
         it('should call the reload method on the list', function() {
            instance._children = {
               listView: {
                  reload: sandbox.stub()
               }
            };

            instance.reload();

            assert.isTrue(
               instance._children.listView.reload.calledOnceWithExactly()
            );
         });
      });

      describe('__setItemActions handlers', function() {
         it('should set files filter to the file id and update root and filterButtonSource', function() {
            const action = instance._itemActions.find(({id}) => id === 'fileId');
            const model = new Model({
               rawData: {
                  id: 5,
                  fileId: 5,
                  fileName: 'testPath.js'
               },
               keyProperty: 'id'
            });
            instance._root = 1;
            const oldSource = instance._filterButtonSource;
            const setFilterStub = sandbox.stub(instance, '__setFilter');
            const setFilterValueStub = sandbox.stub(instance, '_setFilterValue');

            action.handler(model);

            assert.isTrue(setFilterStub.calledOnceWithExactly({
               parent: undefined,
               files: [5]
            }));
            assert.isUndefined(instance._root);
            assert.isTrue(setFilterValueStub.calledWithExactly('files', [5], 'testPath.js'));
            assert.isTrue(setFilterValueStub.calledWithExactly('dependentOnFiles'));
            assert.notEqual(instance._filterButtonSource, oldSource);
         });

         it('should set dependentOnFile filter to the file id and update root and filterButtonSource', function() {
            const action = instance._itemActions.find(({id}) => id === 'dependentOnFile');
            const model = new Model({
               rawData: {
                  id: 5,
                  fileId: 5,
                  fileName: 'testPath.js'
               },
               keyProperty: 'id'
            });
            instance._root = 1;
            const oldSource = instance._filterButtonSource;
            const setFilterStub = sandbox.stub(instance, '__setFilter');
            const setFilterValueStub = sandbox.stub(instance, '_setFilterValue');

            action.handler(model);

            assert.isTrue(setFilterStub.calledOnceWithExactly({
               parent: undefined,
               files: [5]
            }));
            assert.isUndefined(instance._root);
            assert.isTrue(setFilterValueStub.calledWithExactly('dependentOnFiles', [5], 'testPath.js'));
            assert.isTrue(setFilterValueStub.calledWithExactly('files'));
            assert.notEqual(instance._filterButtonSource, oldSource);
         });
      });

      describe('__setFilter', function() {
         it('should remove files and dependentOnFiles fields from a filter', function() {
            const filter = {
               files: [],
               dependentOnFiles: [],
               css: true
            };

            instance.__setFilter(filter);

            assert.deepEqual(instance._filter, {
               css: true
            });
         });

         it('should not remove files and dependentOnFiles fields from a filter because they are not empty', function() {
            const filter = {
               files: [1, 2],
               dependentOnFiles: [3, 4],
               css: true
            };

            instance.__setFilter(filter);

            assert.deepEqual(instance._filter, {
               files: [1, 2],
               dependentOnFiles: [3, 4],
               css: true
            });
         });
      });

      describe('_onFilterChanged', function() {
         it('should call __setFilter', function() {
            const setFilterStub = sandbox.stub(instance, '__setFilter');

            instance._onFilterChanged(
               {},
               {
                  files: [],
                  dependentOnFiles: [],
                  css: true
               }
            );

            assert.isTrue(
               setFilterStub.calledOnceWithExactly({
                  files: [],
                  dependentOnFiles: [],
                  css: true
               })
            );
         });
      });

      describe('_onItemsChanged', function() {
         it('should correctly reset textValue and visibility on the first item', function() {
            const items = [
               {
                  name: 'files',
                  visibility: false,
                  value: [],
                  textValue: 'value'
               },
               {
                  name: 'dependentOnFiles',
                  visibility: true,
                  value: [1],
                  textValue: 'value'
               }
            ];

            instance._onItemsChanged({}, items);

            assert.deepEqual(instance._filterButtonSource, [
               {
                  name: 'files',
                  visibility: true,
                  value: [],
                  textValue: ''
               },
               {
                  name: 'dependentOnFiles',
                  visibility: true,
                  value: [1],
                  textValue: 'value'
               }
            ]);
         });
      });

      describe('_setFilterValue', function() {
         it('should return false because the items value is equal to its resetValue', function() {
            assert.isFalse(instance._setFilterValue('files'));
         });

         it('should return false because there is no item with this id', function() {
            assert.isFalse(instance._setFilterValue('testId'));
         });

         it('should change value and textValue of the item', function() {
            const result = instance._setFilterValue(
               'files',
               [1],
               'testName.js'
            );

            assert.isTrue(result);
            const item = instance._filterButtonSource.find(
               ({ name }) => name === 'files'
            );
            assert.deepEqual(item.value, [1]);
            assert.equal(item.textValue, 'testName.js');
            assert.isTrue(item.visibility);
         });
      });
   });
});
