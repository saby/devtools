define(['DevtoolsTest/mockChrome', 'injection/_focus/getCaption'], function (
   mockChrome,
   getCaption
) {
   getCaption = getCaption.getCaption;
   let sandbox;

   describe('injection/_focus/getCaption', function () {
      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      it("should return tagName if the element doesn't have classes", function () {
         assert.equal(
            getCaption({
               classList: [],
               tagName: 'SPAN'
            }),
            'SPAN'
         );
      });

      it('should return the first class if it exists', function () {
         assert.equal(
            getCaption({
               classList: ['testClass', 'anotherClass'],
               tagName: 'SPAN'
            }),
            'testClass'
         );
      });
   });
});
