import { decycle } from 'Extension/Utils/decycle';

function isJqueryElement(value: unknown): boolean {
   return (
      typeof value === 'object' &&
      value !== null &&
      typeof value.length === 'number' &&
      value.length > 0 &&
      value[0] instanceof Element
   );
}

function replaceFunctions<T>(value: T): T | string {
   if (typeof value === 'function') {
      return `function ${value.name.replace('bound ', '')}`;
   }
   if (value instanceof Element) {
      // TODO: надо их вообще вырезать, либо делать какую-то подсветку
      return value.tagName;
   }
   if (isJqueryElement(value)) {
      // TODO: надо их вообще вырезать, либо делать какую-то подсветку
      return value[0].tagName;
   }
   return value;
}

const IGNORE_FIELDS = [
   '_logicParent',
   '_events',
   'controlNode',
   '_container',
   '__lastGetterPath'
];

/**
 * Prepares object for serialization: removes cycles, replaces functions with strings and removes unnecessary fields.
 * @param value Object which should be prepared.
 * @return The same object but safe for serialization.
 * @author Зайцев А.С.
 */
export default function prepareForSerialization(value: object): object {
   return decycle(value, {
      replacer: replaceFunctions,
      ignore: IGNORE_FIELDS
   });
}
