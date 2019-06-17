define('Devtool/Page/Application', [
    'Core/Control',
    'wml!Devtool/Page/Application'
], function (Base,
      template,
) {
    /*
     * перенос частичной логики Core/Application для работоспособности контролов
     * https://online.sbis.ru/opendoc.html?guid=cb550f66-af72-4bfc-80ec-f279eed498c7
     * TODO убрать после:
     *  https://online.sbis.ru/opendoc.html?guid=156aa5b7-286b-4885-9088-56c835816229
     */
    return Base.extend({
        _template: template
    });
});
