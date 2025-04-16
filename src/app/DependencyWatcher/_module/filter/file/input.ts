import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!DependencyWatcher/_module/filter/file/input');
import {EventUtils} from 'UI/Events';

interface IOptions extends IControlOptions {
   textValue: string;
   value: number[];
}

/*
This file is needed solely for filtering events from a lookup.
Because of type mismatch, we can't directly use value from the lookup. It is a string in the lookup
and an array in the filter.
So we stop value changed event, and replace the name of the selectedKeysChanged event with valueChanged.
 */
export default class Input extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _notifyHandler: Function = EventUtils.tmplNotify;
   private _onValueChanged(e: Event): void {
      e.stopPropagation();
   }
}
