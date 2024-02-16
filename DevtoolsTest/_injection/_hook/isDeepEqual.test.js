define(['injection/_hook/isDeepEqual'], function(isDeepEqual) {
   isDeepEqual = isDeepEqual.default;

   describe('injection/_hook/isDeepEqual', function() {
      it('should return true for nulls', function() {
         assert.isTrue(isDeepEqual(null, null));
      });

      it('should return true for booleans', function() {
         assert.isTrue(isDeepEqual(false, false));
      });

      it('should return false for booleans', function() {
         assert.isFalse(isDeepEqual(false, null));
         assert.isFalse(isDeepEqual(true, false));
         assert.isFalse(isDeepEqual(true, 1));
      });

      it('should return true for numbers', function() {
         assert.isTrue(isDeepEqual(0, 0));
         assert.isTrue(isDeepEqual(1, 1));
      });

      it('should return false for numbers', function() {
         assert.isFalse(isDeepEqual(0, 1));
         assert.isFalse(isDeepEqual(0, true));
      });

      it('should return true for strings', function() {
         assert.isTrue(isDeepEqual('', ''));
         assert.isTrue(isDeepEqual('a', 'a'));
      });

      it('should return false for strings', function() {
         assert.isFalse(isDeepEqual('a', 'b'));
         assert.isFalse(isDeepEqual('0', 0));
      });

      it('should return true for dates', function() {
         assert.isTrue(isDeepEqual(new Date(1, 2, 3), new Date(1, 2, 3)));
      });

      it('should return false for dates', function() {
         assert.isFalse(isDeepEqual(new Date(1, 2, 3), new Date(1, 2, 4)));
         assert.isFalse(isDeepEqual(new Date(1, 2, 3), 1));
      });

      it('should return true for arrays', function() {
         assert.isTrue(isDeepEqual([], []));
         assert.isTrue(isDeepEqual([1, 2, '3'], [1, 2, '3']));
      });

      it('should return false for arrays', function() {
         assert.isFalse(isDeepEqual([1, 2, '3'], [1, 2]));
         assert.isFalse(isDeepEqual([1, 2, '3'], [1, 2, 3]));
      });

      it('should return false for values with different types', function() {
         assert.isFalse(isDeepEqual([1], {0: 1}));
      });

      it('should return true for objects', function() {
         assert.isTrue(isDeepEqual({}, {}));
         assert.isTrue(isDeepEqual({ a: 1, b: '2' }, { a: 1, b: '2' }));
         assert.isTrue(isDeepEqual({ a: 1, b: '2' }, { b: '2', a: 1 }));
      });

      it('should return false for objects', function() {
         assert.isFalse(isDeepEqual({ a: 1, b: '2' }, { a: 1, b: 2 }));
      });

      it('should return true for objects with dates', function() {
         assert.isTrue(
            isDeepEqual({ a: new Date(1, 2, 3) }, { a: new Date(1, 2, 3) })
         );
      });

      it('should return false for objects with dates', function() {
         assert.isFalse(
            isDeepEqual({ a: new Date(1, 2, 3) }, { a: new Date(1, 2, 4) })
         );
      });

      it('should return true for not plain objects', function() {
         var Foo = function() {},
            fooA,
            fooB;
         Foo.prototype = Object.create(Object.prototype);
         Foo.prototype.constructor = Foo;

         fooA = new Foo();
         fooB = fooA;

         assert.isTrue(isDeepEqual(fooA, fooB));
      });

      it('should return false for not plain objects', function() {
         var Foo = function() {},
            fooA,
            fooB;
         Foo.prototype = Object.create(Object.prototype);
         Foo.prototype.constructor = Foo;

         fooA = new Foo();
         fooB = new Foo();

         assert.isFalse(isDeepEqual(fooA, fooB));
      });

      it('should return false when compare an empty object and a date', function() {
         assert.isFalse(isDeepEqual({ dt: {} }, { dt: new Date() }));
      });
   });
});
