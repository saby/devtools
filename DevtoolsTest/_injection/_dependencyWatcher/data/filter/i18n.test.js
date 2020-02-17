define(['injection/_dependencyWatcher/data/filter/i18n'], function(
   i18n
) {
   i18n = i18n.i18n;

   describe('injection/_dependencyWatcher/data/filter/i18n', function() {
      it('should return true if name doesn\'t start with i18n!', function() {
         assert.isFalse(i18n({
            name: 'i18n!Controls/Application'
         }));
         assert.isTrue(i18n({
            name: 'Controls/Application'
         }));
      });
   });
});
