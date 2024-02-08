import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import * as template from 'wml!LogicParentPanel/_LogicParentPanel/LogicParentPanel';
import { descriptor } from 'Types/entity';
import { IFrontendControlNode } from 'Extension/Plugins/Elements/IControlNode';

interface IOptions extends IControlOptions {
   controlName: IFrontendControlNode['name'];
}

/**
 * Displays the name of the logic parent.
 * @author Зайцев А.С.
 */
class LogicParentPanel extends Control<IOptions> {
   protected _template: TemplateFunction = template;

   protected _notifyClick(): void {
      this._notify('itemClick');
   }

   protected _notifyHoveredItem(e: Event, state: boolean): void {
      this._notify('hoveredItemChanged', [state]);
   }

   protected _beforeUnmount(): void {
      this._notify('hoveredItemChanged', [false]);
   }

   static getOptionTypes(): Record<keyof IOptions, unknown> {
      return {
         controlName: descriptor(String).required(),
         readOnly: descriptor(Boolean),
         theme: descriptor(String)
      };
   }
}

export default LogicParentPanel;
