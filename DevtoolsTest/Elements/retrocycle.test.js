define(['Elements/retrocycle'], function(retrocycle) {
   retrocycle = retrocycle.default;

   describe('Elements/retrocycle', function() {
      it('should return object with circular references', function() {
         const obj = {
            nullValue: null,
            circularValue: {
               $ref: '$'
            },
            regularObject: {},
            notObject: '123'
         };
         const resultObject = {
            nullValue: null,
            regularObject: {},
            notObject: '123'
         };
         resultObject.circularValue = resultObject;

         assert.deepEqual(retrocycle(obj), resultObject);
      });

      it('should return array with circular references', function() {
         const arr = [{ $ref: '$' }, null, {}, '123'];
         const resultArr = [null, {}, '123'];
         resultArr.unshift(resultArr);

         assert.deepEqual(retrocycle(arr), resultArr);
      });

      it('should return the same value', function() {
         assert.equal(retrocycle(1), 1);
         assert.equal(retrocycle('test'), 'test');
      });
   });
});
