define(['DevtoolsTest/mockChrome', 'Elements/_utils/highlightUpdate'], function(
   mockChrome,
   highlightUpdate
) {
   let sandbox;
   highlightUpdate = highlightUpdate.highlightUpdate;

   describe('Elements/_utils/highlightUpdate', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      it('should change the background color of the node, trigger forced reflow and then change the background back', function() {
         const node = {
            style: {
               set transition(newValue) {},
               set backgroundColor(newValue) {}
            },
            get offsetTop() {}
         };
         const transitionSpy = sandbox.spy(node.style, 'transition', ['set'])
            .set;
         const backgroundColorSpy = sandbox.spy(node.style, 'backgroundColor', [
            'set'
         ]).set;
         const offsetTopSpy = sandbox.spy(node, 'offsetTop', ['get']).get;

         highlightUpdate(node);

         assert.isTrue(transitionSpy.calledTwice);
         assert.isTrue(transitionSpy.firstCall.calledWithExactly('none'));
         assert.isTrue(
            transitionSpy.secondCall.calledWithExactly(
               'background-color 1s ease'
            )
         );

         assert.isTrue(backgroundColorSpy.calledTwice);
         assert.isTrue(
            backgroundColorSpy.firstCall.calledWithExactly('#881280')
         );
         assert.isTrue(
            backgroundColorSpy.secondCall.calledWithExactly('transparent')
         );

         assert.isTrue(offsetTopSpy.calledOnce);
      });
   });
});
