// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_template/filter/file/input';

interface Options {
    textPrefix?: string;
    item: {
        textValue?: string;
        value?: number[];
    }
}

export default class Input extends Control {
    protected _template = template;
    protected _textValue?: string;
    protected _selectedKeys?: number[];
    protected _notify: (eventName: string, args: unknown[]) => void;
    protected _options: Options;
    protected _prefix: string;
    protected _beforeMount(options: Options) {
        this._prefix = options.textPrefix || 'file';
        this._textValue = (options.item.textValue || '').replace(`${ this._prefix }: `, '');
        this._selectedKeys = options.item.value || [];
    }
    protected _selectedKeysChanged(event: Event, keys?: number[]) {
        this._selectedKeys = keys;
        this._options.item.value = keys;
        event.stopImmediatePropagation();
        event.stopPropagation();
        this._notify('selectedKeysChanged', [keys]);
    }
    protected _valueChanged(event: Event, value?: unknown) {
        event.stopImmediatePropagation();
        event.stopPropagation();
        this._notify('valueChanged', [this._selectedKeys]);
    }
    protected _textValueChanged(event: Event, text?: string) {
        this._textValue = text;
        this._options.item.textValue = text;
        event.stopImmediatePropagation();
        event.stopPropagation();
        this._notify('textValueChanged', [
            this._prefix? `${ this._prefix }: ${ text }`: ''
        ]);
    }
}
