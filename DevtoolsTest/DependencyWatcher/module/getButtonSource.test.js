define([
   'DevtoolsTest/mockChrome',
   'DependencyWatcher/_module/getButtonSource',
   'i18n!DevtoolsTest'
], function(mockChrome, getButtonSource, rk) {
   getButtonSource = getButtonSource.getButtonSource;

   describe('DependencyWatcher/_module/getButtonSource', function() {
      describe('getButtonSource', function() {
         it('should return the data for a filter button source', function() {
            const source = {};

            assert.deepEqual(getButtonSource({
               fileSource: source
            }), [{
               name: 'json',
               textValue: 'json!',
               itemText: rk('Файлы конфигурации'),
               additionalText: rk('Включая файлы конфигураций'),
               value: false,
               resetValue: false,
               visibility: false,
               viewMode: 'extended'
            }, {
               name: 'css',
               textValue: 'css!',
               itemText: rk('Файлы стилей'),
               additionalText: rk('Включая файлы стилей'),
               value: false,
               resetValue: false,
               visibility: false,
               viewMode: 'extended'
            }, {
               name: 'i18n',
               textValue: 'i18n!',
               itemText: rk('Файлы локализации'),
               additionalText: rk('Включая файлы локализаций'),
               value: false,
               resetValue: false,
               visibility: false,
               viewMode: 'extended'
            }, {
               name: 'onlyDeprecated',
               textValue: 'onlyDeprecated',
               itemText: rk('Только устаревшие модули'),
               additionalText: rk('Только устаревшие модули'),
               value: false,
               resetValue: false,
               visibility: false,
               viewMode: 'extended'
            }, {
               name: 'files',
               id: 'files',
               value: [],
               resetValue: [],
               visibility: true,
               viewMode: 'base',
               textValue: '',
               source
            }, {
               name: 'dependentOnFiles',
               id: 'dependentOnFiles',
               value: [],
               resetValue: [],
               visibility: true,
               viewMode: 'base',
               textValue: '',
               source
            }]);
         });
      });
   });
});
