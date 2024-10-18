define(['injection/_dependencyWatcher/storage/Storage'], function(Storage) {
   let instance;
   Storage = Storage.Storage;

   describe('injection/_dependencyWatcher/storage/Storage', function() {
      beforeEach(function() {
         instance = new Storage('testIndexField');
      });

      afterEach(function() {
         instance = undefined;
      });

      it('should return item by id', function() {
         const item = {};
         instance._idMap.set(0, {});
         instance._idMap.set(123, item);

         assert.equal(instance.getItemById(123), item);
      });

      it('should return item by index', function() {
         const item = {};
         instance._indexMap.set(0, {});
         instance._indexMap.set(123, item);

         assert.equal(instance.getItemByIndex(123), item);
      });

      it('should return every item (getItems)', function() {
         instance._idMap.set(0, {
            value: 123
         });
         instance._idMap.set(123, {
            value: 456
         });

         assert.deepEqual(instance.getItems(), [
            {
               value: 123
            },
            {
               value: 456
            }
         ]);
      });

      it('should return every item (getItemsById)', function() {
         instance._idMap.set(0, {
            value: 123
         });
         instance._idMap.set(123, {
            value: 456
         });

         assert.deepEqual(instance.getItemsById(), [
            {
               value: 123
            },
            {
               value: 456
            }
         ]);
      });

      it('should return items with passedKeys (getItemsById)', function() {
         instance._idMap.set(0, {
            value: 123
         });
         instance._idMap.set(1, {
            value: 789
         });
         instance._idMap.set(123, {
            value: 456
         });

         assert.deepEqual(instance.getItemsById([123, 1, 2]), [
            {
               value: 456
            },
            {
               value: 789
            }
         ]);
      });

      it('should correctly check for items in index', function() {
         instance._indexMap.set(0, {
            value: 123
         });
         instance._indexMap.set(123, {
            value: 456
         });

         assert.isTrue(instance.hasIndex(0));
         assert.isFalse(instance.hasIndex(1));
      });

      it('should add item and index it', function() {
         const item = {
            id: 0,
            value: 123,
            testIndexField: 'qwerty'
         };

         instance.add(item);

         assert.deepEqual(instance._idMap, new Map([[0, item]]));
         assert.deepEqual(instance._indexMap, new Map([['qwerty', item]]));
      });
   });
});
