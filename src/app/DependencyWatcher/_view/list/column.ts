import { ListItem } from "../../_data/types";

/**
 * @typedef {Object} IColumn
 * @property {String} [width] Column width. Supported the value specified in pixels (for example, 4px) or percent (for example, 50%) and the value “auto”.
 * @property {String} [displayProperty] Name of the field that will shown in the column by default.
 * @property {String} [template] Template for cell rendering.
 * @property {String} [resultTemplate] Template for cell rendering in results row. CSS class controls-Grid__header-cell_spacing_money sets the right indent for the content of the header cell to align by integers in money fields.
 * @property {GridCellAlign} [align] Horizontal cell content align.
 * @property {GridCellVAlign} [valign] Vertical cell content align.
 * @property {String} [stickyProperty] The name of the field used to sticking the column data.
 * @property {TextOverflow} [textOverflow] Defines the visibility parameters of the text in the block, if the entire text does not fit in the specified area.
 */
export interface IColumn<TItem extends ListItem = ListItem> {
    displayProperty: keyof TItem;
    width: string;
    align: string;
    valign: string;
    stickyProperty: string;
    template: Function | string;
    resultTemplate: Function | string;
}

export type Columns<
    TItem extends ListItem = ListItem,
    TColumn extends IColumn<TItem> = IColumn<TItem>
> = Array<Partial<TColumn>>
