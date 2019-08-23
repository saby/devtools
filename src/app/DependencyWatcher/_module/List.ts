// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_module/List';
import { Model } from 'Types/entity';
import { IListItem, source } from '../data';
import { navigation } from './navigation';
import { columns } from './column';
import { headers } from './header';
import { IRPCModeuleFilter } from 'Extension/Plugins/DependencyWatcher/IRPCModule';
import { FilterItem, getButtonSource } from './getButtonSource';
import { getItemActions, ItemAction, ItemActionNames, visibilityCallback } from './getItemActions';
import { IColumn } from '../interface/IColumn';
import { IHeaders } from '../interface/IHeaders';

interface IChildren {
    listView: Control;
}

interface Config {
    source: source.ListAbstract;
    fileSource: source.File;
}

export default class List extends Control {
    protected readonly _template = template;
    protected readonly _children: IChildren;
    protected readonly _column: Partial<IColumn<IListItem>>[] = columns;
    protected readonly _headers: IHeaders<IListItem> = headers;
    protected readonly _navigation = navigation;
    protected readonly _itemActionVisibilityCallback = visibilityCallback;
    protected _filterButtonSource: FilterItem[];
    protected _filter: source.IWhere<IRPCModeuleFilter>;
    protected _root?: string;
    protected _searchValue?: string;
    protected _sorting?: object;
    protected _itemActions: ItemAction[];
    protected _notify: (eventName: string, args: unknown[]) => unknown;
    constructor(config: Config) {
        super(config);
        this._filterButtonSource = getButtonSource({
            fileSource: config.fileSource
        });
        this.__setItemActions();
    }
    reload() {
        if (this._children.listView) {
            this._children.listView.reload();
        }
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
                this._notify('openSource', [model.get('itemId')]);
            }
        });
    }
    
    private __setFilter(filter: source.IWhere<IRPCModeuleFilter>) {
        const id = Math.random();
        this._filter = {
            ...filter,
            //@ts-ignore
            getVersion() {
                return id;
            }
        }
    }

    protected _filterChanged(event: unknown, filter: source.IWhere<IRPCModeuleFilter>) {
        // TODO 86d9e478a7d3 - очистка значений, которые внесли руками в FilterButtonSource при изменении фильтра
        const keys: Array<keyof source.IWhere<IRPCModeuleFilter>> = ['files', 'dependentOnFiles'];
        const updated                                             = keys.some((resetId) => {
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
    protected _setFilterValue<T>(id: keyof source.IWhere<IRPCModeuleFilter>, value?: T, textValue?: string): boolean {
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
