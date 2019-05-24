import Control = require('Core/Control');
import template = require('wml!Elements/Details/Pane');
import { descriptor } from 'Types/entity';
import { TEMPLATES } from './const';

import 'css!Elements/Details/Pane';

interface IOptions {
   caption: string;
   data: object;
   expanded: boolean;
   canStoreAsGlobal?: boolean;
}

//TODO: сделать это через async
import './templates/StringTemplate';
import './templates/NumberTemplate';
import './templates/ObjectTemplate';
import './templates/BooleanTemplate';

class Pane extends Control {
   protected _template: Function = template;
   protected _options: IOptions;

   private __getTemplate(value: unknown): string {
      const type = typeof value;
      if (TEMPLATES.hasOwnProperty(type)) {
         return TEMPLATES[type];
      }
      return TEMPLATES.string;
   }

   private __toggleExpanded(): void {
      this._notify('expandedChanged', [!this._options.expanded]);
   }

   private __viewFunctionSource(e: Event, path: Array<string | number>): void {
      this._notify('viewFunctionSource', [path.concat(this._options.caption.toLowerCase())]);
   }

   private __storeAsGlobal(e: Event, path: Array<string | number>): void {
      if (this._options.canStoreAsGlobal) {
         this._notify('storeAsGlobal', [path.concat(this._options.caption.toLowerCase())]);
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         caption: descriptor(String).required(),
         data: descriptor(Object).required(),
         expanded: descriptor(Boolean).required(),
         canStoreAsGlobal: descriptor(Boolean)
      };
   }

   static getDefaultOptions(): Partial<IOptions> {
      return {
         canStoreAsGlobal: true
      };
   }
}

export default Pane;
