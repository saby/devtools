/**
 * If jsdom gets required several times (e.g. from several modules, require throws the following error:
 * "Mismatched anonymous define() module"
 * This is a workaround that ensures that jsdom gets required only once.
 */
define('DevtoolsTest/getJSDOM', [], function() {
   let requirePromise;

   function getJSDOM() {
      if (!requirePromise) {
         requirePromise = new Promise((resolve) => {
            require(['jsdom'], (jsdom) => {
               resolve(jsdom);
            });
         });
      }

      return requirePromise;
   }

   return getJSDOM;
});
