/**
 * Types for headers in Wasaby lists.
 * @author Зайцев А.С.
 */
export interface IColumn<TItem extends object> {
   displayProperty: keyof TItem;
   width: string;
   align: string;
   valign: string;
   stickyProperty: string;
   template: Function | string;
   resultTemplate: Function | string;
}

export type IColumns<TItem extends object> = Array<Partial<IColumn<TItem>>>;
