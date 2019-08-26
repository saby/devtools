// @ts-ignore
import * as Control from 'Core/Control';
// @ts-ignore
import * as template from 'wml!DependencyWatcher/_main/View';
import { RPC } from 'Extension/Event/RPC';
import 'css!DependencyWatcher/_main/View';
import { IEventEmitter } from 'Extension/Event/IEventEmitter';
import { EventNames, PLUGIN_NAME, RPCMethodNames } from 'Extension/Plugins/DependencyWatcher/const';
import { ContentChannel } from '../../Devtool/Event/ContentChannel';
import { Memory } from 'Types/source';
import { Model } from 'Types/entity';
import { source, storage } from '../data';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { ViewMode } from './ViewMode';
import { getTabConfig, tabs } from './Tabs';
import { List } from '../module';

interface IChildren {
    moduleList: List;
}

export default class View extends Control {
    protected readonly _template = template;
    protected readonly _children: IChildren;
    protected readonly _modeSource: Memory = tabs;
    protected _source: source.ListAbstract;
    protected _fileSource: source.File;
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
        this._fileSource = new source.File({
            logger: this.__logger.create('FileSource'),
            idProperty: 'id',
            fileStorage: new storage.File(this.__rpc)
        });
        this.__addListener();
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
        // this._searchValue = '';
        // this._root = undefined;
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
        if (this._children.moduleList) {
            this._children.moduleList.reload();
        }
    }
    protected _beforeUnmount() {
        this.__channel.removeListener(EventNames.update, this.__onUpdateHandler);
        this.__channel.destructor();
        delete this.__channel;
    }

    protected _openSource(event: Event, id: number) {
        this.__rpc.execute<boolean, number>({
            methodName: RPCMethodNames.moduleOpenSource,
            args: id
        }).then((result: boolean) => {
            if (!result) {
                return;
            }
            chrome.devtools.inspectedWindow.eval(
                'inspect(window.__WASABY_DEV_MODULE__)'
            );
        })
    }
    private __initSourceConfig() {
        this.__sourceConfig = {
            itemStorage: new storage.Module(this.__rpc),
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
/*
 * TODO 86d9e478a7d3
 *  Костыль для прокидывания поля фильтрации в filter.Controller > filter.Button сверху
 *  В текущей реализации он либо не отрисует значение фильтра, либо затрёт значение, т.к. оно выставлено не самим фильтром
 *  (в зависимости от параметров FilterButtonSource)
 *  Убрать после задачи:
 *  https://online.sbis.ru/opendoc.html?guid=bdbdae9b-a626-42a7-bda8-86d9e478a7d3
 */
