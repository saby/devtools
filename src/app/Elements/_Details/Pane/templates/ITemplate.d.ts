import { IControlOptions } from 'UI/Base';
/**
 * Base interface for template options.
 * @author Зайцев А.С.
 */
export interface ITemplateOptions extends IControlOptions {
   key: string;
   name: string | number;
   caption: unknown;
   itemData: object;
}
