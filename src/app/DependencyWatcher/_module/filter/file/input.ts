import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_module/filter/file/input';

interface IOptions extends IControlOptions {
   textPrefix?: string;
   item: {
      textValue?: string;
      value?: number[];
   };
}

export default class Input extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _textValue?: string;
   protected _selectedKeys?: number[];
   protected _beforeMount(options: IOptions): void {
      this._textValue = (options.item.textValue || '').replace(
         `${options.textPrefix}: `,
         ''
      );
      this._selectedKeys = options.item.value || [];
   }
   // TODO: разобраться зачем тут stopPropagation, если их убрать - отваливается фильтр
   protected _selectedKeysChanged(event: Event, keys: number[]): void {
      this._selectedKeys = keys;
      this._options.item.value = keys;
      event.stopImmediatePropagation();
      event.stopPropagation();
      this._notify('selectedKeysChanged', [keys]);
   }
   protected _valueChanged(event: Event): void {
      event.stopImmediatePropagation();
      event.stopPropagation();
      this._notify('valueChanged', [this._selectedKeys]);
   }
   protected _textValueChanged(event: Event, text: string): void {
      this._textValue = text;
      this._options.item.textValue = text;
      event.stopImmediatePropagation();
      event.stopPropagation();
      this._notify('textValueChanged', [
         this._options.textPrefix ? `${this._options.textPrefix}: ${text}` : ''
      ]);
   }

   static getDefaultOptions(): Partial<IOptions> {
      return {
         textPrefix: 'file'
      };
   }
}
