define(['Search/Controller'], function(Controller) {
   let instance;
   Controller = Controller.default;

   describe('Search/Controller', function() {
      beforeEach(function() {
         instance = new Controller('title');
      });

      afterEach(function() {
         instance = undefined;
      });

      describe('updateSearch', function() {
         it('should reset search', function() {
            const items = [
               {
                  id: 0,
                  title: 'First'
               },
               {
                  id: 1,
                  title: 'Second'
               }
            ];

            const result = instance.updateSearch(items, '');

            assert.deepEqual(result, {
               id: undefined,
               index: 0,
               total: 0
            });
         });

         it('should not find item', function() {
            const items = [
               {
                  id: 0,
                  title: 'First'
               },
               {
                  id: 1,
                  title: 'Second'
               }
            ];

            const result = instance.updateSearch(items, 'third');

            assert.deepEqual(result, {
               id: undefined,
               index: 0,
               total: 0
            });
         });

         it('should find item', function() {
            const items = [
               {
                  id: 0,
                  title: 'First'
               },
               {
                  id: 1,
                  title: 'Second'
               }
            ];

            const result = instance.updateSearch(items, 'eco');

            assert.deepEqual(result, {
               id: 1,
               index: 0,
               total: 1
            });
         });

         it('should find two items and select the last one', function() {
            const items = [
               {
                  id: 0,
                  title: 'First'
               },
               {
                  id: 1,
                  title: 'Second'
               },
               {
                  id: 2,
                  title: 'Another second'
               }
            ];

            const result = instance.updateSearch(items, 'eco', 2);

            assert.deepEqual(result, {
               id: 2,
               index: 1,
               total: 2
            });
         });
      });

      describe('getNextItemId', function() {
         it("should reset search because there's no search results", function() {
            const result = instance.getNextItemId('irst');

            assert.deepEqual(result, {
               id: undefined,
               index: 0,
               total: 0
            });
         });

         it('should reset search because no value was passed', function() {
            instance._searchResults = [
               {
                  id: 0,
                  title: 'First'
               },
               {
                  id: 1,
                  title: 'Second'
               }
            ];

            const result = instance.getNextItemId('');

            assert.deepEqual(result, {
               id: undefined,
               index: 0,
               total: 0
            });
         });

         it('should select the next item', function() {
            instance._searchResults = [
               {
                  id: 0,
                  title: 'Item'
               },
               {
                  id: 1,
                  title: 'Another item'
               }
            ];

            const result = instance.getNextItemId('Ite');

            assert.deepEqual(result, {
               id: 1,
               index: 1,
               total: 2
            });
         });

         it('should select the first item', function() {
            instance._lastFoundItemIndex = 1;
            instance._searchResults = [
               {
                  id: 0,
                  title: 'Item'
               },
               {
                  id: 1,
                  title: 'Another item'
               }
            ];

            const result = instance.getNextItemId('Ite');

            assert.deepEqual(result, {
               id: 0,
               index: 0,
               total: 2
            });
         });

         it('should select the previous item', function() {
            instance._lastFoundItemIndex = 1;
            instance._searchResults = [
               {
                  id: 0,
                  title: 'Item'
               },
               {
                  id: 1,
                  title: 'Another item'
               }
            ];

            const result = instance.getNextItemId('Ite', true);

            assert.deepEqual(result, {
               id: 0,
               index: 0,
               total: 2
            });
         });

         it('should select the last item', function() {
            instance._searchResults = [
               {
                  id: 0,
                  title: 'Item'
               },
               {
                  id: 1,
                  title: 'Another item'
               }
            ];

            const result = instance.getNextItemId('Ite', true);

            assert.deepEqual(result, {
               id: 1,
               index: 1,
               total: 2
            });
         });
      });
   });
});
