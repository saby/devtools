import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!DependencyWatcher/_main/View');
import { RPC } from 'Extension/Event/RPC';
import { IEventEmitter } from 'Extension/Event/IEventEmitter';
import {
   EventNames,
   PLUGIN_NAME,
   RPCMethodNames
} from 'Extension/Plugins/DependencyWatcher/const';
import { ContentChannel } from '../../Devtool/Event/ContentChannel';
import { Memory } from 'Types/source';
import { Model } from 'Types/entity';
import { source, storage } from '../data';
import { INamedLogger } from 'Extension/Logger/ILogger';
import { ConsoleLogger } from 'Extension/Logger/Console';
import { ViewMode } from './ViewMode';
import { getTabConfig, tabs } from './Tabs';
import { List } from '../module';
import 'css!DependencyWatcher/main';

interface IChildren {
   moduleList: List;
}

/**
 * Controller of the "Dependencies" tab.
 * @author Зайцев А.С.
 */
export default class View extends Control {
   protected readonly _template: TemplateFunction = template;
   protected readonly _children: IChildren;
   protected readonly _modeSource: Memory = tabs;
   protected _source: source.ListAbstract;
   protected _fileSource: source.File;
   protected _modeCaption: string;
   protected _modeTitle: string;
   private _viewMode: ViewMode;
   private readonly _rpc: RPC;
   private _isRecording: boolean = true;

   private _sourceConfig: source.IListConfig;
   private _logger: INamedLogger = new ConsoleLogger('DependencyWatcher');
   private _channel: IEventEmitter = new ContentChannel(PLUGIN_NAME);
   private _onUpdateHandler: () => void;

   constructor(options: object) {
      super(options);
      this._rpc = new RPC({ channel: this._channel });
      this._fileSource = new source.File({
         logger: this._logger.create('FileSource'),
         idProperty: 'id',
         fileStorage: new storage.File(this._rpc)
      });
      this.__addListener();
      this.__initSourceConfig();
      this.__changeView(ViewMode.dependent);
   }
   private __changeView(mode: ViewMode): void {
      if (this._viewMode === mode) {
         return;
      }
      this._viewMode = mode;
      const config = getTabConfig(mode);
      this._modeCaption = config.caption;
      this._modeTitle = config.title;
      this._source = new config.Source(this._sourceConfig);
   }
   protected _changeView(event: unknown, model: Model): void {
      const mode: ViewMode = model.getId();
      this.__changeView(mode);
   }
   private __addListener(): void {
      this._onUpdateHandler = this.__onUpdate.bind(this);
      this._channel.addListener(EventNames.update, this._onUpdateHandler);
   }

   private __onUpdate(): void {
      if (this._children.moduleList && this._isRecording) {
         this._children.moduleList.reload();
      }
   }
   protected _beforeUnmount(): void {
      this._channel.destructor();
   }

   protected _openSource(event: Event, id: number): void {
      this._rpc
         .execute<boolean, number>({
            methodName: RPCMethodNames.moduleOpenSource,
            args: id
         })
         .then((result: boolean) => {
            if (!result) {
               return;
            }
            chrome.devtools.inspectedWindow.eval(
               'inspect(window.__WASABY_DEV_MODULE__)'
            );
         });
   }
   private __initSourceConfig(): void {
      this._sourceConfig = {
         itemStorage: new storage.Module(this._rpc),
         defaultFilters: {
            css: false,
            json: false,
            i18n: false,
            onlyDeprecated: false
         },
         ignoreFilters: {
            parent: ['files', 'dependentOnFiles', 'onlyDeprecated']
         },
         logger: this._logger.create('source'),
         idProperty: 'id',
         parentProperty: 'parent'
      };
   }
   private __toggleRecording(): void {
      this._isRecording = !this._isRecording;
   }
}
