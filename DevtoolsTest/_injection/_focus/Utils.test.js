define([
   'DevtoolsTest/mockChrome',
   'injection/_focus/Utils',
   'DevtoolsTest/getJSDOM'
], function (mockChrome, Utils, getJSDOM) {
   let sandbox;
   const needJSDOM = typeof window === 'undefined';

   describe('injection/_focus/Utils', function () {
      before(async function () {
         if (needJSDOM) {
            const { JSDOM } = await getJSDOM();
            const dom = new JSDOM('');
            global.document = dom.window.document;
            global.window = dom.window;
         }
      });

      after(function () {
         if (needJSDOM) {
            delete global.document;
            delete global.window;
         }
      });

      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      describe('isBrokenLink', function () {
         const configs = [
            {
               tagName: 'a',
               expectedResult: true
            },
            {
               tagName: 'a',
               tabindex: -1,
               expectedResult: true
            },
            {
               tagName: 'a',
               tabindex: -1,
               href: '/',
               expectedResult: true
            },
            {
               tagName: 'a',
               tabindex: 0,
               expectedResult: false
            },
            {
               tagName: 'a',
               tabindex: 1,
               expectedResult: false
            },
            {
               tagName: 'a',
               tabindex: 0,
               href: '/',
               expectedResult: false
            },
            {
               tagName: 'a',
               tabindex: 1,
               href: '/',
               expectedResult: false
            },
            {
               tagName: 'div',
               tabindex: 1,
               expectedResult: false
            },
            {
               tagName: 'div',
               tabindex: -1,
               expectedResult: false
            },
            {
               tagName: 'div',
               tabindex: 0,
               expectedResult: false
            }
         ];
         configs.forEach(({ expectedResult, tagName, href, tabindex }) => {
            it(`should return ${expectedResult} for element: '${tagName}' with href: '${href}' and tabindex: '${tabindex}'`, function () {
               const elem = document.createElement(tagName);
               if (href) {
                  elem.setAttribute('href', href);
               }
               if (typeof tabindex !== 'undefined') {
                  elem.setAttribute('tabindex', tabindex);
               }

               assert.equal(Utils.isBrokenLink(elem), expectedResult);
            });
         });
      });

      describe('canAcceptSelfFocus', function () {
         const configs = [
            {
               tagName: 'div',
               contenteditable: 'false',
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: 'false',
               tabindex: 0,
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: 'false',
               tabindex: 1,
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: 'false',
               tabindex: -1,
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: '',
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: '',
               tabindex: -1,
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: '',
               tabindex: 0,
               expectedResult: true
            },
            {
               tagName: 'div',
               contenteditable: '',
               tabindex: 1,
               expectedResult: true
            },
            {
               tagName: 'div',
               contenteditable: 'true',
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: 'true',
               tabindex: -1,
               expectedResult: false
            },
            {
               tagName: 'div',
               contenteditable: 'true',
               tabindex: 0,
               expectedResult: true
            },
            {
               tagName: 'div',
               contenteditable: 'true',
               tabindex: 1,
               expectedResult: true
            },
            {
               tagName: 'div',
               expectedResult: false
            },
            {
               tagName: 'div',
               tabindex: 0,
               expectedResult: false
            },
            {
               tagName: 'div',
               tabindex: 1,
               expectedResult: false
            },
            {
               tagName: 'div',
               tabindex: -1,
               expectedResult: false
            }
         ];
         const FOCUSABLE_ELEMENTS = [
            'a',
            'link',
            'button',
            'input',
            'select',
            'textarea'
         ];
         FOCUSABLE_ELEMENTS.forEach((elem) => {
            configs.push({
               tagName: elem,
               expectedResult: true
            });
            configs.push({
               tagName: elem,
               tabindex: 0,
               expectedResult: true
            });
            configs.push({
               tagName: elem,
               tabindex: 1,
               expectedResult: true
            });
            configs.push({
               tagName: elem,
               tabindex: -1,
               expectedResult: true
            });
         });
         configs.forEach(
            ({ expectedResult, tagName, contenteditable, tabindex }) => {
               it(`should return ${expectedResult} for element: '${tagName}' with contenteditable: '${contenteditable}' and tabindex: '${tabindex}'`, function () {
                  const elem = document.createElement(tagName);
                  if (typeof contenteditable === 'string') {
                     elem.setAttribute('contenteditable', contenteditable);
                  }
                  if (typeof tabindex !== 'undefined') {
                     elem.setAttribute('tabindex', tabindex);
                  }

                  assert.equal(Utils.canAcceptSelfFocus(elem), expectedResult);
               });
            }
         );
      });
   });
});
