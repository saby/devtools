import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!DependencyWatcher/_file/SuggestPanel');
import { navigation } from './navigation';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';

export class SuggestPanel extends Control {
   protected readonly _template: TemplateFunction = template;
   protected readonly _navigation: object = navigation;
   protected _sorting: Array<Partial<
      Record<keyof ITransportFile, 'ASC' | 'DESC'>
   >> = [{ size: 'ASC' }];
}
export default SuggestPanel;
