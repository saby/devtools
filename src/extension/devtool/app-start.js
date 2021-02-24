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
            'Application/Env',
            'Application/Initializer',
            'Application/State',
            'UI/State'
        ], function(AppEnv, AppInit, AppState, UIState) {
            require(['UI/Base'], function(UI) {
                window.startContextData = { AppData: new UI.AppData({}) };
                var sr = new AppState.StateReceiver(UIState.Serializer);
                AppInit.default(window.wsConfig, void 0, sr);
                UI.headDataStore.write('isNewEnvironment', true);

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
