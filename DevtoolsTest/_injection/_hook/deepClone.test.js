define(['injection/_hook/deepClone'], function(deepClone) {
   deepClone = deepClone.default;

   describe('injection/_hook/deepClone', function() {
      it('should return undefined if called with it', function() {
         const result = deepClone();

         assert.isUndefined(result);
      });

      it('should clone Date', function() {
         const originalObject = new Date();

         const result = deepClone(originalObject);

         assert.notEqual(result, originalObject);
         assert.equal(result.getTime(), originalObject.getTime());
      });

      it('should clone object with a Date', function() {
         const originalObject = { foo: new Date(1) };

         const result = deepClone(originalObject);

         assert.notEqual(result, originalObject);
         assert.notEqual(result.foo, originalObject.foo);
         assert.equal(result.foo.getTime(), originalObject.foo.getTime());
      });

      it('should clone object with null', function() {
         const originalObject = { foo: null };

         const result = deepClone(originalObject);

         assert.notEqual(result, originalObject);
         assert.deepEqual(result, originalObject);
      });

      it('should clone object with array', function() {
         const originalObject = {
            foo: [1]
         };

         const result = deepClone(originalObject);

         assert.notEqual(result, originalObject);
         assert.notEqual(result.foo, originalObject.foo);
         assert.deepEqual(result.foo, [1]);
      });

      it('should throw an Error on recursive traversal', function() {
         const bar = {};
         const ext = {
            foo: {
               bar: bar
            }
         };
         bar.foo = ext.foo;

         assert.throws(function() {
            deepClone(ext);
         }, 'Recursive traversal detected for path ". -> foo -> bar -> foo" with [object Object]');
      });
   });
});
