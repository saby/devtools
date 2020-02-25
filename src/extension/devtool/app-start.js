/**
 * На ts этот файлик переводить нельзя. Наш билдер обернёт содержимое в define, и в итоге IIFE
 * не выполнится пока кто-то не зареквайрит этот файл.
 * Инлайн функции в расширении писать нельзя, так что зареквайрить его никто не сможет.
 */
(function init() {
    require(['is'], (ispl) => {
        // Слой совместимости по умолчанию включен, из-за этого начинает грузиться куча всего ненужного, например, jQuery.
        ispl.features.compatibleLayer = false;

        require([
            'Core/app-start',
            'Controls/Application/HeadData',
            'Application/Env',
            'Core/app-init',
            'View/Executor/TClosure'
        ], function(AppStart, HeadData, AppEnv, appInit) {
            appInit();

            var headData = new HeadData([], true);
            headData.isNewEnvironment = true;
            AppEnv.setStore('HeadData', headData);

            require(['Devtool/PageWrapper'], (Extension) => {
                Extension.default.createControl(
                    Extension.default,
                    {},
                    document.querySelector('#root')
                );
            });
        });
    });
})();
