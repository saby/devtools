define(['injection/_hook/Overlay', 'DevtoolsTest/getJSDOM'], function(
   Overlay,
   getJSDOM
) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';
   Overlay = Overlay.default;

   describe('injection/_hook/Overlay', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('inspect', function() {
         it('should display the caption on top of the container', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 60,
               right: 1930,
               bottom: 909,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(969);

            instance.inspect(document.body);

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '60px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '-22px');
            assert.equal(caption.textContent, 'body');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });

         it('should display the caption on the bottom of the page, but with the same left offset as the container', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 970,
               right: 1930,
               bottom: 1819,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(969);

            instance.inspect(document.body);

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '970px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '-23px');
            assert.equal(caption.textContent, 'body');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });

         it('should display the caption on the top of the page', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 21,
               right: 1930,
               bottom: 870,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(891);

            instance.inspect(document.body);

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '21px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '0px');
            assert.equal(caption.textContent, 'body');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });

         it('should display the caption on the bottom of the container', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 21,
               right: 1930,
               bottom: 870,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(969);

            instance.inspect(document.body);

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '21px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '849px');
            assert.equal(caption.textContent, 'body');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });
      });

      describe('inspectMultiple', function() {
         it('should display the caption on top of the container', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 60,
               right: 1930,
               bottom: 909,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(969);
            sandbox.stub(document.documentElement, 'clientHeight').value(1080);
            sandbox.stub(document.documentElement, 'clientWidth').value(1920);

            instance.inspectMultiple([document.body], 'TestControl');

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '60px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '-22px');
            assert.equal(caption.textContent, 'TestControl');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });

         it('should display the caption on the bottom of the page, but with the same left offset as the container', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 970,
               right: 1930,
               bottom: 1819,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(969);
            sandbox.stub(document.documentElement, 'clientHeight').value(1080);
            sandbox.stub(document.documentElement, 'clientWidth').value(1920);

            instance.inspectMultiple([document.body], 'TestControl');

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '970px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '-23px');
            assert.equal(caption.textContent, 'TestControl');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });

         it('should display the caption on the top of the page', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 21,
               right: 1930,
               bottom: 870,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(891);
            sandbox.stub(document.documentElement, 'clientHeight').value(1080);
            sandbox.stub(document.documentElement, 'clientWidth').value(1920);

            instance.inspectMultiple([document.body], 'TestControl');

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '21px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '0px');
            assert.equal(caption.textContent, 'TestControl');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });

         it('should display the caption on the bottom of the container', function() {
            const instance = new Overlay();
            sandbox.stub(document.body, 'getBoundingClientRect').returns({
               x: 0,
               y: 60,
               width: 1920,
               height: 849,
               top: 21,
               right: 1930,
               bottom: 870,
               left: 10
            });
            sandbox.stub(document.documentElement, 'offsetHeight').value(969);
            sandbox.stub(document.documentElement, 'clientHeight').value(1080);
            sandbox.stub(document.documentElement, 'clientWidth').value(1920);

            instance.inspectMultiple([document.body], 'TestControl');

            const overlay = instance.overlay;
            assert.isTrue(document.contains(overlay));
            assert.equal(overlay.style.top, '21px');
            assert.equal(overlay.style.height, '849px');
            assert.equal(overlay.style.width, '1920px');
            assert.equal(overlay.style.left, '10px');

            const caption = overlay.children[0];
            assert.equal(caption.style.left, '0px');
            assert.equal(caption.style.top, '849px');
            assert.equal(caption.textContent, 'TestControl');

            // cleanup
            instance.remove();
            assert.isFalse(document.contains(overlay));
         });
      });
   });
});
