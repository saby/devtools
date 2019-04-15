/**
 * На ts этот файлик переводить нельзя. Наш билдер обернёт содержимое в define, и в итоге IIFE
 * не выполнится пока кто-то не зареквайрит этот файл.
 * Инлайн функции в расширении писать нельзя, так что зареквайрить его никто не сможет.
 */
(function init() {
   require(['is'], (ispl) => {
      // Слой совместимости по умолчанию включен, из-за этого начинает грузиться куча всего ненужного, например, jQuery.
      ispl.features.compatibleLayer = false;

      require(['Extension/Extension'], (Extension) => {
         Extension.default.createControl(Extension.default, {}, document.getElementById('root'));
      });
   });
})();