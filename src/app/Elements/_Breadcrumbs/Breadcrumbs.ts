import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import template = require('wml!Elements/_Breadcrumbs/Breadcrumbs');
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';
import { descriptor } from 'Types/entity';
import 'css!Elements/elements';

interface IOptions extends IControlOptions {
   items: Array<{
      id: IFrontendControlNode['id'];
      name: IFrontendControlNode['name'];
      class?: string;
   }>;
   selectedItemId: IFrontendControlNode['id'];
}

/**
 * Renders breadcrumbs.
 * @author Зайцев А.С.
 */
class Breadcrumbs extends Control<IOptions> {
   protected _template: TemplateFunction = template;
   protected _shouldScrollToElement: boolean = false;

   protected _afterMount(): void {
      this.__scrollToElement();
   }

   protected _beforeUpdate(options: IOptions): void {
      if (this._options.selectedItemId !== options.selectedItemId) {
         this._shouldScrollToElement = true;
      }
   }

   protected _afterRender(): void {
      if (this._shouldScrollToElement) {
         this._shouldScrollToElement = false;
         this.__scrollToElement();
      }
   }

   protected _onItemClick(e: Event, id: IFrontendControlNode['id']): void {
      this._notify('itemClick', [id]);
   }

   protected _wheelHandler(e: Event): void {
      const nativeEvent: WheelEvent = e.nativeEvent;
      if (!nativeEvent.shiftKey) {
         this._container.scrollLeft += nativeEvent.deltaY;
      }
   }

   protected _onMouseEnter(e: Event, id: IFrontendControlNode['id']): void {
      this._notify('itemMouseEnter', [id]);
   }

   protected _onMouseLeave(e: Event, id: IFrontendControlNode['id']): void {
      this._notify('itemMouseLeave', [id]);
   }

   private __scrollToElement(): void {
      const selectedChild = this._children[this._options.selectedItemId];
      if (selectedChild instanceof HTMLElement) {
         selectedChild.scrollIntoView({
            inline: 'end'
         });
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         items: descriptor(Array).required(),
         selectedItemId: descriptor(Number).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export { IOptions };

export default Breadcrumbs;
