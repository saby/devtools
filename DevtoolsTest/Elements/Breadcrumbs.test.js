define([
   'DevtoolsTest/mockChrome',
   'Elements/_Breadcrumbs/Breadcrumbs',
   'Types/entity',
   'DevtoolsTest/optionTypesMocks'
], function(mockChrome, Breadcrumbs, entityLib, optionTypesMocks) {
   let sandbox;
   let instance;
   Breadcrumbs = Breadcrumbs.default;

   describe('Elements/_Breadcrumbs/Breadcrumbs', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
         instance = new Breadcrumbs();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('_afterMount', function() {
         it('should call scrollToElement', function() {
            const stub = sandbox.stub(instance, '__scrollToElement');

            instance._afterMount();

            assert.isTrue(stub.calledOnceWithExactly());
         });
      });

      describe('_beforeUpdate', function() {
         it('should not change _shouldScrollToElement because selectedItemId is the same', function() {
            const selectedItemId = '1';
            instance.saveOptions({
               selectedItemId
            });
            instance._shouldScrollToElement = false;

            instance._beforeUpdate({
               selectedItemId
            });

            assert.isFalse(instance._shouldScrollToElement);
         });

         it('should not change _shouldScrollToElement because selectedItemId is the same', function() {
            const selectedItemId = '1';
            instance.saveOptions({
               selectedItemId
            });
            instance._shouldScrollToElement = false;

            instance._beforeUpdate({
               selectedItemId: '2'
            });

            assert.isTrue(instance._shouldScrollToElement);
         });
      });

      describe('_afterRender', function() {
         it('should call __scrollToElement', function() {
            const stub = sandbox.stub(instance, '__scrollToElement');
            instance._shouldScrollToElement = true;

            instance._afterRender();

            assert.isTrue(stub.calledOnceWithExactly());
            assert.isFalse(instance._shouldScrollToElement);
         });

         it('should not call __scrollToElement', function() {
            const stub = sandbox.stub(instance, '__scrollToElement');
            instance._shouldScrollToElement = false;

            instance._afterRender();

            assert.isTrue(stub.notCalled);
            assert.isFalse(instance._shouldScrollToElement);
         });
      });

      describe('_onItemClick', function() {
         it('should fire itemClick event', function() {
            const stub = sandbox.stub(instance, '_notify');
            instance._shouldScrollToElement = true;

            instance._onItemClick({}, '1');

            assert.isTrue(stub.calledOnceWithExactly('itemClick', ['1']));
         });
      });

      describe('_wheelHandler', function() {
         it('should not change scrollLeft of the container', function() {
            instance._container = {
               scrollLeft: 100
            };
            const event = {
               nativeEvent: {
                  deltaY: 200,
                  shiftKey: true
               }
            };

            instance._wheelHandler(event);

            assert.equal(instance._container.scrollLeft, 100);
         });

         it("should add deltaY to the container's scrollLeft", function() {
            instance._container = {
               scrollLeft: 100
            };
            const event = {
               nativeEvent: {
                  deltaY: 200,
                  shiftKey: false
               }
            };

            instance._wheelHandler(event);

            assert.equal(instance._container.scrollLeft, 300);
         });
      });

      describe('_onMouseEnter', function() {
         it('should fire itemClick event', function() {
            const stub = sandbox.stub(instance, '_notify');

            instance._onMouseEnter({}, '1');

            assert.isTrue(stub.calledOnceWithExactly('itemMouseEnter', ['1']));
         });
      });

      describe('_onMouseLeave', function() {
         it('should fire itemClick event', function() {
            const stub = sandbox.stub(instance, '_notify');

            instance._onMouseLeave({}, '1');

            assert.isTrue(stub.calledOnceWithExactly('itemMouseLeave', ['1']));
         });
      });

      describe('getOptionTypes', function() {
         it('should call entity:Descriptor with correct values', function() {
            const { mockOptionTypes, testOption } = optionTypesMocks;
            mockOptionTypes(sandbox, entityLib);

            const optionTypes = Breadcrumbs.getOptionTypes();

            assert.hasAllKeys(optionTypes, [
               'items',
               'selectedItemId',
               'readOnly',
               'theme'
            ]);
            testOption(optionTypes, 'items', {
               required: true,
               args: [Array]
            });
            testOption(optionTypes, 'selectedItemId', {
               required: true,
               args: [Number]
            });
            testOption(optionTypes, 'readOnly', {
               args: [Boolean]
            });
            testOption(optionTypes, 'theme', {
               args: [String]
            });
         });
      });
   });
});
