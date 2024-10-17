/**
 * На ts этот файлик переводить нельзя. Наш билдер обернёт содержимое в define, и в итоге IIFE
 * не выполнится пока кто-то не зареквайрит этот файл.
 * Инлайн функции в расширении писать нельзя, так что зареквайрить его никто не сможет.
 */
(function init() {
    require(['is'], (ispl) => {
        // Слой совместимости по умолчанию включен, из-за этого начинает грузиться куча всего ненужного, например, jQuery.
        ispl.features.compatibleLayer = false;

        function getThemeName(userTheme) {
            const themeName = (!userTheme || userTheme === 'devtools') ? chrome.devtools.panels.themeName : userTheme;
            switch (themeName) {
                case 'light':
                    return 'devtools__light';
                case 'dark':
                    return 'devtools__dark';
                default:
                    return 'devtools__light';
            }
        }

        function getTheme() {
            return new Promise((resolve) => {
                chrome.storage.sync.get('theme', (result) => {
                    resolve(getThemeName(result.theme));
                });
            });
        }

        require([
            'Application/Env',
            'Application/Initializer',
            'Application/State',
            'UI/State'
        ], function(AppEnv, AppInit, AppState, UIState) {
            window.startContextData = { AppData: new UIState.AppData({}) };
            var sr = new AppState.StateReceiver(UIState.Serializer);
            AppInit.default(window.wsConfig, void 0, sr);

            getTheme().then((theme) => {
                require(['Devtool/PageWrapper'], (Extension) => {
                    Extension.default.createControl(
                        Extension.default,
                        {
                            theme
                        },
                        document.querySelector('#root')
                    );
                });
            });
        });
    });
})();
