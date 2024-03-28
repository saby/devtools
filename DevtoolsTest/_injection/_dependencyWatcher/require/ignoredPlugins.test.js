define(['injection/_dependencyWatcher/require/ignoredPlugins'], function(
   ignoredPlugins
) {
   ignoredPlugins = ignoredPlugins.ignoredPlugins;

   describe('injection/_dependencyWatcher/require/ignoredPlugins', function() {
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
