/**
 * Utils for the focus plugin.
 * Most of the file is taken from the UI/Focus library and then patched to also find broken elements.
 * @author Зайцев А.С.
 */
import { IElementFinder, IFocusElementProps } from '../Focus';

const FOCUSABLE_ELEMENTS = new Set([
   'a',
   'link',
   'button',
   'input',
   'select',
   'textarea'
]);

function getTabIndex(element: Element): number | void {
   const tabIndexAttr = element.getAttribute('tabindex');
   if (tabIndexAttr !== null) {
      return parseInt(tabIndexAttr, 10);
   }
}

export function isBrokenLink(element: Element): boolean {
   if (element.tagName === 'A') {
      const tabindex = getTabIndex(element);
      const hasTabIndex = typeof tabindex !== 'undefined';
      const hasHref = element.hasAttribute('href');
      if (tabindex < 0) {
         return true;
      }
      if (hasTabIndex) {
         return false;
      }
      return !hasHref;
   } else {
      return false;
   }
}

export function canAcceptSelfFocus(element: Element): boolean {
   if (FOCUSABLE_ELEMENTS.has(element.tagName.toLowerCase())) {
      return true;
   } else {
      return (
         getTabIndex(element) >= 0 &&
         element.hasAttribute('contenteditable') &&
         element.getAttribute('contenteditable') !== 'false'
      );
   }
}
