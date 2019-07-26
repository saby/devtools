// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_view/main/Main';
import { RPC } from 'Extension/Event/RPC';
import 'css!DependencyWatcher/_view/main/Main';
import { IEventEmitter } from 'Extension/Event/IEventEmitter';
import { EventNames, PLUGIN_NAME, RPCMethodNames } from 'Extension/Plugins/DependencyWatcher/const';
import { ContentChannel } from '../../Devtool/Event/ContentChannel';
import { Memory } from 'Types/source';
import { Model } from 'Types/entity';
import { source, storage } from '../data';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { navigation } from './list/navigation';
import { columns, Columns } from './list/column';
import { headers, Headers } from './list/header';
import { IItemFilter } from 'Extension/Plugins/DependencyWatcher/IItem';
import { FilterItem, getButtonSource } from './list/getButtonSource';
import { getItemActions, ItemAction, ItemActionNames, visibilityCallback } from './list/getItemActions';
import { ViewMode } from './main/ViewMode';
import { getTabConfig, tabs } from './main/Tabs';

interface IChildren {
    listView: Control;
}

export default class Main extends Control {
    protected readonly _template = template;
    protected readonly _children: IChildren;
    protected readonly _column: Columns = columns;
    protected readonly _headers: Headers = headers;
    protected readonly _navigation = navigation;
    protected readonly _itemActionVisibilityCallback = visibilityCallback;
    protected readonly _modeSource: Memory = tabs;
    protected _filterButtonSource: FilterItem[];
    protected _filter: source.IWhere<IItemFilter>;
    protected _source: source.ListAbstract;
    protected _root?: string;
    protected _sorting?: object;
    protected _itemActions: ItemAction[];
    protected _modeCaption: string;
    protected _modeTitle: string;
    private __viewMode: ViewMode;
    private readonly __rpc: RPC;
    
    private __sourceConfig: source.IListConfig;
    private __logger: INamedLogger = new ConsoleLogger('DependencyWatcher');
    private __channel: IEventEmitter = new ContentChannel(PLUGIN_NAME);

    constructor(...args: unknown[]) {
        super(...args);
        this.__rpc = new RPC({ channel: this.__channel });
        storage.setFileStorage(new storage.File(this.__rpc));
        this._filterButtonSource = getButtonSource({
            fileSource: new source.File({
                logger: this.__logger.create('FileSource'),
                idProperty: 'id',
                // rpc: cfg.sourceConfig.rpc
            })
        });
        this.__addListener();
        this.__setItemActions();
        this.__initSourceConfig();
        this.__changeView(ViewMode.dependent);
    }
    private __changeView(mode: ViewMode) {
        if (this.__viewMode == mode) {
            return;
        }
        this.__viewMode = mode;
        const config = getTabConfig(mode);
        this._modeCaption = config.caption;
        this._modeTitle = config.title;
        this._source = new config.Source(this.__sourceConfig);
    }
    protected _changeView(event: unknown, model: Model) {
        const mode: ViewMode = model.getId();
        this.__changeView(mode);
    }
    private __addListener() {
        this.__onUpdateHandler = this.__onUpdate.bind(this);
        this.__channel.addListener(EventNames.update, this.__onUpdateHandler);
    }
    private __onUpdateHandler: () => void;
    private __onUpdate(...args: unknown[]) {
        if (this._children.listView) {
            this._children.listView.reload();
        }
    }
    protected _beforeUnmount() {
        this.__channel.removeListener(EventNames.update, this.__onUpdateHandler);
        this.__channel.destructor();
        delete this.__channel;
    }

    private __setItemActions() {
        this._itemActions = getItemActions({
            [ItemActionNames.file]: (model: Model) => {
                const files = this._filterButtonSource.find(({ name }) => {
                    return name == 'files'
                });
                if (!files) {
                    return;
                }
                this.__setFilter({
                    parent: undefined,
                    files: [model.get('fileId')]
                });
                this._root = undefined;
                files.value = [model.get('fileId')];
                files.textValue = model.get('fileName');
                this._filterButtonSource = [...this._filterButtonSource];
            },
            [ItemActionNames.dependentOnFile]: (model: Model) => {
                this.__setFilter({
                    parent: undefined,
                    dependentOnFile: model.get('fileId')
                });
                this._root = undefined;
                // this._filterItems.push(fileId);
            },
            [ItemActionNames.openSource]: (model: Model) => {
                this.__rpc.execute<boolean, number>({
                    methodName: RPCMethodNames.openSource,
                    args: model.get('itemId')
                }).then((result: boolean) => {
                    if (!result) {
                        return;
                    }
                    chrome.devtools.inspectedWindow.eval(
                        'inspect(window.__WASABY_DEV_MODULE__)'
                    );
                })
            }
        });
    }

    private __setFilter(filter: source.IWhere<IItemFilter>) {
        const id = Math.random();
        this._filter = {
            ...filter,
            //@ts-ignore
            getVersion() {
                return id;
            }
        }
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
                parent: ['files', 'dependentOnFile']
            },
            logger: this.__logger.create('source'),
            idProperty: 'id',
            parentProperty: 'parent'
        }
    }
}
