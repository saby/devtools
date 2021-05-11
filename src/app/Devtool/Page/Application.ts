import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { SyntheticEvent } from 'UICommon/Events';
import * as template from 'wml!Devtool/Page/Application';
import { RegisterClass } from 'Controls/event';
import { ControllerClass, IDragObject } from 'Controls/dragnDrop';
import { GlobalController, ManagerClass } from 'Controls/popup';
interface IApplicationOptions extends IControlOptions {
   popupHeaderTheme: string;
}

/*
 * перенос частичной логики Core/Application для работоспособности контролов
 * https://online.sbis.ru/opendoc.html?guid=cb550f66-af72-4bfc-80ec-f279eed498c7
 * TODO убрать после:
 *  https://online.sbis.ru/opendoc.html?guid=156aa5b7-286b-4885-9088-56c835816229
 */
export default class Application extends Control<IApplicationOptions> {
   protected _template: TemplateFunction = template;
   private registers: Record<string, RegisterClass> = {};
   private dragnDropController: ControllerClass;
   private globalPopup: GlobalController;
   private popupManager: ManagerClass;

   protected _beforeMount(cfg: IApplicationOptions): void {
      this.createDragnDropController();
      this.createGlobalPopup();
      this.createPopupManager(cfg);
      this.createRegisters();
   }

   protected _afterMount(cfg: IApplicationOptions): void {
      window.addEventListener('resize',  this._resizePage.bind(this));
      this.globalPopup.registerGlobalPopup();
      this.popupManager.init(cfg);
   }

   protected _beforeUnmount(): void {
      document.body.onresize = null;
      Object.values(this.registers).forEach((register) => {
         register.destroy();
      });
      this.globalPopup.registerGlobalPopupEmpty();
      this.popupManager.destroy();
      this.dragnDropController.destroy();
   }

   protected _afterUpdate(cfg: IApplicationOptions): void {
      this.popupManager.updateOptions(this._options.popupHeaderTheme);
   }

   protected _scrollPage(ev: SyntheticEvent<Event>): void {
      this.registers.scroll.start(ev);
   }

   protected _resizePage(ev: Event): void {
      this.registers.controlResize.start(ev);
   }

   protected _mousemovePage(ev: SyntheticEvent<Event>): void {
      this.registers.mousemove.start(ev);
   }

   protected _touchmovePage(ev: SyntheticEvent<Event>): void {
      this.registers.touchmove.start(ev);
   }

   protected _touchendPage(ev: SyntheticEvent<Event>): void {
      this.registers.touchend.start(ev);
   }

   protected _mousedownPage(ev: SyntheticEvent<Event>): void {
      this.registers.mousedown.start(ev);
      this.popupManager.mouseDownHandler(ev);
   }

   protected _mouseupPage(ev: SyntheticEvent<Event>): void {
      this.registers.mouseup.start(ev);
   }

   // tslint:disable-next-line:no-empty
   protected _keyPressHandler(event: SyntheticEvent<Event>): void { }

   // tslint:disable-next-line:no-empty
   protected _suggestStateChangedHandler(event: Event): void { }

   protected _registerHandler(
      event: Event,
      registerType: string,
      component: Control,
      callback: Function,
      config: object
   ): void {
      if (this.registers[registerType]) {
         this.registers[registerType].register(
            event,
            registerType,
            component,
            callback,
            config
         );
         return;
      }
      this.dragnDropController.registerHandler(
         event,
         registerType,
         component,
         callback,
         config
      );
   }

   protected _unregisterHandler(
      event: Event,
      registerType: string,
      component: Control,
      config: object
   ): void {
      if (this.registers[registerType]) {
         this.registers[registerType].unregister(
            event,
            registerType,
            component,
            config
         );
         return;
      }
      this.dragnDropController.unregisterHandler(
         event,
         registerType,
         component,
         config
      );
   }

   protected _popupEventHandler(
      event: Event,
      action: string,
      ...args: unknown[]
   ): void {
      this.popupManager.eventHandler.apply(this.popupManager, [action, args]);
   }

   protected _updateDraggingTemplate(
      event: Event,
      draggingTemplateOptions: IDragObject,
      draggingTemplate: TemplateFunction
   ): void {
      this.dragnDropController.updateDraggingTemplate(
         draggingTemplateOptions,
         draggingTemplate
      );
   }

   protected _documentDragStart(event: Event, dragObject: IDragObject): void {
      this.dragnDropController.documentDragStart(dragObject);
   }

   protected _documentDragEnd(event: Event, dragObject: IDragObject): void {
      this.dragnDropController.documentDragEnd(dragObject);
   }

   private createRegisters(): void {
      const registers = [
         'scroll',
         'controlResize',
         'mousemove',
         'mouseup',
         'touchmove',
         'touchend',
         'mousedown'
      ];
      registers.forEach((register) => {
         this.registers[register] = new RegisterClass({ register });
      });
   }

   private createDragnDropController(): void {
      this.dragnDropController = new ControllerClass();
   }

   private createGlobalPopup(): void {
      this.globalPopup = new GlobalController();
   }

   private createPopupManager(cfg: object): void {
      this.popupManager = new ManagerClass(cfg);
   }
}
