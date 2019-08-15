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
import { IListItem, source, storage } from '../data';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { navigation } from './list/navigation';
import { columns } from './list/column';
import { headers } from './list/header';
import { IItemFilter } from 'Extension/Plugins/DependencyWatcher/IItem';
import { FilterItem, getButtonSource } from './list/getButtonSource';
import { getItemActions, ItemAction, ItemActionNames, visibilityCallback } from './list/getItemActions';
import { ViewMode } from './main/ViewMode';
import { getTabConfig, tabs } from './main/Tabs';
import { IColumn } from '../interface/IColumn';
import { IHeaders } from '../interface/IHeaders';

interface IChildren {
    listView: Control;
}

export default class Main extends Control {
    protected readonly _template = template;
    protected readonly _children: IChildren;
    protected readonly _column: Partial<IColumn<IListItem>>[] = columns;
    protected readonly _headers: IHeaders<IListItem> = headers;
    protected readonly _navigation = navigation;
    protected readonly _itemActionVisibilityCallback = visibilityCallback;
    protected readonly _modeSource: Memory = tabs;
    protected _filterButtonSource: FilterItem[];
    protected _filter: source.IWhere<IItemFilter>;
    protected _source: source.ListAbstract;
    protected _root?: string;
    protected _searchValue?: string;
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
        this._filterButtonSource = getButtonSource({
            fileSource: new source.File({
                logger: this.__logger.create('FileSource'),
                idProperty: 'id',
                fileStorage: new storage.File(this.__rpc)
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
        this._searchValue = '';
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
                this.__setFilter({
                    parent: undefined,
                    'files': [model.get('fileId')]
                });
                this._root = undefined;
                this._setFilterValue('files', [model.get('fileId')], `file: ${ model.get('fileName') }`);
                this._setFilterValue('dependentOnFiles');
                this._filterButtonSource = [...this._filterButtonSource];
            },
            [ItemActionNames.dependentOnFile]: (model: Model) => {
                this.__setFilter({
                    parent: undefined,
                    'files': [model.get('fileId')]
                });
                this._root = undefined;
                this._setFilterValue('dependentOnFiles', [model.get('fileId')], `depend on: ${ model.get('fileName') }`);
                this._setFilterValue('files');
                this._filterButtonSource = [...this._filterButtonSource];
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
                parent: ['files', 'dependentOnFiles']
            },
            logger: this.__logger.create('source'),
            idProperty: 'id',
            parentProperty: 'parent'
        }
    }
    protected _filterChanged(event: unknown, filter: source.IWhere<IItemFilter>) {
        // TODO 86d9e478a7d3 - очистка значений, которые внесли руками в FilterButtonSource при изменении фильтра
        const keys: Array<keyof source.IWhere<IItemFilter>> = ['files', 'dependentOnFiles'];
        const updated = keys.some((resetId) => {
            if (filter.hasOwnProperty(resetId) &&
                Array.isArray(filter[resetId]) &&
                (<number[]> filter[resetId]).length
            ) {
                return false;
            }
            return this._setFilterValue(resetId);
        });
        if (updated) {
            this._filterButtonSource = [...this._filterButtonSource];
        }
    }
    protected _setFilterValue<T>(id: keyof source.IWhere<IItemFilter>, value?: T, textValue?: string): boolean {
        // TODO 86d9e478a7d3 - прокидывание данных в items внутри filterButtonSource
        const item = this._filterButtonSource.find(({ name }) => {
            return name == id
        });
        if (!item ||
            value == item.value
        ) {
            return false;
        }
        if (!value) {
            // reset
            if (
                item.value == item.resetValue ||
                Array.isArray(item.value) && !item.value.length
            ) {
                return false
            }
        }
        item.value = value || item.resetValue;
        item.textValue = textValue || '';
        return true;
    }
}
/*
 * TODO 86d9e478a7d3
 *  Костыль для прокидывания поля фильтрации в filter.Controller > filter.Button сверху
 *  В текущей реализации он либо не отрисует значение фильтра, либо затрёт значение, т.к. оно выставлено не самим фильтром
 *  (в зависимости от параметров FilterButtonSource)
 *  Убрать после задачи:
 *  https://online.sbis.ru/opendoc.html?guid=bdbdae9b-a626-42a7-bda8-86d9e478a7d3
 */
