define('DevtoolsTest/optionTypesMocks', [], function() {
   function mockOptionTypes(sandbox, entityLib) {
      sandbox.stub(entityLib, 'descriptor').callsFake(function(...args) {
         return {
            args,
            required: sandbox.stub().returnsThis(),
            oneOf: sandbox.stub().returnsThis()
         };
      });
   }

   function testOption(optionTypes, optionName, { args, required, oneOf }) {
      assert.deepEqual(optionTypes[optionName].args, args);
      if (required) {
         assert.isTrue(
            optionTypes[optionName].required.calledOnceWithExactly()
         );
      } else {
         assert.isTrue(optionTypes[optionName].required.notCalled);
      }
      if (oneOf) {
         assert.isTrue(
            optionTypes[optionName].oneOf.calledOnceWithExactly(oneOf)
         );
      }
   }

   return {
      mockOptionTypes,
      testOption
   };
});
