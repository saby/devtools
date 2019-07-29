// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/list/column/Size';

export default class Size extends Control {
    protected _template = template;
    protected _reloadPage(): void {
        chrome.devtools.inspectedWindow.reload({});
    }
}
