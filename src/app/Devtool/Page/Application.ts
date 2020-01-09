import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { _scrollContext } from 'Controls/scroll';
import { SyntheticEvent } from 'Vdom/Vdom';
import template = require('wml!Devtool/Page/Application');

interface IEventDetect<TOptions> extends Control<TOptions> {
   start(ev: Event): void;
}

interface IChildren<TOptions extends IControlOptions = {}>
   extends Record<string, Control<TOptions> | HTMLElement> {
   scrollDetect: IEventDetect<TOptions>;
   resizeDetect: IEventDetect<TOptions>;
   mousemoveDetect: IEventDetect<TOptions>;
   touchmoveDetect: IEventDetect<TOptions>;
   touchendDetect: IEventDetect<TOptions>;
   mousedownDetect: IEventDetect<TOptions>;
   mouseupDetect: IEventDetect<TOptions>;
}

interface IApplicationOptions extends IControlOptions {
   pagingVisible: unknown;
}

/*
 * перенос частичной логики Core/Application для работоспособности контролов
 * https://online.sbis.ru/opendoc.html?guid=cb550f66-af72-4bfc-80ec-f279eed498c7
 * TODO убрать после:
 *  https://online.sbis.ru/opendoc.html?guid=156aa5b7-286b-4885-9088-56c835816229
 */
export default class Application extends Control<IApplicationOptions> {
   protected _template: TemplateFunction = template;
   protected _scrollContext: _scrollContext;
   _children: IChildren<IApplicationOptions>;
   protected _beforeMount(cfg: IApplicationOptions): void {
      this._scrollContext = new _scrollContext({
         pagingVisible: false
      });
   }
   protected _afterMount(): void {
      document.body.onresize = (event: Event) => {
         this._resizePage(new SyntheticEvent(event));
      };
   }
   protected _beforeUnmount(): void {
      document.body.onresize = null;
   }

   protected _beforeUpdate(cfg: IApplicationOptions): void {
      if (this._scrollContext.pagingVisible !== cfg.pagingVisible) {
         this._scrollContext.pagingVisible = cfg.pagingVisible;
         this._scrollContext.updateConsumers();
      }
   }

   protected _getChildContext(): object {
      return {
         ScrollData: this._scrollContext
      };
   }

   protected _scrollPage(ev: SyntheticEvent<Event>): void {
      this._children.scrollDetect.start(ev);
   }

   protected _resizePage(ev: SyntheticEvent<Event>): void {
      this._children.resizeDetect.start(ev);
   }

   protected _mousemovePage(ev: SyntheticEvent<Event>): void {
      this._children.mousemoveDetect.start(ev);
   }

   protected _touchmovePage(ev: SyntheticEvent<Event>): void {
      this._children.touchmoveDetect.start(ev);
   }

   protected _touchendPage(ev: SyntheticEvent<Event>): void {
      this._children.touchendDetect.start(ev);
   }

   protected _mousedownPage(ev: SyntheticEvent<Event>): void {
      this._children.mousedownDetect.start(ev);
   }

   protected _mouseupPage(ev: SyntheticEvent<Event>): void {
      this._children.mouseupDetect.start(ev);
   }

    // tslint:disable-next-line:no-empty
   protected _keyPressHandler(event: SyntheticEvent<Event>): void {}

    // tslint:disable-next-line:no-empty
   protected _suggestStateChangedHandler(event: Event): void {}
}
