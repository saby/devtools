import Control = require('Core/Control');
import template = require('wml!Elements/Elements');
import { descriptor } from 'Types/entity';
import { IControlNode } from 'interface/Element';

interface IOptions {
   elements?: IControlNode[];
}

class Elements extends Control {
   protected _template: Function = template;
   protected readonly _options: Readonly<IOptions>;
   protected _selectedItem: IControlNode | undefined;

   constructor(options: Readonly<IOptions>) {
      super();
      if (options.elements) {
         this._selectedItem = options.elements[0];
      }
   }

   protected _beforeUpdate(newOptions: Readonly<IOptions>): void {
      if (!this._options.elements && newOptions.elements) {
         this._selectedItem = newOptions.elements[0];
      }

      if (!newOptions.elements) {
         this._selectedItem = undefined;
      }
   }

   protected _beforeUnmount(): void {
      this._selectedItem = undefined;
   }

   protected _onItemClick(e: Event, item: IControlNode): void {
      this._selectedItem = item;
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         elements: descriptor(Array).arrayOf(Object)
      };
   }
}

export default Elements;
