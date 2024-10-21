import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!Devtool/Layout/Browser');
import 'css!Devtool/Layout/Browser';

interface IOptions extends IControlOptions {
   headTemplate?: TemplateFunction;
   content: TemplateFunction;
}

class Browser extends Control<IOptions> {
   protected _template: TemplateFunction = template;
}

export default Browser;
