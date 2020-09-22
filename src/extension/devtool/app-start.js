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
            'Controls/Application/HeadData',
            'Application/Env',
            'Application/Initializer'
        ], function(HeadData, AppEnv, AppInit) {
            require(['UI/Base'], function(UI) {
                window.startContextData = { AppData: new UI.AppData({}) };
                var sr = new UI.StateReceiver();
                AppInit.default(window.wsConfig, void 0, sr);

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
    });
})();
