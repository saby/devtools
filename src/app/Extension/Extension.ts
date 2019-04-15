import Control = require('Core/Control');
import template = require('wml!Extension/Extension');

class Extension extends Control {
   _template: Function = template;
   private _value: string = '';
   private _inputHandler(e: Event) {
      const target = <HTMLInputElement>e.target;
      this._value = target.value;
   }
}

export default Extension;
