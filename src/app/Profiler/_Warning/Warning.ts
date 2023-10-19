import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import template = require('wml!Profiler/_Warning/Warning');
import { descriptor } from 'Types/entity';
import 'css!Profiler/profiler';

export interface IWarningOptions extends IControlOptions {
   caption: string;
   content: TemplateFunction;
}

/**
 * Control for rendering warnings in commit details.
 * @class Profiler/_Warning/Warning
 * @extends UI/_base/Control
 * @control
 * @public
 * @author Зайцев А.С.
 */
class Warning extends Control<IWarningOptions> {
   protected _template: TemplateFunction = template;
   protected _expanded: boolean = false;

   protected _toggleExpanded(): void {
      this._expanded = !this._expanded;
   }

   static getOptionTypes(): Record<keyof IWarningOptions, unknown> {
      return {
         caption: descriptor(String).required(),
         content: descriptor(Object).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default Warning;
