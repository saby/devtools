define([
   'injection/_hook/prepareForSerialization',
   'DevtoolsTest/getJSDOM'
], function(prepareForSerialization, getJSDOM) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';
   prepareForSerialization = prepareForSerialization.default;

   describe('injection/_hook/prepareForSerialization', function() {
      before(async function() {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
            global.Element = dom.window.Element;
         }
      });

      after(function() {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
            delete global.Element;
         }
      });

      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('prepareForSerialization', function() {
         it('should remove cycles, replace functions and remove unnecessary fields', function() {
            const originalObject = {
               _logicParent: {},
               _events: {},
               controlNode: {},
               _container: document.body,
               __lastGetterPath: ['_options'],
               template: function Controls_buttons_button() {},
               _options: {
                  dataLoadCallback: (function dataLoadCallback() {}).bind(this),
                  value: 1
               },
               state: {
                 itemsContainer: document.createElement('div')
               },
               attributes: {
                  'attr:class': 'controls-Button'
               }
            };
            originalObject.state.circularReference = originalObject;

            assert.deepEqual(prepareForSerialization(originalObject), {
               template: 'function Controls_buttons_button',
               _options: {
                  dataLoadCallback: 'function dataLoadCallback',
                  value: 1
               },
               state: {
                  itemsContainer: 'DIV',
                  circularReference: {
                     $ref: '$'
                  }
               },
               attributes: {
                  'attr:class': 'controls-Button'
               }
            });
         });
      });
   });
});
