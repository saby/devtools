define(['injection/_dependencyWatcher/require/ignoredPlugins'], function(
   ignoredPlugins
) {
   let sandbox;
   ignoredPlugins = ignoredPlugins.ignoredPlugins;

   describe('injection/_dependencyWatcher/require/ignoredPlugins', function() {
      beforeEach(function() {
         sandbox = sinon.createSandbox();
      });

      afterEach(function() {
         sandbox.restore();
      });

      describe('should remove prefix', function() {
         const ignoredPrefixes = [
            'browser!',
            'optional!',
            'preload!',
            'is!browser?'
         ];

         ignoredPrefixes.forEach((prefix, index) => {
            it(prefix, () => {
               assert.equal(
                  ignoredPlugins[index](`${prefix}Controls/Application`),
                  'Controls/Application'
               );
            });
         });
      });
   });
});
