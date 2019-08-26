// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_file/SuggestPanel';
import { navigation } from './navigation';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';

export class SuggestPanel extends Control {
    protected readonly _template = template;
    protected readonly _navigation = navigation;
    protected _sorting?: Partial<Record<keyof ITransportFile, "ASC" | "DESC">>[] = [ { size: "ASC" } ];
}
export default SuggestPanel;
