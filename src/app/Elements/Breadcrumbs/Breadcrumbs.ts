import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!Elements/Breadcrumbs/Breadcrumbs');
import { IControlNode } from 'shared/Extension/Plugins/Elements/IControlNode';
import { descriptor } from 'Types/entity';
import 'css!Elements/BreadCrumbs/BreadCrumbs';

interface IOptions extends IControlOptions {
   items: Array<{
      id: IControlNode['id'];
      name: IControlNode['name'];
      class: string;
   }>;
   selectedItemId: IControlNode['id'];
}

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

   protected _beforePaint(): void {
      if (this._shouldScrollToElement) {
         this._shouldScrollToElement = false;
         this.__scrollToElement();
      }
   }

   protected _onItemClick(e: Event, id: IControlNode['id']): void {
      this._notify('itemClick', [id]);
   }

   protected _wheelHandler(e: Event): void {
      const nativeEvent: WheelEvent = e.nativeEvent;
      if (!nativeEvent.shiftKey) {
         this._container.scrollLeft += nativeEvent.deltaY;
      }
   }

   protected _onMouseEnter(e: Event, id: IControlNode['id']): void {
      this._notify('itemMouseEnter', [id]);
   }

   protected _onMouseLeave(e: Event, id: IControlNode['id']): void {
      this._notify('itemMouseLeave', [id]);
   }

   private __scrollToElement(): void {
      const selectedChild = this._children[this._options.selectedItemId];
      if (selectedChild instanceof HTMLElement) {
         selectedChild.scrollIntoView({
            inline: 'nearest'
         });
      }
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         items: descriptor(Array).required(),
         selectedItemId: descriptor(String).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export { IOptions };

export default Breadcrumbs;
