// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_file/View';
import { RPC } from 'Extension/Event/RPC';
import 'css!DependencyWatcher/_view/main/Main';
import { source, storage } from '../data';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { navigation } from './navigation';
import { IItemFilter } from 'Extension/Plugins/DependencyWatcher/IItem';
// import { FilterItem, getButtonSource } from './list/getButtonSource';
import { ITransportFile } from 'Extension/Plugins/DependencyWatcher/IFile';

interface IChildren {
    listView: Control;
}

export default class Main extends Control {
    protected readonly _template = template;
    protected readonly _children: IChildren;
    protected readonly _navigation = navigation;
    // protected _filterButtonSource: FilterItem[];
    protected _filter: source.IWhere<IItemFilter>;
    protected _source: source.ListAbstract;
    private readonly __rpc: RPC;
    
    private __sourceConfig: source.IListConfig;
    private __logger: INamedLogger = new ConsoleLogger('DependencyWatcher');
    
    constructor(...args: unknown[]) {
        super(...args);
        // this._filterButtonSource = getButtonSource({
        //     fileSource: new source.File({
        //         logger: this.__logger.create('FileSource'),
        //         idProperty: 'id',
        //         // rpc: cfg.sourceConfig.rpc
        //     })
        // });
        this.__initSourceConfig();
    }
    
    private __initSourceConfig() {
        this.__sourceConfig = {
            itemStorage: new storage.Item(this.__rpc),
            defaultFilters: {
                css:  false,
                json: false,
                i18n: false
            },
            ignoreFilters: {
                parent: ['files', 'dependentOnFiles']
            },
            logger: this.__logger.create('source'),
            idProperty: 'id',
            parentProperty: 'parent'
        }
    }
}
