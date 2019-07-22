// @ts-ignore
import * as pathTemplate from 'wml!DependencyWatcher/template/column/file';
// @ts-ignore
import * as definedTemplate from 'wml!DependencyWatcher/template/column/initialized';
// @ts-ignore
import * as isDynamicTemplate from 'wml!DependencyWatcher/template/column/isDynamic';
import SizeTemplate from "./column/Size";
import { IListItem } from "../../data";

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
export interface IColumn<TItem extends IListItem = IListItem> {
    displayProperty: keyof TItem;
    width: string;
    align: string;
    valign: string;
    stickyProperty: string;
    template: Function | string;
    resultTemplate: Function | string;
}

export type Columns<
    TItem extends IListItem = IListItem,
    TColumn extends IColumn<TItem> = IColumn<TItem>
> = Array<Partial<TColumn>>

export const name: Partial<IColumn> = {
     displayProperty: 'name',
     // template: ColumnTemplate
     // template: cfg.itemTemplate || nameTemplate
};
export const fileName: Partial<IColumn> = {
    displayProperty: 'fileName',
    template: pathTemplate
};
export const isDynamic: Partial<IColumn> = {
    width: '30px',
    align: 'center',
    template: isDynamicTemplate
};
export const initialized: Partial<IColumn> = {
    width: '55px',
    align: 'center',
    template: definedTemplate
};
export const size: Partial<IColumn> = {
    displayProperty: 'size',
    width: '100px',
    align: 'right',
    template: SizeTemplate
};

export const columns: Columns = [
    name,
    fileName,
    isDynamic,
    initialized,
    size
];
