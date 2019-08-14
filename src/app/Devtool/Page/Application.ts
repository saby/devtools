import { Control, IControlOptions,  } from 'UI/Base';
import { _scrollContext } from 'Controls/scroll';
import { SyntheticEvent } from 'Vdom/Vdom';
import * as template from 'wml!Devtool/Page/Application';

interface EventDetect<TOptions, TState> extends  Control<TOptions, TState> {
    start(ev: Event): void;
}

interface IChildren<
    TOptions extends IControlOptions = {},
    TState = void
> extends Record<string, Control<TOptions, TState> | HTMLElement> {
    scrollDetect: EventDetect<TOptions, TState>;
    resizeDetect: EventDetect<TOptions, TState>;
    mousemoveDetect: EventDetect<TOptions, TState>;
    touchmoveDetect: EventDetect<TOptions, TState>;
    touchendDetect: EventDetect<TOptions, TState>;
    mousedownDetect: EventDetect<TOptions, TState>;
    mouseupDetect: EventDetect<TOptions, TState>;
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
export default class Application<TState = void>
    extends Control<IApplicationOptions, TState>
{
    protected _template = template;
    protected _scrollContext: _scrollContext;
    _children: IChildren<IApplicationOptions, TState>;
    protected _beforeMount(cfg: IApplicationOptions) {
        this._scrollContext = new _scrollContext({
            pagingVisible: false
        });
    }
    protected _beforeUpdate(cfg: IApplicationOptions) {
        if (this._scrollContext.pagingVisible !== cfg.pagingVisible) {
            this._scrollContext.pagingVisible = cfg.pagingVisible;
            this._scrollContext.updateConsumers();
        }
    }
    protected _getChildContext() {
        return {
            ScrollData: this._scrollContext
        };
    }
    protected _scrollPage(ev: Event) {
        this._children.scrollDetect.start(ev);
    }
    protected _resizePage(ev: Event) {
        this._children.resizeDetect.start(ev);
    }
    protected _mousemovePage(ev: Event) {
        this._children.mousemoveDetect.start(ev);
    }
    protected _touchmovePage(ev: Event) {
        this._children.touchmoveDetect.start(ev);
    }
    protected _touchendPage(ev: Event) {
        this._children.touchendDetect.start(ev);
    }
    protected _mousedownPage(ev: Event) {
        this._children.mousedownDetect.start(ev);
    }
    protected _mouseupPage(ev: Event) {
        this._children.mouseupDetect.start(ev);
    }
    protected _keyPressHandler(event: SyntheticEvent<Event>) {
    }
    protected _suggestStateChangedHandler(event: Event) {
    }
}
