define(['injection/_hook/_utils/ErrorWrapper'], function (ErrorWrapper) {
   describe('injection/_hook/_utils/ErrorWrapper', function () {
      let sandbox;
      ErrorWrapper = ErrorWrapper.default;

      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      it('should log error from each function exactly twice: one before and one after the cleanup', function () {
         const firstFunction = () => {
            throw new Error('first');
         };
         const secondFunction = () => {
            throw new Error('second');
         };
         const logger = {
            error: sandbox.stub()
         };
         const ew = new ErrorWrapper(logger);

         const firstWrapped = ew.wrapFunction(firstFunction);
         const secondWrapped = ew.wrapFunction(secondFunction);

         assert.doesNotThrow(() => {
            firstWrapped();
         });
         assert.equal(logger.error.firstCall.args[0].message, 'first');
         assert.doesNotThrow(() => {
            secondWrapped();
         });
         assert.equal(logger.error.secondCall.args[0].message, 'second');

         assert.doesNotThrow(() => {
            firstWrapped();
         });
         assert.doesNotThrow(() => {
            firstWrapped();
         });
         assert.doesNotThrow(() => {
            secondWrapped();
         });
         assert.doesNotThrow(() => {
            secondWrapped();
         });

         sinon.assert.calledTwice(logger.error);

         // cleanup
         ew.resetErrors();

         assert.doesNotThrow(() => {
            firstWrapped();
         });
         assert.equal(logger.error.thirdCall.args[0].message, 'first');
         assert.doesNotThrow(() => {
            secondWrapped();
         });
         assert.equal(logger.error.getCall(3).args[0].message, 'second');

         assert.doesNotThrow(() => {
            firstWrapped();
         });
         assert.doesNotThrow(() => {
            firstWrapped();
         });
         assert.doesNotThrow(() => {
            secondWrapped();
         });
         assert.doesNotThrow(() => {
            secondWrapped();
         });

         sinon.assert.callCount(logger.error, 4);
      });
   });
});
