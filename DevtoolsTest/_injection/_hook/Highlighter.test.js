define([
   'injection/_hook/Highlighter',
   'injection/_hook/Overlay',
   'DevtoolsTest/getJSDOM'
], function(Highlighter, Overlay, getJSDOM) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';
   Highlighter = Highlighter.default;
   Overlay = Overlay.default;

   describe('injection/_hook/Highlighter', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            document.elementFromPoint = () => {};
            global.window = dom.window;
            global.MouseEvent = dom.window.MouseEvent;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
            delete global.MouseEvent;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('startSelectingFromPage', function() {
         it('should handle mouseover correctly', function() {
            const onSelect = sandbox.stub();
            const instance = new Highlighter({
               onSelect
            });

            instance.startSelectingFromPage();

            assert.instanceOf(instance.overlay, Overlay);

            sandbox.stub(instance.overlay, 'inspect');
            sandbox.stub(document, 'elementFromPoint').withArgs(10, 10).returns(document.body);
            const mouseoverEvent = new MouseEvent('mouseover', {
               clientX: 10,
               clientY: 10
            });
            sandbox.stub(mouseoverEvent, 'stopPropagation');
            sandbox.stub(mouseoverEvent, 'preventDefault');
            document.dispatchEvent(mouseoverEvent);

            sinon.assert.calledOnce(mouseoverEvent.stopPropagation);
            sinon.assert.calledOnce(mouseoverEvent.preventDefault);
            sinon.assert.calledOnce(instance.overlay.inspect);
            sinon.assert.calledWithExactly(instance.overlay.inspect, document.body);

            // cleanup
            instance.stopSelectingFromPage();
         });

         it('should handle click correctly', function() {
            const onSelect = sandbox.stub();
            const instance = new Highlighter({
               onSelect
            });

            instance.startSelectingFromPage();

            assert.instanceOf(instance.overlay, Overlay);

            const stopSelectingFromPageSpy = sandbox.spy(instance, 'stopSelectingFromPage');
            sandbox.stub(instance.overlay, 'remove');
            const clickEvent = new MouseEvent('click');
            sandbox.stub(clickEvent, 'stopPropagation');
            sandbox.stub(clickEvent, 'preventDefault');
            document.dispatchEvent(clickEvent);

            sinon.assert.calledOnce(clickEvent.stopPropagation);
            sinon.assert.calledOnce(clickEvent.preventDefault);
            sinon.assert.calledOnce(stopSelectingFromPageSpy);
            sinon.assert.calledOnce(onSelect);
            sinon.assert.calledWithExactly(onSelect, document);
         });

         it('should handle mousedown correctly', function() {
            const onSelect = sandbox.stub();
            const instance = new Highlighter({
               onSelect
            });

            instance.startSelectingFromPage();

            assert.instanceOf(instance.overlay, Overlay);

            const mousedownEvent = new MouseEvent('mousedown');
            sandbox.stub(mousedownEvent, 'stopPropagation');
            sandbox.stub(mousedownEvent, 'preventDefault');
            document.dispatchEvent(mousedownEvent);

            sinon.assert.calledOnce(mousedownEvent.stopPropagation);
            sinon.assert.calledOnce(mousedownEvent.preventDefault);

            // cleanup
            instance.stopSelectingFromPage();
         });
      });

      describe('highlightElement', function() {
         it('should call overlay.inspect with the passed arguments', function() {
            const onSelect = sandbox.stub();
            const instance = new Highlighter({
               onSelect
            });
            instance.overlay = new Overlay();
            sandbox.stub(instance.overlay, 'inspect');

            instance.highlightElement(document.body, 'Controls/Application');

            sinon.assert.calledOnce(instance.overlay.inspect);
            sinon.assert.calledWithExactly(instance.overlay.inspect, document.body, 'Controls/Application');
         });

         it('should remove overlay', function() {
            const onSelect = sandbox.stub();
            const instance = new Highlighter({
               onSelect
            });
            instance.overlay = new Overlay();
            sandbox.stub(instance.overlay, 'remove');

            instance.highlightElement();

            sinon.assert.calledOnce(instance.overlay.remove);
         });
      });
   });
});
