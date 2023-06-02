define(['injection/_hook/_utils/parseStacksOfReactiveProps'], function (
   parseStacksOfReactiveProps
) {
   describe('injection/_hook/_utils/parseStacksOfReactiveProps', function () {
      let sandbox;
      parseStacksOfReactiveProps =
         parseStacksOfReactiveProps.parseStacksOfReactiveProps;

      const INTERNAL_STACK = 'eval at saveChangedProps (https://fix-cdn.sbis.ru/resources/UI/DevtoolsHook.js:188:71)\n'.repeat(
         2
      );

      beforeEach(function () {
         sandbox = sinon.createSandbox();
      });

      afterEach(function () {
         sandbox.restore();
      });

      it('should return undefined when called without arguments', function () {
         assert.isUndefined(parseStacksOfReactiveProps());
      });

      it('should correctly transform old reactive props to the frontend format', function () {
         const result = parseStacksOfReactiveProps([
            'selectedKeys',
            'excludedKeys'
         ]);

         assert.deepEqual(result, [
            {
               name: 'selectedKeys'
            },
            {
               name: 'excludedKeys'
            }
         ]);
      });

      it('should correctly transform reactive props to the frontend format', function () {
         const result = parseStacksOfReactiveProps([
            {
               name: 'selectedKeys'
            },
            {
               name: 'excludedKeys'
            }
         ]);

         assert.deepEqual(result, [
            {
               name: 'selectedKeys',
               stack: undefined
            },
            {
               name: 'excludedKeys',
               stack: undefined
            }
         ]);
      });

      it('should correctly transform reactive props to the frontend format (with stacks)', function () {
         const result = parseStacksOfReactiveProps([
            {
               name: 'selectedKeys',
               stack:
                  INTERNAL_STACK +
                  'eval at req.exec (https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js:1:5064), <anonymous>\n' +
                  'eval at new req.exec (https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js:1:5064)\n' +
                  'at new req.exec (https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js:1:5064)\n' +
                  'at https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js:1:5064'
            },
            {
               name: 'excludedKeys',
               stack:
                  INTERNAL_STACK +
                  'at overrides.constructor.f (eval at req.exec (https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js:1:5064), <anonymous>:3:2948)\n' +
                  'at constructor.reactiveSetter [as _showActions] (https://fix-cdn.sbis.ru/resources/UI/_reactivity/ReactiveObserver.js?x_module=20.6110-46:193:50)\n' +
                  'at Array.find (<anonymous>)'
            }
         ]);

         assert.deepEqual(result, [
            {
               name: 'selectedKeys',
               stack: [
                  {
                     name: 'req.exec',
                     url:
                        'https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js',
                     lineNumber: 0
                  },
                  {
                     name: 'req.exec',
                     url:
                        'https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js',
                     lineNumber: 0
                  },
                  {
                     name: 'req.exec',
                     url:
                        'https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js',
                     lineNumber: 0
                  },
                  {
                     name: 'anonymous',
                     url:
                        'https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js',
                     lineNumber: 0
                  }
               ]
            },
            {
               name: 'excludedKeys',
               stack: [
                  {
                     name: 'req.exec',
                     url:
                        'https://fix-cdn.sbis.ru/cdn/RequireJS/2.3.5-p8/require.min.js',
                     lineNumber: 0
                  },
                  {
                     name: 'constructor.reactiveSetter [as _showActions]',
                     url:
                        'https://fix-cdn.sbis.ru/resources/UI/_reactivity/ReactiveObserver.js?x_module=20.6110-46',
                     lineNumber: 192
                  }
               ]
            }
         ]);
      });
   });
});
