/**
 * Library of controls used on the "Elements" tab.
 * @author Зайцев А.С.
 */
export { default as Elements } from './_Elements/Elements';
export { default as Store, applyOperation } from './_store/Store';

export { default as StringTemplate } from 'Elements/_Details/Pane/templates/StringTemplate';
export { default as BooleanTemplate } from 'Elements/_Details/Pane/templates/BooleanTemplate';
export { default as NumberTemplate } from 'Elements/_Details/Pane/templates/NumberTemplate';
export { default as ObjectTemplate } from 'Elements/_Details/Pane/templates/ObjectTemplate';
import * as UndefinedTemplate from 'wml!Elements/_Details/Pane/templates/UndefinedTemplate';
export {
    UndefinedTemplate
};
